import { query } from "../config/database.js";

export interface ComplianceClassificationRow {
  id: string;
  created_at: string;
  finding_id: string | null;
  framework: string;
  control_id: string | null;
  requirement: string | null;
  impact_assessment: string | null;
  sla_deadline: string | null;
  status: string;
}

export interface RegulatoryMappingRow {
  id: string;
  created_at: string;
  framework: string;
  severity: string;
  control_id: string;
  requirement_description: string | null;
  sla_days: number;
}

export interface FrameworkSummary {
  framework: string;
  total_findings: number;
  breached: number;
  remediated: number;
  active: number;
}

const CC_COLS = ["id","created_at","finding_id","framework","control_id","requirement","impact_assessment","sla_deadline","status"];
const RM_COLS = ["id","created_at","framework","severity","control_id","requirement_description","sla_days"];

function ccRow(r: any): ComplianceClassificationRow {
  return {
    id: r.id, created_at: r.created_at, finding_id: r.finding_id ?? null,
    framework: r.framework, control_id: r.control_id ?? null,
    requirement: r.requirement ?? null, impact_assessment: r.impact_assessment ?? null,
    sla_deadline: r.sla_deadline ?? null, status: r.status,
  };
}

function rmRow(r: any): RegulatoryMappingRow {
  return {
    id: r.id, created_at: r.created_at, framework: r.framework,
    severity: r.severity, control_id: r.control_id,
    requirement_description: r.requirement_description ?? null, sla_days: r.sla_days,
  };
}

export const complianceRepo = {
  async getClassifications(filters?: { framework?: string; findingId?: string; status?: string }) {
    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;
    if (filters?.framework) { conditions.push(`framework = $${idx++}`); params.push(filters.framework); }
    if (filters?.findingId) { conditions.push(`finding_id = $${idx++}`); params.push(filters.findingId); }
    if (filters?.status) { conditions.push(`status = $${idx++}`); params.push(filters.status); }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const r = await query(`SELECT ${CC_COLS.join(",")} FROM compliance_classification ${where} ORDER BY framework, status`);
    return r.rows.map(ccRow);
  },

  async getById(id: string) {
    const r = await query(`SELECT ${CC_COLS.join(",")} FROM compliance_classification WHERE id = $1`, [id]);
    return r.rows.length ? ccRow(r.rows[0]) : null;
  },

  async create(data: { findingId: string; framework: string; controlId?: string; requirement?: string; impactAssessment?: string; slaDeadline?: string; status?: string }) {
    const r = await query(
      `INSERT INTO compliance_classification (finding_id, framework, control_id, requirement, impact_assessment, sla_deadline, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING ${CC_COLS.join(",")}`,
      [data.findingId, data.framework, data.controlId || null, data.requirement || null, data.impactAssessment || null, data.slaDeadline || null, data.status || "ACTIVE"]
    );
    return ccRow(r.rows[0]);
  },

  async update(id: string, data: { requirement?: string; impactAssessment?: string; status?: string }) {
    const fields: string[] = [];
    const params: any[] = [];
    let idx = 1;
    if (data.requirement !== undefined) { fields.push(`requirement = $${idx++}`); params.push(data.requirement); }
    if (data.impactAssessment !== undefined) { fields.push(`impact_assessment = $${idx++}`); params.push(data.impactAssessment); }
    if (data.status !== undefined) { fields.push(`status = $${idx++}`); params.push(data.status); }
    if (!fields.length) return null;
    params.push(id);
    const r = await query(
      `UPDATE compliance_classification SET ${fields.join(", ")} WHERE id = $${idx} RETURNING ${CC_COLS.join(",")}`,
      params
    );
    return r.rows.length ? ccRow(r.rows[0]) : null;
  },

  async getFrameworkSummaries(): Promise<FrameworkSummary[]> {
    const r = await query(`
      SELECT framework,
             COUNT(*)::int AS total_findings,
             COUNT(*) FILTER (WHERE status = 'BREACHED')::int AS breached,
             COUNT(*) FILTER (WHERE status = 'REMEDIATED')::int AS remediated,
             COUNT(*) FILTER (WHERE status = 'ACTIVE')::int AS active
      FROM compliance_classification
      GROUP BY framework
      ORDER BY framework
    `);
    return r.rows;
  },

  async getRegulatoryMappings() {
    const r = await query(`SELECT ${RM_COLS.join(",")} FROM regulatory_mapping ORDER BY framework, severity DESC`);
    return r.rows.map(rmRow);
  },

  async getSlaBreaches() {
    const r = await query(`
      SELECT cc.id, cc.finding_id, uf.severity, cc.framework, cc.control_id, cc.sla_deadline,
             cc.status, EXTRACT(EPOCH FROM (NOW() - cc.sla_deadline)) / 86400 AS days_overdue
      FROM compliance_classification cc
      LEFT JOIN unified_findings uf ON uf.id = cc.finding_id
      WHERE cc.status = 'ACTIVE' AND cc.sla_deadline IS NOT NULL AND cc.sla_deadline < NOW()
      ORDER BY cc.sla_deadline
    `);
    return r.rows;
  },

  async autoClassify(findingId: string, severity: string) {
    const mappings = await this.getRegulatoryMappings();
    const applicable = mappings.filter(m => m.severity === severity);
    const created: ComplianceClassificationRow[] = [];
    for (const m of applicable) {
      const slaDeadline = new Date(Date.now() + m.sla_days * 86400000).toISOString();
      try {
        const row = await this.create({
          findingId, framework: m.framework, controlId: m.control_id,
          requirement: m.requirement_description ?? undefined,
          slaDeadline,
        });
        created.push(row);
      } catch {
        // skip duplicates
      }
    }
    return created;
  },

  async detectAndUpdateBreaches() {
    const r = await query(`
      UPDATE compliance_classification
      SET status = 'BREACHED'
      WHERE status = 'ACTIVE' AND sla_deadline IS NOT NULL AND sla_deadline < NOW()
      RETURNING ${CC_COLS.join(",")}
    `);
    return r.rows.map(ccRow);
  },
};
