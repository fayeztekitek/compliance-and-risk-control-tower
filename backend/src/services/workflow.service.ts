import { query } from "../config/database.js";

export interface Transition {
  from: string;
  to: string;
  allowed_roles: string[];
  label: string;
}

export const workflowService = {
  async listDefinitions(entityType?: string) {
    const cond = entityType ? "WHERE entity_type = $1" : "";
    const params = entityType ? [entityType] : [];
    const r = await query(`SELECT * FROM workflow_definitions ${cond} ORDER BY name`, params);
    return r.rows.map(row => ({
      id: row.id, name: row.name, description: row.description,
      entityType: row.entity_type, states: row.states,
      initialState: row.initial_state, transitions: row.transitions as Transition[],
      active: row.active, createdAt: row.created_at,
    }));
  },

  async listInstances(entityType?: string, status?: string) {
    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;
    if (entityType) { conditions.push(`wi.entity_type = $${idx++}`); params.push(entityType); }
    if (status) { conditions.push(`wi.status = $${idx++}`); params.push(status); }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const r = await query(`
      SELECT wi.*, wd.name AS definition_name
      FROM workflow_instances wi
      JOIN workflow_definitions wd ON wd.id = wi.definition_id
      ${where} ORDER BY wi.created_at DESC
    `, params);
    return r.rows.map(row => ({
      id: row.id, definitionId: row.definition_id, definitionName: row.definition_name,
      entityId: row.entity_id, entityType: row.entity_type,
      currentState: row.current_state, status: row.status,
      assignee: row.assignee, dueDate: row.due_date,
      metadata: row.metadata, createdAt: row.created_at, updatedAt: row.updated_at,
    }));
  },

  async getInstance(id: string) {
    const r = await query(`
      SELECT wi.*, wd.name AS definition_name, wd.states, wd.transitions
      FROM workflow_instances wi
      JOIN workflow_definitions wd ON wd.id = wi.definition_id
      WHERE wi.id = $1
    `, [id]);
    if (!r.rows.length) return null;
    const row = r.rows[0];
    return {
      id: row.id, definitionId: row.definition_id, definitionName: row.definition_name,
      entityId: row.entity_id, entityType: row.entity_type,
      currentState: row.current_state, status: row.status,
      assignee: row.assignee, dueDate: row.due_date,
      metadata: row.metadata, states: row.states,
      transitions: row.transitions as Transition[],
      createdAt: row.created_at, updatedAt: row.updated_at,
    };
  },

  async getAuditLog(instanceId: string) {
    const r = await query(
      "SELECT * FROM workflow_audit_log WHERE instance_id = $1 ORDER BY created_at DESC",
      [instanceId]
    );
    return r.rows.map(row => ({
      id: row.id, instanceId: row.instance_id,
      fromState: row.from_state, toState: row.to_state,
      action: row.action, actor: row.actor,
      comment: row.comment, createdAt: row.created_at,
    }));
  },

  async startInstance(definitionId: string, entityId: string, entityType: string, assignee?: string, dueDate?: string, metadata?: any) {
    const def = await query("SELECT * FROM workflow_definitions WHERE id = $1", [definitionId]);
    if (!def.rows.length) throw new Error("Workflow definition not found");
    const initialState = def.rows[0].initial_state;

    const r = await query(
      `INSERT INTO workflow_instances (definition_id, entity_id, entity_type, current_state, assignee, due_date, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [definitionId, entityId, entityType, initialState, assignee || null, dueDate || null, JSON.stringify(metadata || {})]
    );

    // Log initial state
    await query(
      `INSERT INTO workflow_audit_log (instance_id, from_state, to_state, action, actor)
       VALUES ($1, NULL, $2, 'STARTED', $3)`,
      [r.rows[0].id, initialState, assignee || null]
    );

    return this.getInstance(r.rows[0].id);
  },

  async transition(instanceId: string, toState: string, actor?: string, comment?: string) {
    const instance = await this.getInstance(instanceId);
    if (!instance) throw new Error("Workflow instance not found");
    if (instance.status !== "ACTIVE") throw new Error("Workflow is not active");

    // Validate transition
    const valid = (instance.transitions || []).find(
      (t: Transition) => t.from === instance.currentState && t.to === toState
    );
    if (!valid) throw new Error(
      `Invalid transition: ${instance.currentState} → ${toState}. Valid: ${
        (instance.transitions || [])
          .filter((t: Transition) => t.from === instance.currentState)
          .map((t: Transition) => t.to).join(", ")
      }`
    );

    await query(
      "UPDATE workflow_instances SET current_state = $1, updated_at = NOW() WHERE id = $2",
      [toState, instanceId]
    );

    await query(
      `INSERT INTO workflow_audit_log (instance_id, from_state, to_state, action, actor, comment)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [instanceId, instance.currentState, toState, valid.label || "TRANSITION", actor || null, comment || null]
    );

    return this.getInstance(instanceId);
  },

  async setStatus(instanceId: string, status: string) {
    await query("UPDATE workflow_instances SET status = $1, updated_at = NOW() WHERE id = $2", [status, instanceId]);
    return this.getInstance(instanceId);
  },

  async updateInstance(instanceId: string, data: { assignee?: string; dueDate?: string; metadata?: any }) {
    const fields: string[] = []; const params: any[] = []; let idx = 1;
    if (data.assignee !== undefined) { fields.push(`assignee=$${idx++}`); params.push(data.assignee); }
    if (data.dueDate !== undefined) { fields.push(`due_date=$${idx++}`); params.push(data.dueDate); }
    if (data.metadata !== undefined) { fields.push(`metadata=$${idx++}`); params.push(JSON.stringify(data.metadata)); }
    if (!fields.length) return this.getInstance(instanceId);
    params.push(instanceId);
    await query(`UPDATE workflow_instances SET ${fields.join(",")} WHERE id=$${idx}`, params);
    return this.getInstance(instanceId);
  },

  async getAvailableTransitions(definitionId: string, currentState: string) {
    const def = await query("SELECT transitions FROM workflow_definitions WHERE id = $1", [definitionId]);
    if (!def.rows.length) return [];
    const transitions: Transition[] = def.rows[0].transitions || [];
    return transitions.filter(t => t.from === currentState);
  },
};
