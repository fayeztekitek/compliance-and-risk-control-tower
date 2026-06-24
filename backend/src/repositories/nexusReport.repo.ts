import { query } from "../config/database.js";

const REPORT_COLS = [
  "id", "created_at", "updated_at", "scan_id", "application_id",
  "application_public_id", "application_uuid", "stage", "scan_date",
  "report_url", "embeddable_report_html_url", "report_pdf_url", "report_data_url",
  "report_title", "commit_hash", "initiator",
  "policy_evaluation_date", "policy_evaluation_status",
  "total_components", "affected_components", "total_violations",
  "critical_count", "high_count", "medium_count", "low_count",
  "component_hashes",
];

const VIOLATION_COLS = [
  "id", "created_at", "updated_at",
  "violation_id", "report_id", "policy_id", "policy_name",
  "constraint_id", "constraint_name", "threat_level", "threat_category",
  "application_id",
  "component_hash", "component_format", "component_name", "component_coordinates",
  "display_name", "proprietary", "match_state",
  "security_issue_ref_id", "security_issue_severity", "cve_id",
  "status", "stage", "created_date",
  "open_time", "waive_time", "fix_time", "is_waived", "is_legacy",
  "waiver_status", "business_impact",
];

const COMPONENT_COLS = [
  "id", "created_at", "updated_at",
  "component_hash", "component_name", "display_name",
  "current_version", "latest_version", "recommended_version",
  "format", "coordinates",
  "proprietary", "match_state",
  "security_risk", "license_risk",
  "popularity", "age", "number_of_affected_applications",
];

const EVOLUTION_COLS = [
  "id", "created_at", "updated_at",
  "application_id", "report_id", "scan_date", "stage",
  "total_violations", "critical_count", "high_count", "medium_count", "low_count",
  "total_components", "affected_components",
  "component_churn", "new_violations", "fixed_violations",
];

const IMPACT_COLS = [
  "id", "created_at", "updated_at",
  "application_id", "component_hash",
  "first_seen", "last_seen",
  "reports_affected", "violation_count", "max_threat_level", "versions_seen",
];

function reportRow(r: any) {
  return {
    id: r.id, createdAt: r.created_at, updatedAt: r.updated_at,
    scanId: r.scan_id, applicationId: r.application_id,
    applicationPublicId: r.application_public_id, applicationUuid: r.application_uuid,
    stage: r.stage, scanDate: r.scan_date,
    reportUrl: r.report_url, embeddableReportHtmlUrl: r.embeddable_report_html_url,
    reportPdfUrl: r.report_pdf_url, reportDataUrl: r.report_data_url,
    reportTitle: r.report_title, commitHash: r.commit_hash, initiator: r.initiator,
    policyEvaluationDate: r.policy_evaluation_date,
    policyEvaluationStatus: r.policy_evaluation_status,
    totalComponents: r.total_components, affectedComponents: r.affected_components,
    totalViolations: r.total_violations,
    criticalCount: r.critical_count, highCount: r.high_count,
    mediumCount: r.medium_count, lowCount: r.low_count,
    componentHashes: r.component_hashes,
  };
}

function violationRow(r: any) {
  return {
    id: r.id, createdAt: r.created_at, updatedAt: r.updated_at,
    violationId: r.violation_id, reportId: r.report_id,
    policyId: r.policy_id, policyName: r.policy_name,
    constraintId: r.constraint_id, constraintName: r.constraint_name,
    threatLevel: r.threat_level, threatCategory: r.threat_category,
    applicationId: r.application_id,
    componentHash: r.component_hash, componentFormat: r.component_format,
    componentName: r.component_name,
    componentCoordinates: r.component_coordinates,
    displayName: r.display_name, proprietary: r.proprietary, matchState: r.match_state,
    securityIssueRefId: r.security_issue_ref_id,
    securityIssueSeverity: r.security_issue_severity,
    cveId: r.cve_id,
    status: r.status, stage: r.stage, createdDate: r.created_date,
    openTime: r.open_time, waiveTime: r.waive_time, fixTime: r.fix_time,
    isWaived: r.is_waived, isLegacy: r.is_legacy,
    waiverStatus: r.waiver_status, businessImpact: r.business_impact,
  };
}

function componentRow(r: any) {
  return {
    id: r.id, createdAt: r.created_at, updatedAt: r.updated_at,
    componentHash: r.component_hash, componentName: r.component_name,
    displayName: r.display_name,
    currentVersion: r.current_version, latestVersion: r.latest_version,
    recommendedVersion: r.recommended_version,
    format: r.format, coordinates: r.coordinates,
    proprietary: r.proprietary, matchState: r.match_state,
    securityRisk: r.security_risk, licenseRisk: r.license_risk,
    popularity: r.popularity, age: r.age,
    numberOfAffectedApplications: r.number_of_affected_applications,
  };
}

