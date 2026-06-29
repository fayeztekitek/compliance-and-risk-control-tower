import { query } from "../../config/database.js";
import { eventBus } from "../../core/events/eventBus.js";
import { storeEvent } from "../../core/events/eventStore.js";
import { DomainEvent } from "../../core/events/types.js";
import { logger } from "../../core/logger.js";

export interface WorkflowTransition {
  from: string;
  to: string;
  action: string;
  guards?: string[];
  effects?: string[];
}

export interface WorkflowState {
  name: string;
  label: string;
  type: "initial" | "intermediate" | "final";
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  entityType: string;
  states: WorkflowState[];
  transitions: WorkflowTransition[];
}

export interface WorkflowInstance {
  id: string;
  definitionId: string;
  entityType: string;
  entityId: string;
  currentState: string;
  context: Record<string, any>;
  status: string;
}

class WorkflowEngine {
  async createDefinition(params: {
    name: string;
    description?: string;
    entityType: string;
    states: WorkflowState[];
    transitions: WorkflowTransition[];
  }): Promise<string> {
    const result = await query(`
      INSERT INTO workflow_definitions (name, description, entity_type, states, transitions)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [
      params.name,
      params.description || null,
      params.entityType,
      JSON.stringify(params.states),
      JSON.stringify(params.transitions),
    ]);
    return result.rows[0].id;
  }

  async getDefinition(name: string): Promise<WorkflowDefinition | null> {
    const result = await query(`
      SELECT id, name, entity_type AS "entityType", states, transitions
      FROM workflow_definitions WHERE name = $1 AND enabled = true
    `, [name]);
    if (!result.rows.length) return null;
    const row = result.rows[0];
    return { id: row.id, name: row.name, entityType: row.entityType, states: row.states, transitions: row.transitions };
  }

  async startInstance(params: {
    definitionName: string;
    entityType: string;
    entityId: string;
    context?: Record<string, any>;
  }): Promise<string> {
    const def = await this.getDefinition(params.definitionName);
    if (!def) throw new Error(`Workflow definition not found: ${params.definitionName}`);
    const initialState = def.states.find((s) => s.type === "initial");
    if (!initialState) throw new Error(`No initial state in definition: ${params.definitionName}`);

    const result = await query(`
      INSERT INTO workflow_instances (definition_id, entity_type, entity_id, current_state, context)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [def.id, params.entityType, params.entityId, initialState.name, JSON.stringify(params.context || {})]);

    const instanceId = result.rows[0].id;
    await eventBus.publish({
      eventType: "workflow.instance.started",
      aggregateType: "workflow",
      aggregateId: instanceId,
      data: { definitionName: params.definitionName, entityType: params.entityType, entityId: params.entityId, initialState: initialState.name },
    });
    return instanceId;
  }

  async transition(params: {
    instanceId: string;
    action: string;
    actorId?: string;
    comment?: string;
    context?: Record<string, any>;
  }): Promise<{ success: boolean; fromState: string; toState: string }> {
    const instance = await this.getInstance(params.instanceId);
    if (!instance) throw new Error(`Instance not found: ${params.instanceId}`);
    if (instance.status !== "ACTIVE") throw new Error(`Instance ${params.instanceId} is not ACTIVE`);

    const def = await this.getDefinitionById(instance.definitionId);
    if (!def) throw new Error(`Definition not found for instance: ${params.instanceId}`);

    const transition = def.transitions.find(
      (t) => t.from === instance.currentState && t.action === params.action
    );
    if (!transition) {
      throw new Error(
        `No transition from "${instance.currentState}" with action "${params.action}"`
      );
    }

    const toState = transition.to;
    const newContext = params.context ? { ...instance.context, ...params.context } : instance.context;
    const isFinal = def.states.find((s) => s.name === toState)?.type === "final";

    await query(`
      UPDATE workflow_instances
      SET current_state = $1, context = $2, status = $3, updated_at = NOW(), completed_at = $4
      WHERE id = $5
    `, [
      toState,
      JSON.stringify(newContext),
      isFinal ? "COMPLETED" : "ACTIVE",
      isFinal ? new Date().toISOString() : null,
      params.instanceId,
    ]);

    await query(`
      INSERT INTO workflow_actions (instance_id, action, from_state, to_state, actor_id, comment)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [params.instanceId, params.action, instance.currentState, toState, params.actorId || null, params.comment || null]);

    await storeEvent({
      eventType: `workflow.transition.${params.action}`,
      aggregateType: "workflow",
      aggregateId: params.instanceId,
      data: { fromState: instance.currentState, toState, action: params.action, entityType: instance.entityType, entityId: instance.entityId },
    });

    logger.info({ instanceId: params.instanceId, action: params.action, fromState: instance.currentState, toState }, "Workflow transition");
    return { success: true, fromState: instance.currentState, toState };
  }

  private async getInstance(instanceId: string): Promise<WorkflowInstance | null> {
    const result = await query(`
      SELECT id, definition_id AS "definitionId", entity_type AS "entityType",
             entity_id AS "entityId", current_state AS "currentState", context, status
      FROM workflow_instances WHERE id = $1
    `, [instanceId]);
    if (!result.rows.length) return null;
    return result.rows[0];
  }

  private async getDefinitionById(id: string): Promise<WorkflowDefinition | null> {
    const result = await query(`
      SELECT id, name, entity_type AS "entityType", states, transitions
      FROM workflow_definitions WHERE id = $1
    `, [id]);
    if (!result.rows.length) return null;
    const row = result.rows[0];
    return { id: row.id, name: row.name, entityType: row.entityType, states: row.states, transitions: row.transitions };
  }

  async getInstanceHistory(instanceId: string) {
    const result = await query(`
      SELECT wa.created_at, wa.action, wa.from_state, wa.to_state, wa.actor_id, wa.comment, u.name AS actor_name
      FROM workflow_actions wa
      LEFT JOIN users u ON u.id = wa.actor_id
      WHERE wa.instance_id = $1
      ORDER BY wa.created_at ASC
    `, [instanceId]);
    return result.rows;
  }

  async getActiveInstances(entityType?: string) {
    const sql = entityType
      ? `SELECT * FROM workflow_instances WHERE status = 'ACTIVE' AND entity_type = $1 ORDER BY created_at DESC`
      : `SELECT * FROM workflow_instances WHERE status = 'ACTIVE' ORDER BY created_at DESC`;
    const params = entityType ? [entityType] : [];
    const result = await query(sql, params);
    return result.rows;
  }
}

export const workflowEngine = new WorkflowEngine();
