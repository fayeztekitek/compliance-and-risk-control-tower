import { query, getClient } from "../config/database.js";

// ---------- Vulnerability ----------
export interface VulnerabilityRow {
  id: string; created_at: string; updated_at: string;
  title: string; severity: string; status: string;
  source_scanner: string; detected_date: string; remediated_date: string | null;
  sla_due_date: string; is_false_positive: boolean;
  explanation_false_positive: string | null;
  target_product: string | null; owner: string | null;
  waiver_id: string | null; risk_acceptance_id: string | null;
  deleted_at: string | null;
}

function vulnRow(row: VulnerabilityRow) {
  return {
    id: row.id, createdAt: row.created_at, updatedAt: row.updated_at,
    title: row.title, severity: row.severity, status: row.status,
    sourceScanner: row.source_scanner, detectedDate: row.detected_date,
    remediatedDate: row.remediated_date, slaDueDate: row.sla_due_date,
    isFalsePositive: row.is_false_positive,
    explanationFalsePositive: row.explanation_false_positive,
    targetProduct: row.target_product, owner: row.owner,
    waiverId: row.waiver_id, riskAcceptanceId: row.risk_acceptance_id,
  };
}

const VULN_COLS = ["id", "created_at", "updated_at", "title", "severity", "status", "source_scanner", "detected_date", "remediated_date", "sla_due_date", "is_false_positive", "explanation_false_positive", "target_product", "owner", "waiver_id", "risk_acceptance_id", "deleted_at"];

