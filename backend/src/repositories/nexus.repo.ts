import { query, getClient } from "../config/database.js";

// ========== Products ==========
const PRODUCT_COLS = ["id","created_at","updated_at","source_system","sync_batch_id","product_id","name","status","business_criticality","security_owner","product_owner"];
const PRODUCT_COLS_EXT = [...PRODUCT_COLS, "business_owner", "technical_owner", "organization_id"];

function productRow(r: any) {
  return {
    id: r.id, createdAt: r.created_at, updatedAt: r.updated_at,
    sourceSystem: r.source_system, syncBatchId: r.sync_batch_id,
    productId: r.product_id, name: r.name, status: r.status,
    businessCriticality: r.business_criticality,
    securityOwner: r.security_owner, productOwner: r.product_owner,
    businessOwner: r.business_owner ?? null, technicalOwner: r.technical_owner ?? null,
    organizationId: r.organization_id ?? null,
  };
}

// ========== Applications ==========
const APP_COLS = ["id","created_at","updated_at","source_system","sync_batch_id","application_id","application_public_id","application_name","organization_id","tags","categories","business_criticality","security_owner","product_owner","business_owner","technical_owner"];

function appRow(r: any) {
  return {
    id: r.id, createdAt: r.created_at, updatedAt: r.updated_at,
    sourceSystem: r.source_system, syncBatchId: r.sync_batch_id,
    applicationId: r.application_id, applicationPublicId: r.application_public_id,
    applicationName: r.application_name, organizationId: r.organization_id,
    tags: r.tags || [], categories: r.categories || [],
    businessCriticality: r.business_criticality,
    securityOwner: r.security_owner, productOwner: r.product_owner,
    businessOwner: r.business_owner, technicalOwner: r.technical_owner,
  };
}

// ========== Vulnerabilities ==========
const VULN_COLS = ["id","created_at","updated_at","source_system","sync_batch_id","vulnerability_id","ref_id","cvss_score","cvss_vector","severity","component_name","component_version","package_url","dependency_type","reachable","recommended_version","fix_available","exploitability","age_in_days","first_seen_date","last_seen_date","status","application_id","scan_id"];

function vulnRow(r: any) {
  return {
    id: r.id, createdAt: r.created_at, updatedAt: r.updated_at,
    sourceSystem: r.source_system, syncBatchId: r.sync_batch_id,
    vulnerabilityId: r.vulnerability_id, refId: r.ref_id,
    cvssScore: Number(r.cvss_score), cvssVector: r.cvss_vector,
    severity: r.severity, componentName: r.component_name,
    componentVersion: r.component_version, packageUrl: r.package_url,
    dependencyType: r.dependency_type, reachable: r.reachable,
    recommendedVersion: r.recommended_version,
    fixAvailable: r.fix_available, exploitability: r.exploitability,
    ageInDays: r.age_in_days, firstSeenDate: r.first_seen_date,
    lastSeenDate: r.last_seen_date, status: r.status,
    applicationId: r.application_id, scanId: r.scan_id,
  };
}

// ========== Waivers ==========
const WAIVER_COLS = ["id","created_at","updated_at","source_system","sync_batch_id","waiver_id","violation_id","reason","approver","requester","creation_date","expiration_date","status","product_id","application_id","component_name","risk_acceptance_comment"];

function waiverRow(r: any) {
  return {
    id: r.id, createdAt: r.created_at, updatedAt: r.updated_at,
    sourceSystem: r.source_system, syncBatchId: r.sync_batch_id,
    waiverId: r.waiver_id, violationId: r.violation_id,
    reason: r.reason, approver: r.approver, requester: r.requester,
    creationDate: r.creation_date, expirationDate: r.expiration_date,
    status: r.status, productId: r.product_id, applicationId: r.application_id,
    componentName: r.component_name, riskAcceptanceComment: r.risk_acceptance_comment,
  };
}

// ========== Sync Logs ==========
const SYNCLOG_COLS = ["id","created_at","updated_at","source_system","sync_batch_id","batch_id","start_time","end_time","executed_by","status","summary","logs","retry_count","target_url"];

function syncLogRow(r: any) {
  return {
    id: r.id, createdAt: r.created_at, updatedAt: r.updated_at,
    sourceSystem: r.source_system, syncBatchId: r.sync_batch_id,
    batchId: r.batch_id, startTime: r.start_time, endTime: r.end_time,
    executedBy: r.executed_by, status: r.status,
    summary: r.summary, logs: r.logs,
    retryCount: r.retry_count, targetUrl: r.target_url,
  };
}

