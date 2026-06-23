import { query } from "../config/database.js";

export interface PolicyRuleRow {
  id: string;
  created_at: string;
  policy_id: string;
  name: string;
  threat_level: string;
  category: string | null;
  description: string | null;
}

const COLS = ["id", "created_at", "policy_id", "name", "threat_level", "category", "description"];

function row(r: any): PolicyRuleRow {
  return {
    id: r.id, created_at: r.created_at, policy_id: r.policy_id, name: r.name,
    threat_level: r.threat_level, category: r.category ?? null, description: r.description ?? null,
  };
}

export const policyRuleRepo = {
  async list(filters?: { threatLevel?: string; category?: string }) {
    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;
    if (filters?.threatLevel) { conditions.push(`threat_level = $${idx++}`); params.push(filters.threatLevel); }
    if (filters?.category) { conditions.push(`category = $${idx++}`); params.push(filters.category); }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const r = await query(`SELECT ${COLS.join(",")} FROM policy_rules ${where} ORDER BY threat_level DESC, name`);
    return r.rows.map(row);
  },

  async getById(id: string) {
    const r = await query(`SELECT ${COLS.join(",")} FROM policy_rules WHERE id = $1`, [id]);
    return r.rows.length ? row(r.rows[0]) : null;
  },

  async create(data: { policyId: string; name: string; threatLevel: string; category?: string; description?: string }) {
    const r = await query(
      `INSERT INTO policy_rules (policy_id, name, threat_level, category, description)
       VALUES ($1,$2,$3,$4,$5) RETURNING ${COLS.join(",")}`,
      [data.policyId, data.name, data.threatLevel, data.category || null, data.description || null]
    );
    return row(r.rows[0]);
  },

  async update(id: string, data: { name?: string; threatLevel?: string; category?: string; description?: string }) {
    const fields: string[] = [];
    const params: any[] = [];
    let idx = 1;
    if (data.name !== undefined) { fields.push(`name = $${idx++}`); params.push(data.name); }
    if (data.threatLevel !== undefined) { fields.push(`threat_level = $${idx++}`); params.push(data.threatLevel); }
    if (data.category !== undefined) { fields.push(`category = $${idx++}`); params.push(data.category); }
    if (data.description !== undefined) { fields.push(`description = $${idx++}`); params.push(data.description); }
    if (!fields.length) return null;
    params.push(id);
    const r = await query(
      `UPDATE policy_rules SET ${fields.join(", ")} WHERE id = $${idx} RETURNING ${COLS.join(",")}`,
      params
    );
    return r.rows.length ? row(r.rows[0]) : null;
  },

  async delete(id: string) {
    const r = await query("DELETE FROM policy_rules WHERE id = $1", [id]);
    return (r.rowCount ?? 0) > 0;
  },
};
