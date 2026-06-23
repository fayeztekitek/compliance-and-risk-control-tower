import { query } from "../config/database.js";

const SR_COLS = [
  "id", "created_at", "updated_at",
  "application_id", "scanner_source",
  "report_date", "report_version", "scan_type",
  "raw_report_id", "imported_at",
  "total_findings", "total_occurrences", "metadata",
  "total_policy_violations",
  "critical_violations", "high_violations", "medium_violations", "low_violations",
];

function srRow(r: any) {
  return {
    id: r.id, createdAt: r.created_at, updatedAt: r.updated_at,
    applicationId: r.application_id, scannerSource: r.scanner_source,
    reportDate: r.report_date, reportVersion: r.report_version, scanType: r.scan_type,
    rawReportId: r.raw_report_id, importedAt: r.imported_at,
    totalFindings: r.total_findings, totalOccurrences: r.total_occurrences,
    totalPolicyViolations: r.total_policy_violations ?? 0,
    criticalViolations: r.critical_violations ?? 0,
    highViolations: r.high_violations ?? 0,
    mediumViolations: r.medium_violations ?? 0,
    lowViolations: r.low_violations ?? 0,
    metadata: r.metadata,
  };
}

export const scanReportRepo = {
  async list(filters: {
    page: number; limit: number;
    applicationId?: string; scannerSource?: string;
    fromDate?: string; toDate?: string;
  }) {
    const params: any[] = [];
    let idx = 1;
    const conds: string[] = [];

    if (filters.applicationId) { conds.push(`application_id = $${idx++}`); params.push(filters.applicationId); }
    if (filters.scannerSource) { conds.push(`scanner_source = $${idx++}::finding_source`); params.push(filters.scannerSource.toUpperCase()); }
    if (filters.fromDate) { conds.push(`report_date >= $${idx++}`); params.push(filters.fromDate); }
    if (filters.toDate) { conds.push(`report_date <= $${idx++}`); params.push(filters.toDate); }

    const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
    const offset = (filters.page - 1) * filters.limit;

    const countResult = await query<{ count: string }>(`SELECT COUNT(*) FROM scan_reports ${where}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    const dataResult = await query(
      `SELECT ${SR_COLS.join(", ")} FROM scan_reports ${where} ORDER BY report_date DESC LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, filters.limit, offset]
    );

    return { data: dataResult.rows.map(srRow), total, page: filters.page, limit: filters.limit };
  },

  async get(id: string) {
    const result = await query(
      `SELECT ${SR_COLS.join(", ")} FROM scan_reports WHERE id = $1`,
      [id]
    );
    return result.rows.length ? srRow(result.rows[0]) : null;
  },

  async getLatestByApp(applicationId: string, scannerSource?: string) {
    let sql = `SELECT ${SR_COLS.join(", ")} FROM scan_reports WHERE application_id = $1`;
    const params: any[] = [applicationId];
    if (scannerSource) {
      sql += ` AND scanner_source = $2::finding_source`;
      params.push(scannerSource.toUpperCase());
    }
    sql += " ORDER BY report_date DESC LIMIT 1";
    const result = await query(sql, params);
    return result.rows.length ? srRow(result.rows[0]) : null;
  },

  async getPreviousReport(applicationId: string, currentReportDate: string, scannerSource?: string) {
    let sql = `SELECT ${SR_COLS.join(", ")} FROM scan_reports WHERE application_id = $1 AND report_date < $2`;
    const params: any[] = [applicationId, currentReportDate];
    if (scannerSource) {
      sql += ` AND scanner_source = $3::finding_source`;
      params.push(scannerSource.toUpperCase());
    }
    sql += " ORDER BY report_date DESC LIMIT 1";
    const result = await query(sql, params);
    return result.rows.length ? srRow(result.rows[0]) : null;
  },

  async create(data: {
    applicationId: string; scannerSource: string;
    reportDate: string; reportVersion?: string; scanType?: string;
    rawReportId?: string; totalFindings?: number; totalOccurrences?: number;
    totalPolicyViolations?: number;
    criticalViolations?: number; highViolations?: number;
    mediumViolations?: number; lowViolations?: number;
    metadata?: any;
  }) {
    const result = await query(
      `INSERT INTO scan_reports (application_id, scanner_source, report_date, report_version, scan_type, raw_report_id, total_findings, total_occurrences, total_policy_violations, critical_violations, high_violations, medium_violations, low_violations, metadata)
       VALUES ($1, $2::finding_source, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb)
       RETURNING ${SR_COLS.join(", ")}`,
      [
        data.applicationId, data.scannerSource.toUpperCase(), data.reportDate,
        data.reportVersion || null, data.scanType || null, data.rawReportId || null,
        data.totalFindings || 0, data.totalOccurrences || 0,
        data.totalPolicyViolations || 0,
        data.criticalViolations || 0, data.highViolations || 0,
        data.mediumViolations || 0, data.lowViolations || 0,
        JSON.stringify(data.metadata || {}),
      ]
    );
    return srRow(result.rows[0]);
  },

  async update(id: string, data: {
    totalFindings?: number; totalOccurrences?: number; metadata?: any;
    reportVersion?: string;
    totalPolicyViolations?: number;
    criticalViolations?: number; highViolations?: number;
    mediumViolations?: number; lowViolations?: number;
  }) {
    const fields: string[] = [];
    const params: any[] = [];
    let idx = 1;

    const mapping: Record<string, string> = {
      totalFindings: "total_findings", totalOccurrences: "total_occurrences",
      reportVersion: "report_version",
      totalPolicyViolations: "total_policy_violations",
      criticalViolations: "critical_violations",
      highViolations: "high_violations",
      mediumViolations: "medium_violations",
      lowViolations: "low_violations",
    };

    for (const [key, col] of Object.entries(mapping)) {
      if (data[key as keyof typeof data] !== undefined) {
        fields.push(`${col} = $${idx++}`);
        params.push(data[key as keyof typeof data]);
      }
    }
    if (data.metadata !== undefined) {
      fields.push(`metadata = $${idx++}`);
      params.push(JSON.stringify(data.metadata));
    }
    if (!fields.length) return null;

    params.push(id);
    const result = await query(
      `UPDATE scan_reports SET ${fields.join(", ")} WHERE id = $${idx} RETURNING ${SR_COLS.join(", ")}`,
      params
    );
    return result.rows.length ? srRow(result.rows[0]) : null;
  },

  async delete(id: string) {
    await query("DELETE FROM scan_reports WHERE id = $1", [id]);
  },

  async getPolicyViolationsByApp(applicationId: string) {
    const r = await query(
      `SELECT id, report_date, scanner_source, total_policy_violations,
              critical_violations, high_violations, medium_violations, low_violations
       FROM scan_reports
       WHERE application_id = $1 AND total_policy_violations > 0
       ORDER BY report_date DESC`,
      [applicationId]
    );
    return r.rows.map((row: any) => ({
      id: row.id,
      reportDate: row.report_date,
      scannerSource: row.scanner_source,
      totalPolicyViolations: row.total_policy_violations ?? 0,
      criticalViolations: row.critical_violations ?? 0,
      highViolations: row.high_violations ?? 0,
      mediumViolations: row.medium_violations ?? 0,
      lowViolations: row.low_violations ?? 0,
    }));
  },

  async getAggregatedPolicyViolations() {
    const r = await query(`
      SELECT COALESCE(SUM(total_policy_violations), 0)::int AS total,
             COALESCE(SUM(critical_violations), 0)::int AS critical,
             COALESCE(SUM(high_violations), 0)::int AS high,
             COALESCE(SUM(medium_violations), 0)::int AS medium,
             COALESCE(SUM(low_violations), 0)::int AS low
      FROM scan_reports
    `);
    return r.rows[0];
  },
};