// ========== Organizations ==========
const ORG_COLS = ["id","created_at","updated_at","source_system","sync_batch_id","organization_id","organization_name","parent_organization_id","description","compliance_officer"];

function orgRow(r: any) {
  return {
    id: r.id, createdAt: r.created_at, updatedAt: r.updated_at,
    sourceSystem: r.source_system, syncBatchId: r.sync_batch_id,
    organizationId: r.organization_id, organizationName: r.organization_name,
    parentOrganizationId: r.parent_organization_id,
    description: r.description, complianceOfficer: r.compliance_officer,
  };
}

// ========== Config ==========
const CONFIG_COLS = ["id","created_at","updated_at","url","username","token_encrypted","timeout_ms","max_retries","is_active"];

function configRow(r: any) {
  return {
    id: r.id, createdAt: r.created_at, updatedAt: r.updated_at,
    url: r.url, username: r.username,
    tokenEncrypted: r.token_encrypted,
    timeoutMs: r.timeout_ms, maxRetries: r.max_retries,
    isActive: r.is_active,
  };
}

export const nexusRepo = {
  // ---- Products ----
  async listProducts(search?: string) {
    const cols = PRODUCT_COLS;
    if (search) {
      const r = await query(`SELECT ${cols.join(",")} FROM nexus_products WHERE name ILIKE $1 ORDER BY name`, [`%${search}%`]);
      return r.rows.map(productRow);
    }
    const r = await query(`SELECT ${cols.join(",")} FROM nexus_products ORDER BY name`);
    return r.rows.map(productRow);
  },

  async getProduct(productId: string) {
    const r = await query(`SELECT ${PRODUCT_COLS.join(",")} FROM nexus_products WHERE product_id = $1`, [productId]);
    return r.rows.length ? productRow(r.rows[0]) : null;
  },

  async upsertProduct(data: any) {
    const r = await query(
      `INSERT INTO nexus_products (product_id, name, status, business_criticality, security_owner, product_owner, sync_batch_id, business_owner, technical_owner, organization_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (product_id) DO UPDATE SET name=$2, status=$3, business_criticality=$4, security_owner=$5, product_owner=$6, sync_batch_id=$7, business_owner=$8, technical_owner=$9, organization_id=$10
       RETURNING ${PRODUCT_COLS_EXT.join(",")}`,
      [data.productId, data.name, data.status, data.businessCriticality, data.securityOwner, data.productOwner, data.syncBatchId, data.businessOwner, data.technicalOwner, data.organizationId]
    );
    return productRow(r.rows[0]);
  },

  // ---- Applications ----
  async listApplications(productId?: string, search?: string) {
    let sql: string;
    const params: any[] = [];
    if (productId) {
      sql = `SELECT a.${APP_COLS.join(",a.")} FROM nexus_applications a
             JOIN product_application_mapping m ON m.application_id = a.application_id
             WHERE m.product_id = $1`;
      params.push(productId);
      if (search) {
        sql += ` AND a.application_name ILIKE $2`;
        params.push(`%${search}%`);
      }
      sql += " ORDER BY a.application_name";
    } else {
      sql = `SELECT ${APP_COLS.join(",")} FROM nexus_applications`;
      if (search) {
        sql += ` WHERE application_name ILIKE $1`;
        params.push(`%${search}%`);
      }
      sql += " ORDER BY application_name";
    }
    const r = await query(sql, params);
    return r.rows.map(appRow);
  },

  async upsertApplication(data: {
    applicationId: string;
    applicationPublicId: string;
    applicationName: string;
    organizationId?: string;
  }) {
    const r = await query(
      `INSERT INTO nexus_applications (application_id, application_public_id, application_name, organization_id, source_system)
       VALUES ($1,$2,$3,$4,'sonatype_nexus_iq')
       ON CONFLICT (application_id) DO UPDATE SET application_public_id=$2, application_name=$3, organization_id=$4
       RETURNING ${APP_COLS.join(",")}`,
      [data.applicationId, data.applicationPublicId, data.applicationName, data.organizationId || null]
    );
    return r.rows.length ? appRow(r.rows[0]) : null;
  },

  // ---- Vulnerabilities ----
  async listVulnerabilities(filters: { page: number; limit: number; severity?: string; status?: string; productId?: string; applicationId?: string; search?: string }) {
    const params: any[] = []; let idx = 1;
    const conds: string[] = [];
    if (filters.severity) { conds.push(`v.severity = $${idx++}`); params.push(filters.severity); }
    if (filters.status) { conds.push(`v.status = $${idx++}`); params.push(filters.status); }
    if (filters.applicationId) { conds.push(`v.application_id = $${idx++}`); params.push(filters.applicationId); }
    if (filters.search) { conds.push(`(v.vulnerability_id ILIKE $${idx++} OR v.component_name ILIKE $${idx++})`); params.push(`%${filters.search}%`, `%${filters.search}%`); }

    let join = "";
    if (filters.productId) {
      join = `JOIN product_application_mapping m ON m.application_id = v.application_id`;
      conds.push(`m.product_id = $${idx++}`);
      params.push(filters.productId);
    }

    const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
    const offset = (filters.page - 1) * filters.limit;
    const count = await query(`SELECT COUNT(*) FROM nexus_vulnerabilities v ${join} ${where}`, params);
    const total = parseInt(count.rows[0].count, 10);
    const data = await query(
      `SELECT v.${VULN_COLS.join(",v.")} FROM nexus_vulnerabilities v ${join} ${where} ORDER BY v.cvss_score DESC LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, filters.limit, offset]
    );
    return { data: data.rows.map(vulnRow), total, page: filters.page, limit: filters.limit };
  },

  async getVulnerability(id: string) {
    const r = await query(`SELECT ${VULN_COLS.join(",")} FROM nexus_vulnerabilities WHERE vulnerability_id = $1`, [id]);
    return r.rows.length ? vulnRow(r.rows[0]) : null;
  },

  async bulkUpsertVulnerabilities(vulns: any[]) {
    const client = await getClient();
    try {
      await client.query("BEGIN");
      for (const v of vulns) {
        await client.query(
          `INSERT INTO nexus_vulnerabilities (vulnerability_id, ref_id, cvss_score, cvss_vector, severity, component_name, component_version, package_url, dependency_type, reachable, recommended_version, fix_available, exploitability, age_in_days, first_seen_date, last_seen_date, status, application_id, scan_id, sync_batch_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
           ON CONFLICT (vulnerability_id) DO UPDATE SET cvss_score=$3, severity=$5, status=$17, last_seen_date=$16, age_in_days=$14`,
          [v.vulnerabilityId, v.refId, v.cvssScore, v.cvssVector, v.severity, v.componentName, v.componentVersion, v.packageUrl, v.dependencyType, v.reachable, v.recommendedVersion, v.fixAvailable, v.exploitability, v.ageInDays, v.firstSeenDate, v.lastSeenDate, v.status, v.applicationId, v.scanId, v.syncBatchId]
        );
      }
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },

  // ---- Waivers ----
  async listWaivers(filters: { productId?: string; status?: string }) {
    const params: any[] = []; const conds: string[] = [];
    if (filters.productId) { conds.push("product_id = $1"); params.push(filters.productId); }
    if (filters.status) { conds.push(`status = $${params.length + 1}`); params.push(filters.status); }
    const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
    const r = await query(`SELECT ${WAIVER_COLS.join(",")} FROM nexus_waivers ${where} ORDER BY creation_date DESC`, params);
    return r.rows.map(waiverRow);
  },

  async createWaiver(data: any) {
    const r = await query(
      `INSERT INTO nexus_waivers (waiver_id, violation_id, reason, requester, creation_date, expiration_date, product_id, application_id, component_name, risk_acceptance_comment, status, sync_batch_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING ${WAIVER_COLS.join(",")}`,
      [data.waiverId, data.violationId, data.reason, data.requester, data.creationDate || new Date().toISOString(), data.expirationDate, data.productId, data.applicationId, data.componentName, data.riskAcceptanceComment, data.status || "active", data.syncBatchId]
    );
    return waiverRow(r.rows[0]);
  },

  async updateWaiverStatus(waiverId: string, status: string) {
    const r = await query(
      `UPDATE nexus_waivers SET status = $2 WHERE waiver_id = $1 RETURNING ${WAIVER_COLS.join(",")}`,
      [waiverId, status]
    );
    return r.rows.length ? waiverRow(r.rows[0]) : null;
  },

  async expireOverdueWaivers() {
    const r = await query(
      `UPDATE nexus_waivers SET status = 'expired' WHERE status = 'active' AND expiration_date < NOW() RETURNING ${WAIVER_COLS.join(",")}`
    );
    return r.rows.map(waiverRow);
  },

  // ---- Sync Logs ----
  async listSyncLogs(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const count = await query("SELECT COUNT(*) FROM nexus_sync_logs");
    const total = parseInt(count.rows[0].count, 10);
    const r = await query(`SELECT ${SYNCLOG_COLS.join(",")} FROM nexus_sync_logs ORDER BY start_time DESC LIMIT $1 OFFSET $2`, [limit, offset]);
    return { data: r.rows.map(syncLogRow), total, page, limit };
  },

  async createSyncLog(data: any) {
    const r = await query(
      `INSERT INTO nexus_sync_logs (batch_id, start_time, executed_by, status, target_url, sync_batch_id)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING ${SYNCLOG_COLS.join(",")}`,
      [data.batchId, data.startTime || new Date().toISOString(), data.executedBy, data.status || "IN_PROGRESS", data.targetUrl, data.syncBatchId]
    );
    return syncLogRow(r.rows[0]);
  },

  async updateSyncLog(batchId: string, data: any) {
    const r = await query(
      `UPDATE nexus_sync_logs SET status = COALESCE($2, status), end_time = COALESCE($3, end_time), summary = COALESCE($4, summary), logs = COALESCE($5, logs), retry_count = COALESCE($6, retry_count) WHERE batch_id = $1 RETURNING ${SYNCLOG_COLS.join(",")}`,
      [batchId, data.status, data.endTime, data.summary, data.logs, data.retryCount]
    );
    return r.rows.length ? syncLogRow(r.rows[0]) : null;
  },

  // ---- KPI Snapshots ----
  async getLatestKpiSnapshot() {
    const r = await query("SELECT * FROM nexus_kpi_snapshots ORDER BY snapshot_date DESC LIMIT 1");
    if (!r.rows.length) return null;
    const s = r.rows[0];
    return {
      snapshotDate: s.snapshot_date,
      globalSecurityRiskScore: Number(s.global_security_risk_score),
      totalVulnerabilities: s.total_vulnerabilities,
      criticalVulnerabilities: s.critical_vulnerabilities,
      highVulnerabilities: s.high_vulnerabilities,
      newVulnerabilities: s.new_vulnerabilities,
      fixedVulnerabilities: s.fixed_vulnerabilities,
      acceptedRiskCount: s.accepted_risk_count,
      expiredWaiversCount: s.expired_waivers_count,
      productsRedCount: s.products_red_count,
      productsOrangeCount: s.products_orange_count,
      productsGreenCount: s.products_green_count,
      securityDebtScore: s.security_debt_score,
      complianceScore: Number(s.compliance_score),
    };
  },

  // ---- Config ----
  async getConfig() {
    const r = await query(`SELECT ${CONFIG_COLS.join(",")} FROM nexus_config WHERE is_active = TRUE LIMIT 1`);
    return r.rows.length ? configRow(r.rows[0]) : null;
  },

  async upsertConfig(data: any) {
    const r = await query(
      `INSERT INTO nexus_config (url, username, token_encrypted, timeout_ms, max_retries, is_active)
       VALUES ($1,$2,$3,$4,$5,TRUE)
       ON CONFLICT DO NOTHING
       RETURNING ${CONFIG_COLS.join(",")}`,
      [data.url, data.username, data.tokenEncrypted, data.timeoutMs, data.maxRetries]
    );
    if (r.rows.length) return configRow(r.rows[0]);
    const updated = await query(`UPDATE nexus_config SET url=$1, username=$2, token_encrypted=$3, timeout_ms=$4, max_retries=$5 WHERE is_active=TRUE RETURNING ${CONFIG_COLS.join(",")}`, [data.url, data.username, data.tokenEncrypted, data.timeoutMs, data.maxRetries]);
    return configRow(updated.rows[0]);
  },

  // ---- Alerts ----
  // ---- Organizations ----
  async listOrganizations() {
    const r = await query(`SELECT ${ORG_COLS.join(",")} FROM nexus_organizations ORDER BY organization_name`);
    return r.rows.map(orgRow);
  },

  async getOrganization(organizationId: string) {
    const r = await query(`SELECT ${ORG_COLS.join(",")} FROM nexus_organizations WHERE organization_id = $1`, [organizationId]);
    return r.rows.length ? orgRow(r.rows[0]) : null;
  },

  async upsertOrganization(data: any) {
    const r = await query(
      `INSERT INTO nexus_organizations (organization_id, organization_name, parent_organization_id, description, compliance_officer, sync_batch_id)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (organization_id) DO UPDATE SET organization_name=$2, parent_organization_id=$3, description=$4, compliance_officer=$5, sync_batch_id=$6
       RETURNING ${ORG_COLS.join(",")}`,
      [data.organizationId, data.organizationName, data.parentOrganizationId, data.description, data.complianceOfficer, data.syncBatchId]
    );
    return orgRow(r.rows[0]);
  },

  async updateOrganization(organizationId: string, data: any) {
    const fields: string[] = []; const params: any[] = []; let idx = 1;
    if (data.organizationName !== undefined) { fields.push(`organization_name = $${idx++}`); params.push(data.organizationName); }
    if (data.description !== undefined) { fields.push(`description = $${idx++}`); params.push(data.description); }
    if (data.complianceOfficer !== undefined) { fields.push(`compliance_officer = $${idx++}`); params.push(data.complianceOfficer); }
    if (data.parentOrganizationId !== undefined) { fields.push(`parent_organization_id = $${idx++}`); params.push(data.parentOrganizationId); }
    if (!fields.length) return null;
    params.push(organizationId);
    const r = await query(`UPDATE nexus_organizations SET ${fields.join(", ")} WHERE organization_id = $${idx} RETURNING ${ORG_COLS.join(",")}`, params);
    return r.rows.length ? orgRow(r.rows[0]) : null;
  },

  // ---- Compliance Posture ----
  async getCompliancePosture(organizationId: string) {
    const r = await query(`SELECT * FROM org_compliance_posture WHERE organization_id = $1`, [organizationId]);
    if (!r.rows.length) return null;
    const p = r.rows[0];
    return {
      id: p.id, createdAt: p.created_at, updatedAt: p.updated_at,
      organizationId: p.organization_id, snapshotDate: p.snapshot_date,
      totalFindings: p.total_findings, criticalFindings: p.critical_findings,
      highFindings: p.high_findings, openFindings: p.open_findings,
      acceptedRisks: p.accepted_risks, overdueFindings: p.overdue_findings,
      avgRiskScore: Number(p.avg_risk_score), fixVelocityPct: Number(p.fix_velocity_pct),
      slaBreachPct: Number(p.sla_breach_pct), complianceScore: Number(p.compliance_score),
      postureGrade: p.posture_grade, metadata: p.metadata,
    };
  },

  async upsertCompliancePosture(organizationId: string, data: any) {
    const r = await query(
      `INSERT INTO org_compliance_posture (organization_id, snapshot_date, total_findings, critical_findings, high_findings, open_findings, accepted_risks, overdue_findings, avg_risk_score, fix_velocity_pct, sla_breach_pct, compliance_score, posture_grade)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (organization_id) DO UPDATE SET
         snapshot_date = EXCLUDED.snapshot_date,
         total_findings = EXCLUDED.total_findings,
         critical_findings = EXCLUDED.critical_findings,
         high_findings = EXCLUDED.high_findings,
         open_findings = EXCLUDED.open_findings,
         accepted_risks = EXCLUDED.accepted_risks,
         overdue_findings = EXCLUDED.overdue_findings,
         avg_risk_score = EXCLUDED.avg_risk_score,
         fix_velocity_pct = EXCLUDED.fix_velocity_pct,
         sla_breach_pct = EXCLUDED.sla_breach_pct,
         compliance_score = EXCLUDED.compliance_score,
         posture_grade = EXCLUDED.posture_grade`,
      [organizationId, data.snapshotDate || new Date().toISOString().split("T")[0], data.totalFindings || 0, data.criticalFindings || 0, data.highFindings || 0, data.openFindings || 0, data.acceptedRisks || 0, data.overdueFindings || 0, data.avgRiskScore || 0, data.fixVelocityPct || 0, data.slaBreachPct || 0, data.complianceScore || 100, data.postureGrade || "GREEN"]
    );
    return r.rows[0];
  },

  async listAllCompliancePostures() {
    const r = await query("SELECT * FROM org_compliance_posture ORDER BY posture_grade, organization_id");
    return r.rows.map((p: any) => ({
      organizationId: p.organization_id, snapshotDate: p.snapshot_date,
      totalFindings: p.total_findings, criticalFindings: p.critical_findings,
      highFindings: p.high_findings, openFindings: p.open_findings,
      acceptedRisks: p.accepted_risks, overdueFindings: p.overdue_findings,
      avgRiskScore: Number(p.avg_risk_score), fixVelocityPct: Number(p.fix_velocity_pct),
      slaBreachPct: Number(p.sla_breach_pct), complianceScore: Number(p.compliance_score),
      postureGrade: p.posture_grade,
    }));
  },

  async listAlerts(limit = 10) {
    const r = await query("SELECT * FROM nexus_alerts WHERE archived = FALSE ORDER BY timestamp DESC LIMIT $1", [limit]);
    return r.rows.map((a: any) => ({
      id: a.id, createdAt: a.created_at,
      alertType: a.alert_type, message: a.message,
      productId: a.product_id, applicationId: a.application_id,
      timestamp: a.timestamp, archived: a.archived,
    }));
  },
};
