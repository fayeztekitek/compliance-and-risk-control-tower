import { query } from "../config/database.js";
import { NotFoundError } from "../core/errors.js";

const MIT_COLS = [
  "id", "created_at", "updated_at",
  "finding_id", "mitigation_type",
  "target_component_version", "target_release",
  "owner", "due_date", "status",
  "evidence", "verified_by", "verified_date", "notes",
];

function mitRow(r: any) {
  return {
    id: r.id, createdAt: r.created_at, updatedAt: r.updated_at,
    findingId: r.finding_id, mitigationType: r.mitigation_type,
    targetComponentVersion: r.target_component_version,
    targetRelease: r.target_release,
    owner: r.owner, dueDate: r.due_date, status: r.status,
    evidence: r.evidence, verifiedBy: r.verified_by,
    verifiedDate: r.verified_date, notes: r.notes,
  };
}

export const mitigationService = {
  async list(filters: {
    page: number; limit: number;
    findingId?: string; status?: string; owner?: string;
  }) {
    const params: any[] = [];
    let idx = 1;
    const conds: string[] = [];

    if (filters.findingId) { conds.push(`finding_id = $${idx++}`); params.push(filters.findingId); }
    if (filters.status) { conds.push(`status = $${idx++}`); params.push(filters.status); }
    if (filters.owner) { conds.push(`owner = $${idx++}`); params.push(filters.owner); }

    const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
    const offset = (filters.page - 1) * filters.limit;

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) FROM mitigations ${where}`, params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const dataResult = await query(
      `SELECT ${MIT_COLS.join(", ")} FROM mitigations ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, filters.limit, offset]
    );

    return { data: dataResult.rows.map(mitRow), total, page: filters.page, limit: filters.limit };
  },

  async get(id: string) {
    const result = await query(
      `SELECT ${MIT_COLS.join(", ")} FROM mitigations WHERE id = $1`,
      [id]
    );
    return result.rows.length ? mitRow(result.rows[0]) : null;
  },

  async propose(data: {
    findingId: string;
    mitigationType: string;
    targetComponentVersion?: string;
    targetRelease?: string;
    owner?: string;
    dueDate?: string;
    notes?: string;
  }) {
    const result = await query(
      `INSERT INTO mitigations (finding_id, mitigation_type, target_component_version, target_release, owner, due_date, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, 'PROPOSED', $7)
       RETURNING ${MIT_COLS.join(", ")}`,
      [
        data.findingId, data.mitigationType,
        data.targetComponentVersion || null, data.targetRelease || null,
        data.owner || null, data.dueDate || null, data.notes || null,
      ]
    );

    await query(
      "UPDATE unified_findings SET mitigation_id = $1 WHERE id = $2",
      [result.rows[0].id, data.findingId]
    );

    return mitRow(result.rows[0]);
  },

  async approve(id: string, verifiedBy: string) {
    const existing = await this.get(id);
    if (!existing) throw new NotFoundError("Mitigation", id);
    if (existing.status !== "PROPOSED") {
      throw new Error(`Cannot approve mitigation in status ${existing.status}`);
    }
    const result = await query(
      `UPDATE mitigations SET status = 'IN_PROGRESS', verified_by = $2, verified_date = NOW() WHERE id = $1 RETURNING ${MIT_COLS.join(", ")}`,
      [id, verifiedBy]
    );
    return mitRow(result.rows[0]);
  },

  async verify(id: string, evidence: string) {
    const existing = await this.get(id);
    if (!existing) throw new NotFoundError("Mitigation", id);
    if (existing.status !== "IN_PROGRESS") {
      throw new Error(`Cannot verify mitigation in status ${existing.status}`);
    }
    const result = await query(
      `UPDATE mitigations SET status = 'VERIFIED', evidence = $2 WHERE id = $1 RETURNING ${MIT_COLS.join(", ")}`,
      [id, evidence]
    );
    return mitRow(result.rows[0]);
  },

  async close(id: string) {
    const result = await query(
      `UPDATE mitigations SET status = 'CLOSED' WHERE id = $1 RETURNING ${MIT_COLS.join(", ")}`,
      [id]
    );
    if (!result.rows.length) throw new NotFoundError("Mitigation", id);
    return mitRow(result.rows[0]);
  },

  async reject(id: string, reason?: string) {
    const result = await query(
      `UPDATE mitigations SET status = 'REJECTED', notes = COALESCE(notes || E'\n', '') || $2 WHERE id = $1 RETURNING ${MIT_COLS.join(", ")}`,
      [id, reason || "Rejected"]
    );
    if (!result.rows.length) throw new NotFoundError("Mitigation", id);
    return mitRow(result.rows[0]);
  },

  async getOverdue() {
    const result = await query(
      `SELECT ${MIT_COLS.join(", ")} FROM mitigations
       WHERE due_date < CURRENT_DATE AND status IN ('PROPOSED', 'IN_PROGRESS')
       ORDER BY due_date ASC`
    );
    return result.rows.map(mitRow);
  },

  async listByFinding(findingId: string, filters: { page: number; limit: number }) {
    return this.list({ ...filters, findingId });
  },
};
