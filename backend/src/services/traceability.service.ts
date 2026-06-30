import { query } from "../config/database.js";

export type EntityType =
  | "project" | "roadmap" | "milestone" | "risk"
  | "finding" | "audit" | "capa" | "committee"
  | "decision" | "steerco_meeting" | "application"
  | "vulnerability" | "obligation";

const FK_RELATIONS: Record<string, { type: string; sql: string }[]> = {
  project: [
    { type: "roadmap", sql: "SELECT 'roadmap' AS entity_type, roadmap_id::text AS entity_id, r.name AS entity_name FROM projects p JOIN roadmaps r ON r.id = p.roadmap_id WHERE p.id = $1 AND p.roadmap_id IS NOT NULL" },
    { type: "milestone", sql: "SELECT 'milestone' AS entity_type, id::text AS entity_id, title AS entity_name FROM project_milestones WHERE project_id = $1" },
    { type: "risk", sql: "SELECT 'risk' AS entity_type, id::text AS entity_id, title AS entity_name FROM project_risks WHERE project_id = $1" },
    { type: "steerco_meeting", sql: "SELECT 'steerco_meeting' AS entity_type, id::text AS entity_id, title AS entity_name FROM steerco_meetings WHERE project_id = $1" },
  ],
  roadmap: [
    { type: "project", sql: "SELECT 'project' AS entity_type, id::text AS entity_id, name AS entity_name FROM projects WHERE roadmap_id = $1 AND deleted_at IS NULL" },
  ],
  steerco_meeting: [
    { type: "decision", sql: "SELECT 'decision' AS entity_type, id::text AS entity_id, title AS entity_name FROM steerco_decisions WHERE meeting_id = $1" },
    { type: "action_item", sql: "SELECT 'action_item' AS entity_type, id::text AS entity_id, title AS entity_name FROM steerco_action_items WHERE meeting_id = $1" },
  ],
};

export const traceabilityService = {
  async getRelated(entityType: string, entityId: string) {
    const fkRelations = FK_RELATIONS[entityType] || [];
    const fkResults = await Promise.all(
      fkRelations.map(r => query(r.sql, [entityId]))
    );
    const fkItems = fkResults.flatMap((r, i) =>
      r.rows.map((row: any) => ({
        id: row.entity_id,
        type: fkRelations[i].type as EntityType,
        name: row.entity_name,
        relationship: "FK",
      }))
    );

    // Manual trace_links (both directions)
    const [outbound, inbound] = await Promise.all([
      query(`
        SELECT tl.id, tl.target_type AS type, tl.target_id AS id, tl.relationship_type, tl.label,
          COALESCE(tl.label, tl.relationship_type) AS name
        FROM trace_links tl WHERE tl.source_type = $1 AND tl.source_id = $2::uuid
      `, [entityType, entityId]),
      query(`
        SELECT tl.id, tl.source_type AS type, tl.source_id AS id, tl.relationship_type, tl.label,
          COALESCE(tl.label, tl.relationship_type) AS name
        FROM trace_links tl WHERE tl.target_type = $1 AND tl.target_id = $2::uuid
      `, [entityType, entityId]),
    ]);

    const manualLinks = [
      ...outbound.rows.map(r => ({ id: r.id, type: r.type, name: r.name, relationship: r.relationship_type })),
      ...inbound.rows.map(r => ({ id: r.id, type: r.type, name: r.name, relationship: r.relationship_type })),
    ];

    return [...fkItems, ...manualLinks];
  },

  async addLink(sourceType: string, sourceId: string, targetType: string, targetId: string, relationshipType?: string, label?: string) {
    await query(
      `INSERT INTO trace_links (source_type, source_id, target_type, target_id, relationship_type, label)
       VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING RETURNING id`,
      [sourceType, sourceId, targetType, targetId, relationshipType || "RELATED_TO", label || null]
    );
  },

  async removeLink(linkId: string) {
    await query("DELETE FROM trace_links WHERE id = $1", [linkId]);
  },

  async listEntityTypes() {
    return Object.keys(FK_RELATIONS).sort();
  },
};