function evolutionRow(r: any) {
  return {
    id: r.id, createdAt: r.created_at, updatedAt: r.updated_at,
    applicationId: r.application_id, reportId: r.report_id,
    scanDate: r.scan_date, stage: r.stage,
    totalViolations: r.total_violations,
    criticalCount: r.critical_count, highCount: r.high_count,
    mediumCount: r.medium_count, lowCount: r.low_count,
    totalComponents: r.total_components, affectedComponents: r.affected_components,
    componentChurn: r.component_churn,
    newViolations: r.new_violations, fixedViolations: r.fixed_violations,
  };
}

export const nexusReportRepo = {
  // ---- Reports ----
  async upsertReport(data: {
    scanId: string; applicationId: string; applicationPublicId?: string;
    applicationUuid?: string; stage: string; scanDate: string;
    reportUrl?: string; embeddableReportHtmlUrl?: string;
    reportPdfUrl?: string; reportDataUrl?: string;
    reportTitle?: string; commitHash?: string; initiator?: string;
    policyEvaluationDate?: string; policyEvaluationStatus?: string;
    totalComponents?: number; affectedComponents?: number; totalViolations?: number;
    criticalCount?: number; highCount?: number; mediumCount?: number; lowCount?: number;
    componentHashes?: string[];
  }) {
    const result = await query(
      `INSERT INTO nexus_scan_reports (scan_id, application_id, application_public_id, application_uuid, stage, scan_date, report_url, embeddable_report_html_url, report_pdf_url, report_data_url, report_title, commit_hash, initiator, policy_evaluation_date, policy_evaluation_status, total_components, affected_components, total_violations, critical_count, high_count, medium_count, low_count, component_hashes)
       VALUES ($1,$2,$3,$4,$5::scan_stage,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
       ON CONFLICT (scan_id) DO UPDATE SET
         stage = EXCLUDED.stage,
         scan_date = EXCLUDED.scan_date,
         report_url = EXCLUDED.report_url,
         embeddable_report_html_url = EXCLUDED.embeddable_report_html_url,
         report_pdf_url = EXCLUDED.report_pdf_url,
         report_data_url = EXCLUDED.report_data_url,
         report_title = EXCLUDED.report_title,
         commit_hash = EXCLUDED.commit_hash,
         initiator = EXCLUDED.initiator,
         policy_evaluation_date = EXCLUDED.policy_evaluation_date,
         policy_evaluation_status = EXCLUDED.policy_evaluation_status,
         total_components = EXCLUDED.total_components,
         affected_components = EXCLUDED.affected_components,
         total_violations = EXCLUDED.total_violations,
         critical_count = EXCLUDED.critical_count,
         high_count = EXCLUDED.high_count,
         medium_count = EXCLUDED.medium_count,
         low_count = EXCLUDED.low_count,
         component_hashes = EXCLUDED.component_hashes,
         updated_at = NOW()
       RETURNING ${REPORT_COLS.join(",")}`,
      [
        data.scanId, data.applicationId, data.applicationPublicId || null,
        data.applicationUuid || null, data.stage, data.scanDate,
        data.reportUrl || null, data.embeddableReportHtmlUrl || null,
        data.reportPdfUrl || null, data.reportDataUrl || null,
        data.reportTitle || null, data.commitHash || null, data.initiator || null,
        data.policyEvaluationDate || null, data.policyEvaluationStatus || null,
        data.totalComponents ?? 0, data.affectedComponents ?? 0,
        data.totalViolations ?? 0,
        data.criticalCount ?? 0, data.highCount ?? 0,
        data.mediumCount ?? 0, data.lowCount ?? 0,
        data.componentHashes || [],
      ]
    );
    return reportRow(result.rows[0]);
  },

  async listReports(applicationId: string, page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;
    const countResult = await query(
      "SELECT COUNT(*) FROM nexus_scan_reports WHERE application_uuid = $1::uuid OR application_id = $2",
      [applicationId, applicationId]
    );
    const total = parseInt(countResult.rows[0].count, 10);
    const dataResult = await query(
      `SELECT ${REPORT_COLS.join(",")} FROM nexus_scan_reports
       WHERE application_uuid = $1::uuid OR application_id = $2
       ORDER BY scan_date DESC LIMIT $3 OFFSET $4`,
      [applicationId, applicationId, limit, offset]
    );
    return { data: dataResult.rows.map(reportRow), total, page, limit };
  },

  async getReport(scanId: string) {
    const result = await query(
      `SELECT ${REPORT_COLS.join(",")} FROM nexus_scan_reports WHERE scan_id = $1`,
      [scanId]
    );
    return result.rows.length ? reportRow(result.rows[0]) : null;
  },

  async getReportByInternalId(id: string) {
    const result = await query(
      `SELECT ${REPORT_COLS.join(",")} FROM nexus_scan_reports WHERE id = $1`,
      [id]
    );
    return result.rows.length ? reportRow(result.rows[0]) : null;
  },

  async getPreviousReportByDate(applicationId: string, currentScanId: string, scanDate: string) {
    const result = await query(
      `SELECT ${REPORT_COLS.join(",")} FROM nexus_scan_reports
       WHERE (application_uuid = $1::uuid OR application_id = $2)
         AND scan_id != $3
         AND scan_date <= $4
       ORDER BY scan_date DESC LIMIT 1`,
      [applicationId, applicationId, currentScanId, scanDate]
    );
    return result.rows.length ? reportRow(result.rows[0]) : null;
  },

  async getComponentHashSet(scanId: string): Promise<string[]> {
    const result = await query(
      "SELECT component_hashes FROM nexus_scan_reports WHERE scan_id = $1",
      [scanId]
    );
    return result.rows.length ? (result.rows[0].component_hashes || []) : [];
  },

  async getApplicationByScanId(scanId: string) {
    const result = await query(
      `SELECT a.id, a.application_id, a.application_public_id, a.application_name
       FROM nexus_applications a
       JOIN nexus_scan_reports r ON r.application_uuid = a.id OR r.application_id = a.application_id
       WHERE r.scan_id = $1
       LIMIT 1`,
      [scanId]
    );
    return result.rows.length ? result.rows[0] : null;
  },

  // ---- Violations ----
  async upsertViolation(data: {
    violationId: string; reportId: string; policyId?: string; policyName: string;
    constraintId?: string; constraintName?: string;
    threatLevel?: number; threatCategory?: string;
    applicationId: string;
    componentHash?: string; componentFormat?: string; componentName?: string;
    componentCoordinates?: any; displayName?: string;
    proprietary?: boolean; matchState?: string;
    securityIssueRefId?: string; securityIssueSeverity?: number; cveId?: string;
    status?: string; stage?: string; createdDate?: string;
    openTime?: string; waiveTime?: string; fixTime?: string;
    isWaived?: boolean; isLegacy?: boolean;
    waiverStatus?: string; businessImpact?: string;
  }) {
    const result = await query(
      `INSERT INTO nexus_policy_violations
         (violation_id, report_id, policy_id, policy_name, constraint_id, constraint_name,
          threat_level, threat_category, application_id,
          component_hash, component_format, component_name, component_coordinates, display_name,
          proprietary, match_state,
          security_issue_ref_id, security_issue_severity, cve_id,
          status, stage, created_date,
          open_time, waive_time, fix_time, is_waived, is_legacy,
          waiver_status, business_impact)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14,$15,$16,$17,$18,$19,$20,$21::scan_stage,$22,$23,$24,$25,$26,$27,$28,$29)
       ON CONFLICT (violation_id) DO UPDATE SET
         report_id = EXCLUDED.report_id,
         policy_name = EXCLUDED.policy_name,
         constraint_name = EXCLUDED.constraint_name,
         threat_level = EXCLUDED.threat_level,
         threat_category = EXCLUDED.threat_category,
         component_hash = EXCLUDED.component_hash,
         component_format = EXCLUDED.component_format,
         component_name = EXCLUDED.component_name,
         component_coordinates = EXCLUDED.component_coordinates,
         display_name = EXCLUDED.display_name,
         proprietary = EXCLUDED.proprietary,
         match_state = EXCLUDED.match_state,
         security_issue_ref_id = EXCLUDED.security_issue_ref_id,
         security_issue_severity = EXCLUDED.security_issue_severity,
         cve_id = EXCLUDED.cve_id,
         status = EXCLUDED.status,
         stage = EXCLUDED.stage,
         created_date = EXCLUDED.created_date,
         open_time = EXCLUDED.open_time,
         waive_time = EXCLUDED.waive_time,
         fix_time = EXCLUDED.fix_time,
         is_waived = EXCLUDED.is_waived,
         is_legacy = EXCLUDED.is_legacy,
         waiver_status = EXCLUDED.waiver_status,
         business_impact = EXCLUDED.business_impact,
         updated_at = NOW()
       RETURNING ${VIOLATION_COLS.join(",")}`,
      [
        data.violationId, data.reportId, data.policyId || null, data.policyName,
        data.constraintId || null, data.constraintName || null,
        data.threatLevel ?? null, data.threatCategory || null, data.applicationId,
        data.componentHash || null, data.componentFormat || null,
        data.componentName || null,
        data.componentCoordinates ? JSON.stringify(data.componentCoordinates) : null,
        data.displayName || null, data.proprietary ?? null, data.matchState || null,
        data.securityIssueRefId || null, data.securityIssueSeverity ?? null,
        data.cveId || null,
        data.status || "OPEN", data.stage || null, data.createdDate || null,
        data.openTime || null, data.waiveTime || null, data.fixTime || null,
        data.isWaived ?? false, data.isLegacy ?? false,
        data.waiverStatus || null, data.businessImpact || null,
      ]
    );
    return violationRow(result.rows[0]);
  },

  async listViolations(reportId: string, filters?: {
    severity?: string; status?: string; search?: string;
    page?: number; limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const offset = (page - 1) * limit;
    const params: any[] = [reportId];
    let idx = 2;
    const conds: string[] = ["report_id = $1"];

    if (filters?.status) {
      const statuses = filters.status.split(",").map(s => s.trim().toUpperCase());
      conds.push(`status = ANY($${idx}::text[])`);
      params.push(statuses);
      idx++;
    }
    if (filters?.search) {
      conds.push(`(display_name ILIKE $${idx} OR component_name ILIKE $${idx} OR cve_id ILIKE $${idx} OR security_issue_ref_id ILIKE $${idx})`);
      params.push(`%${filters.search}%`);
      idx++;
    }

    const where = conds.join(" AND ");
    const countResult = await query(
      `SELECT COUNT(*) FROM nexus_policy_violations WHERE ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const dataResult = await query(
      `SELECT ${VIOLATION_COLS.join(",")} FROM nexus_policy_violations
       WHERE ${where}
       ORDER BY threat_level DESC NULLS LAST, display_name ASC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );
    return { data: dataResult.rows.map(violationRow), total, page, limit };
  },

  async getViolationSummary(reportId: string) {
    const result = await query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE threat_level >= 8 OR threat_level IS NULL)::int AS critical,
         COUNT(*) FILTER (WHERE threat_level >= 5 AND threat_level < 8)::int AS high,
         COUNT(*) FILTER (WHERE threat_level >= 3 AND threat_level < 5)::int AS medium,
         COUNT(*) FILTER (WHERE threat_level < 3)::int AS low,
         COUNT(*) FILTER (WHERE status = 'OPEN')::int AS open_count,
         COUNT(*) FILTER (WHERE status = 'WAIVED')::int AS waived_count,
         COUNT(*) FILTER (WHERE status = 'FIXED')::int AS fixed_count
       FROM nexus_policy_violations WHERE report_id = $1`,
      [reportId]
    );
    return result.rows[0];
  },

  // ---- Components ----
  async upsertComponent(data: {
    componentHash: string; componentName?: string; displayName?: string;
    currentVersion?: string; latestVersion?: string; recommendedVersion?: string;
    format?: string; coordinates?: any;
    proprietary?: boolean; matchState?: string;
    securityRisk?: string; licenseRisk?: string;
  }) {
    const result = await query(
      `INSERT INTO nexus_components
         (component_hash, component_name, display_name, current_version, latest_version,
          recommended_version, format, coordinates, proprietary, match_state,
          security_risk, license_risk)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11::threat_level_type,$12::license_risk)
       ON CONFLICT (component_hash) DO UPDATE SET
         component_name = COALESCE(EXCLUDED.component_name, nexus_components.component_name),
         display_name = COALESCE(EXCLUDED.display_name, nexus_components.display_name),
         latest_version = COALESCE(EXCLUDED.latest_version, nexus_components.latest_version),
         recommended_version = COALESCE(EXCLUDED.recommended_version, nexus_components.recommended_version),
         format = COALESCE(EXCLUDED.format, nexus_components.format),
         coordinates = COALESCE(EXCLUDED.coordinates, nexus_components.coordinates),
         proprietary = COALESCE(EXCLUDED.proprietary, nexus_components.proprietary),
         match_state = COALESCE(EXCLUDED.match_state, nexus_components.match_state),
         updated_at = NOW()
       RETURNING ${COMPONENT_COLS.join(",")}`,
      [
        data.componentHash, data.componentName || null, data.displayName || null,
        data.currentVersion || null, data.latestVersion || null,
        data.recommendedVersion || null,
        data.format || null,
        data.coordinates ? JSON.stringify(data.coordinates) : null,
        data.proprietary ?? false, data.matchState || null,
        data.securityRisk || "NONE", data.licenseRisk || "NONE",
      ]
    );
    return componentRow(result.rows[0]);
  },

  // ---- Evolution ----
  async upsertEvolutionSnapshot(data: {
    applicationId: string; reportId: string; scanDate: string; stage?: string;
    totalViolations?: number; criticalCount?: number; highCount?: number;
    mediumCount?: number; lowCount?: number;
    totalComponents?: number; affectedComponents?: number;
    componentChurn?: any; newViolations?: number; fixedViolations?: number;
  }) {
    const result = await query(
      `INSERT INTO nexus_evolution_snapshots
         (application_id, report_id, scan_date, stage,
          total_violations, critical_count, high_count, medium_count, low_count,
          total_components, affected_components,
          component_churn, new_violations, fixed_violations)
       VALUES ($1,$2,$3,$4::scan_stage,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13,$14)
       ON CONFLICT (report_id) DO UPDATE SET
         total_violations = EXCLUDED.total_violations,
         critical_count = EXCLUDED.critical_count,
         high_count = EXCLUDED.high_count,
         medium_count = EXCLUDED.medium_count,
         low_count = EXCLUDED.low_count,
         total_components = EXCLUDED.total_components,
         affected_components = EXCLUDED.affected_components,
         component_churn = EXCLUDED.component_churn,
         new_violations = EXCLUDED.new_violations,
         fixed_violations = EXCLUDED.fixed_violations,
         updated_at = NOW()
       RETURNING ${EVOLUTION_COLS.join(",")}`,
      [
        data.applicationId, data.reportId, data.scanDate, data.stage || null,
        data.totalViolations ?? 0, data.criticalCount ?? 0, data.highCount ?? 0,
        data.mediumCount ?? 0, data.lowCount ?? 0,
        data.totalComponents ?? 0, data.affectedComponents ?? 0,
        data.componentChurn ? JSON.stringify(data.componentChurn) : null,
        data.newViolations ?? 0, data.fixedViolations ?? 0,
      ]
    );
    return evolutionRow(result.rows[0]);
  },

  async getEvolution(applicationId: string, fromDate?: string, toDate?: string) {
    const params: any[] = [applicationId];
    let idx = 2;
    const conds: string[] = ["application_id = $1"];
    if (fromDate) { conds.push(`scan_date >= $${idx}`); params.push(fromDate); idx++; }
    if (toDate) { conds.push(`scan_date <= $${idx}`); params.push(toDate); idx++; }

    const result = await query(
      `SELECT ${EVOLUTION_COLS.join(",")} FROM nexus_evolution_snapshots
       WHERE ${conds.join(" AND ")}
       ORDER BY scan_date ASC`,
      params
    );
    return result.rows.map(evolutionRow);
  },

  // ---- Component Impact ----
  async upsertComponentImpact(data: {
    applicationId: string; componentHash: string;
    firstSeen: string; lastSeen: string;
    reportsAffected?: number; violationCount?: number;
    maxThreatLevel?: number; versionsSeen?: string[];
  }) {
    const result = await query(
      `INSERT INTO nexus_component_impact
         (application_id, component_hash, first_seen, last_seen,
          reports_affected, violation_count, max_threat_level, versions_seen)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (application_id, component_hash) DO UPDATE SET
         last_seen = GREATEST(nexus_component_impact.last_seen, EXCLUDED.last_seen),
         first_seen = LEAST(nexus_component_impact.first_seen, EXCLUDED.first_seen),
         reports_affected = nexus_component_impact.reports_affected + EXCLUDED.reports_affected,
         violation_count = nexus_component_impact.violation_count + EXCLUDED.violation_count,
         max_threat_level = GREATEST(nexus_component_impact.max_threat_level, EXCLUDED.max_threat_level),
         versions_seen = array(
           SELECT DISTINCT unnest(
             nexus_component_impact.versions_seen || EXCLUDED.versions_seen
           )
         ),
         updated_at = NOW()
       RETURNING ${IMPACT_COLS.join(",")}`,
      [
        data.applicationId, data.componentHash,
        data.firstSeen, data.lastSeen,
        data.reportsAffected ?? 1, data.violationCount ?? 0,
        data.maxThreatLevel ?? 0, data.versionsSeen || [],
      ]
    );
    return result.rows[0];
  },

  async getComponentImpact(applicationId: string) {
    const result = await query(
      `SELECT ${IMPACT_COLS.join(",")} FROM nexus_component_impact
       WHERE application_id = $1
       ORDER BY max_threat_level DESC, violation_count DESC
       LIMIT 100`,
      [applicationId]
    );
    return result.rows;
  },
};