export const securityRepo = {
  async listVulnerabilities(filters: { page: number; limit: number; severity?: string; status?: string; scanner?: string; product?: string; search?: string }) {
    const conditions: string[] = ["deleted_at IS NULL"];
    const params: any[] = [];
    let idx = 1;

    if (filters.severity) { conditions.push(`severity = $${idx++}`); params.push(filters.severity.toUpperCase()); }
    if (filters.status) { conditions.push(`status = $${idx++}`); params.push(filters.status.toUpperCase()); }
    if (filters.scanner) { conditions.push(`source_scanner = $${idx++}`); params.push(filters.scanner.toUpperCase()); }
    if (filters.product) { conditions.push(`target_product ILIKE $${idx++}`); params.push(`%${filters.product}%`); }
    if (filters.search) { conditions.push(`(title ILIKE $${idx++} OR target_product ILIKE $${idx++})`); params.push(`%${filters.search}%`, `%${filters.search}%`); }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const offset = (filters.page - 1) * filters.limit;

    const countResult = await query<{ count: string }>(`SELECT COUNT(*) FROM vulnerabilities ${where}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    const dataResult = await query<VulnerabilityRow>(
      `SELECT ${VULN_COLS.join(", ")} FROM vulnerabilities ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, filters.limit, offset]
    );

    return { data: dataResult.rows.map(vulnRow), total, page: filters.page, limit: filters.limit };
  },

  async getVulnerability(id: string) {
    const result = await query<VulnerabilityRow>(
      `SELECT ${VULN_COLS.join(", ")} FROM vulnerabilities WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    return result.rows.length ? vulnRow(result.rows[0]) : null;
  },

  async createVulnerability(data: any) {
    const result = await query<VulnerabilityRow>(
      `INSERT INTO vulnerabilities (title, severity, source_scanner, detected_date, sla_due_date, target_product, owner)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING ${VULN_COLS.join(", ")}`,
      [data.title, data.severity, data.sourceScanner, data.detectedDate || new Date().toISOString().split("T")[0], data.slaDueDate, data.targetProduct || null, data.owner || null]
    );
    return vulnRow(result.rows[0]);
  },

  async updateVulnerability(id: string, data: any) {
    const fields: string[] = [];
    const params: any[] = [];
    let idx = 1;

    const mapping: Record<string, string> = {
      title: "title", severity: "severity", status: "status",
      remediatedDate: "remediated_date", targetProduct: "target_product", owner: "owner",
    };

    for (const [key, col] of Object.entries(mapping)) {
      if (data[key] !== undefined) {
        fields.push(`${col} = $${idx++}`);
        params.push(data[key]);
      }
    }
    if (!fields.length) return null;

    params.push(id);
    const result = await query<VulnerabilityRow>(
      `UPDATE vulnerabilities SET ${fields.join(", ")} WHERE id = $${idx} AND deleted_at IS NULL RETURNING ${VULN_COLS.join(", ")}`,
      params
    );
    return result.rows.length ? vulnRow(result.rows[0]) : null;
  },

  async setFalsePositive(id: string, explanation: string) {
    const result = await query<VulnerabilityRow>(
      `UPDATE vulnerabilities SET is_false_positive = TRUE, explanation_false_positive = $1, status = 'FALSE_POSITIVE' WHERE id = $2 AND deleted_at IS NULL RETURNING ${VULN_COLS.join(", ")}`,
      [explanation, id]
    );
    return result.rows.length ? vulnRow(result.rows[0]) : null;
  },

  async linkWaiver(vulnId: string, waiverId: string) {
    await query("UPDATE vulnerabilities SET waiver_id = $1 WHERE id = $2", [waiverId, vulnId]);
  },

  async linkRiskAcceptance(vulnId: string, raId: string) {
    await query("UPDATE vulnerabilities SET risk_acceptance_id = $1 WHERE id = $2", [raId, vulnId]);
  },

  // ---------- Waivers ----------
  async listWaivers() {
    const result = await query<any>("SELECT id, created_at, updated_at, vulnerability_id, title, rationale, status, request_date, expiry_date, approved_by FROM waivers ORDER BY created_at DESC");
    return result.rows;
  },

  async createWaiver(data: any) {
    const result = await query<any>(
      `INSERT INTO waivers (vulnerability_id, title, rationale, expiry_date) VALUES ($1, $2, $3, $4)
       RETURNING id, created_at, updated_at, vulnerability_id, title, rationale, status, request_date, expiry_date, approved_by`,
      [data.vulnerabilityId, data.title, data.rationale, data.expiryDate]
    );
    return result.rows[0];
  },

  async updateWaiverStatus(id: string, status: string, approvedBy?: string) {
    const result = await query<any>(
      `UPDATE waivers SET status = $1${approvedBy ? ", approved_by = $3" : ""} WHERE id = $2
       RETURNING id, created_at, updated_at, vulnerability_id, title, rationale, status, request_date, expiry_date, approved_by`,
      approvedBy ? [status, id, approvedBy] : [status, id]
    );
    return result.rows.length ? result.rows[0] : null;
  },

  // ---------- Risk Acceptances ----------
  async listRiskAcceptances() {
    const result = await query<any>("SELECT id, created_at, updated_at, vulnerability_id, title, business_impact, mitigation_plan, status, request_date, expiry_date, approved_by FROM risk_acceptances ORDER BY created_at DESC");
    return result.rows;
  },

  async createRiskAcceptance(data: any) {
    const result = await query<any>(
      `INSERT INTO risk_acceptances (vulnerability_id, title, business_impact, mitigation_plan, expiry_date) VALUES ($1, $2, $3, $4, $5)
       RETURNING id, created_at, updated_at, vulnerability_id, title, business_impact, mitigation_plan, status, request_date, expiry_date, approved_by`,
      [data.vulnerabilityId, data.title, data.businessImpact, data.mitigationPlan, data.expiryDate]
    );
    return result.rows[0];
  },

  async updateRiskAcceptanceStatus(id: string, status: string, approvedBy?: string) {
    const result = await query<any>(
      `UPDATE risk_acceptances SET status = $1${approvedBy ? ", approved_by = $3" : ""} WHERE id = $2
       RETURNING id, created_at, updated_at, vulnerability_id, title, business_impact, mitigation_plan, status, request_date, expiry_date, approved_by`,
      approvedBy ? [status, id, approvedBy] : [status, id]
    );
    return result.rows.length ? result.rows[0] : null;
  },

  // ---------- SLA Incidents ----------
  async listSlaIncidents() {
    const result = await query<any>(
      "SELECT id, created_at, updated_at, title, contract_id, project_name, breach_time, resolution_time, max_allowed_resolution_hours, actual_duration_hours, status, penalty_cost FROM sla_incidents ORDER BY created_at DESC"
    );
    return result.rows;
  },

  async createSlaIncident(data: any) {
    const result = await query<any>(
      `INSERT INTO sla_incidents (title, contract_id, project_name, breach_time, max_allowed_resolution_hours, actual_duration_hours, penalty_cost, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, created_at, updated_at, title, contract_id, project_name, breach_time, resolution_time, max_allowed_resolution_hours, actual_duration_hours, status, penalty_cost`,
      [data.title, data.contractId || null, data.projectName || null, data.breachTime, data.maxAllowedResolutionHours, data.actualDurationHours || null, data.penaltyCost || null, data.status || "OPEN"]
    );
    return result.rows[0];
  },

  // ---------- Scan Import (batch) ----------
  async batchImportVulnerabilities(vulns: any[]) {
    const client = await getClient();
    try {
      await client.query("BEGIN");
      const results = [];
      for (const v of vulns) {
        const r = await client.query(
          `INSERT INTO vulnerabilities (title, severity, source_scanner, detected_date, sla_due_date, target_product, owner)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
          [v.title, v.severity, v.sourceScanner, v.detectedDate, v.slaDueDate, v.targetProduct || null, v.owner || null]
        );
        results.push(r.rows[0].id);
      }
      await client.query("COMMIT");
      return results;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },
};
