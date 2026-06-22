import { query } from "../config/database.js";

const FO_COLS = [
  "id", "created_at", "updated_at",
  "finding_id", "component_id",
  "path", "module", "scope",
  "first_detected_date", "last_detected_date", "occurrence_status",
];

function foRow(r: any) {
  return {
    id: r.id, createdAt: r.created_at, updatedAt: r.updated_at,
    findingId: r.finding_id, componentId: r.component_id,
    path: r.path, module: r.module, scope: r.scope,
    firstDetectedDate: r.first_detected_date, lastDetectedDate: r.last_detected_date,
    occurrenceStatus: r.occurrence_status,
  };
}

export const findingOccurrenceRepo = {
  async list(filters: {
    page: number; limit: number;
    findingId?: string; componentId?: string; status?: string;
  }) {
    const params: any[] = [];
    let idx = 1;
    const conds: string[] = [];

    if (filters.findingId) { conds.push(`finding_id = $${idx++}`); params.push(filters.findingId); }
    if (filters.componentId) { conds.push(`component_id = $${idx++}`); params.push(filters.componentId); }
    if (filters.status) { conds.push(`occurrence_status = $${idx++}`); params.push(filters.status); }

    const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
    const offset = (filters.page - 1) * filters.limit;

    const countResult = await query<{ count: string }>(`SELECT COUNT(*) FROM finding_occurrences ${where}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    const dataResult = await query(
      `SELECT ${FO_COLS.join(", ")} FROM finding_occurrences ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, filters.limit, offset]
    );

    return { data: dataResult.rows.map(foRow), total, page: filters.page, limit: filters.limit };
  },

  async get(id: string) {
    const result = await query(
      `SELECT ${FO_COLS.join(", ")} FROM finding_occurrences WHERE id = $1`,
      [id]
    );
    return result.rows.length ? foRow(result.rows[0]) : null;
  },

  async listByFinding(findingId: string, filters: { page: number; limit: number }) {
    return this.list({ ...filters, findingId });
  },

  async listByComponent(componentId: string, filters: { page: number; limit: number }) {
    return this.list({ ...filters, componentId });
  },

  async create(data: {
    findingId: string; componentId?: string;
    path?: string; module?: string; scope?: string;
  }) {
    const result = await query(
      `INSERT INTO finding_occurrences (finding_id, component_id, path, module, scope)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING ${FO_COLS.join(", ")}`,
      [data.findingId, data.componentId || null, data.path || null, data.module || null, data.scope || null]
    );
    return foRow(result.rows[0]);
  },

  async update(id: string, data: {
    path?: string; module?: string; scope?: string;
    componentId?: string; occurrenceStatus?: string;
    lastDetectedDate?: string;
  }) {
    const fields: string[] = [];
    const params: any[] = [];
    let idx = 1;

    const mapping: Record<string, string> = {
      path: "path", module: "module", scope: "scope",
      componentId: "component_id", occurrenceStatus: "occurrence_status",
      lastDetectedDate: "last_detected_date",
    };

    for (const [key, col] of Object.entries(mapping)) {
      if (data[key as keyof typeof data] !== undefined) {
        fields.push(`${col} = $${idx++}`);
        params.push(data[key as keyof typeof data]);
      }
    }
    if (!fields.length) return null;

    params.push(id);
    const result = await query(
      `UPDATE finding_occurrences SET ${fields.join(", ")} WHERE id = $${idx} RETURNING ${FO_COLS.join(", ")}`,
      params
    );
    return result.rows.length ? foRow(result.rows[0]) : null;
  },

  async delete(id: string) {
    await query("DELETE FROM finding_occurrences WHERE id = $1", [id]);
  },

  async bulkCreate(occurrences: any[]) {
    if (!occurrences.length) return [];
    const client = (await import("../config/database.js")).getClient;
    const conn = await client();
    try {
      await conn.query("BEGIN");
      const results: any[] = [];
      for (const occ of occurrences) {
        const result = await conn.query(
          `INSERT INTO finding_occurrences (finding_id, component_id, path, module, scope)
           VALUES ($1, $2, $3, $4, $5) RETURNING ${FO_COLS.join(", ")}`,
          [occ.findingId, occ.componentId || null, occ.path || null, occ.module || null, occ.scope || null]
        );
        results.push(foRow(result.rows[0]));
      }
      await conn.query("COMMIT");
      return results;
    } catch (err) {
      await conn.query("ROLLBACK");
      throw err;
    } finally {
      conn.release();
    }
  },

  async getDistinctCount(applicationId?: string): Promise<number> {
    let sql = "SELECT COUNT(DISTINCT finding_id) as count FROM finding_occurrences WHERE occurrence_status = 'ACTIVE'";
    const params: any[] = [];
    if (applicationId) {
      sql = `SELECT COUNT(DISTINCT fo.finding_id) as count
             FROM finding_occurrences fo
             JOIN unified_findings uf ON uf.id = fo.finding_id
             WHERE fo.occurrence_status = 'ACTIVE' AND uf.application_id = $1`;
      params.push(applicationId);
    }
    const result = await query<{ count: string }>(sql, params);
    return parseInt(result.rows[0]?.count || "0", 10);
  },

  async getTotalOccurrences(applicationId?: string): Promise<number> {
    let sql = "SELECT COUNT(*) as count FROM finding_occurrences WHERE occurrence_status = 'ACTIVE'";
    const params: any[] = [];
    if (applicationId) {
      sql = `SELECT COUNT(*) as count
             FROM finding_occurrences fo
             JOIN unified_findings uf ON uf.id = fo.finding_id
             WHERE fo.occurrence_status = 'ACTIVE' AND uf.application_id = $1`;
      params.push(applicationId);
    }
    const result = await query<{ count: string }>(sql, params);
    return parseInt(result.rows[0]?.count || "0", 10);
  },

  async getByFindingAndComponent(findingId: string, componentId: string) {
    const result = await query(
      `SELECT ${FO_COLS.join(", ")} FROM finding_occurrences WHERE finding_id = $1 AND component_id = $2`,
      [findingId, componentId]
    );
    return result.rows.map(foRow);
  },
};
