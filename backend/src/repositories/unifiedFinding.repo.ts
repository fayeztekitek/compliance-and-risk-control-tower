import { query, getClient } from "../config/database.js";

const UF_COLS = [
  "id", "created_at", "updated_at",
  "source_tool", "source_id", "source_table",
  "product_id", "application_id", "target_product",
  "title", "description",
  "unified_severity", "native_severity", "cvss_score", "cvss_vector", "cve_id", "cwe_id",
  "status", "remediation", "fix_available", "recommended_version",
  "detected_date", "remediated_date", "sla_due_date",
  "epss_score", "cisa_kev", "risk_score",
  "component_name", "component_version", "package_url",
  "dependency_type", "reachability", "exploitability",
  "age_in_days", "first_seen_date", "last_seen_date", "scan_id",
  "regulatory_tags", "pii_impact",
  "waiver_id", "risk_acceptance_id", "audit_finding_id",
  "deleted_at", "metadata",
];

async function checkTableExists(): Promise<boolean> {
  try {
    await query("SELECT 1 FROM unified_findings LIMIT 0");
    return true;
  } catch {
    return false;
  }
}

function ufRow(r: any) {
  return {
    id: r.id, createdAt: r.created_at, updatedAt: r.updated_at,
    sourceTool: r.source_tool, sourceId: r.source_id, sourceTable: r.source_table,
    productId: r.product_id, applicationId: r.application_id, targetProduct: r.target_product,
    title: r.title, description: r.description,
    unifiedSeverity: r.unified_severity, nativeSeverity: r.native_severity,
    cvssScore: r.cvss_score ? Number(r.cvss_score) : null,
    cvssVector: r.cvss_vector, cveId: r.cve_id, cweId: r.cwe_id,
    status: r.status, remediation: r.remediation,
    fixAvailable: r.fix_available, recommendedVersion: r.recommended_version,
    detectedDate: r.detected_date, remediatedDate: r.remediated_date,
    slaDueDate: r.sla_due_date,
    epssScore: r.epss_score ? Number(r.epss_score) : 0,
    cisaKev: r.cisa_kev, riskScore: r.risk_score ? Number(r.risk_score) : null,
    componentName: r.component_name, componentVersion: r.component_version,
    packageUrl: r.package_url,
    dependencyType: r.dependency_type, reachability: r.reachability,
    exploitability: r.exploitability, ageInDays: r.age_in_days,
    firstSeenDate: r.first_seen_date, lastSeenDate: r.last_seen_date,
    scanId: r.scan_id,
    regulatoryTags: r.regulatory_tags || [], piiImpact: r.pii_impact,
    waiverId: r.waiver_id, riskAcceptanceId: r.risk_acceptance_id,
    auditFindingId: r.audit_finding_id,
    metadata: r.metadata,
  };
}

export const unifiedFindingRepo = {
  async listFindings(filters: {
    page: number; limit: number;
    sourceTool?: string; severity?: string; status?: string;
    productId?: string; applicationId?: string; cveId?: string;
    search?: string; includeDeleted?: boolean;
  }) {
    if (!(await checkTableExists())) {
      return { data: [], total: 0, page: filters.page, limit: filters.limit };
    }
    const params: any[] = [];
    let idx = 1;
    const conds: string[] = filters.includeDeleted ? [] : ["deleted_at IS NULL"];

    if (filters.sourceTool) { conds.push(`source_tool = $${idx++}::finding_source`); params.push(filters.sourceTool.toUpperCase()); }
    if (filters.severity) { conds.push(`unified_severity = $${idx++}::severity`); params.push(filters.severity.toUpperCase()); }
    if (filters.status) { conds.push(`status = $${idx++}::unified_finding_status`); params.push(filters.status.toUpperCase()); }
    if (filters.productId) { conds.push(`product_id = $${idx++}`); params.push(filters.productId); }
    if (filters.applicationId) { conds.push(`application_id = $${idx++}`); params.push(filters.applicationId); }
    if (filters.cveId) { conds.push(`cve_id = $${idx++}`); params.push(filters.cveId); }
    if (filters.search) {
      conds.push(`(title ILIKE $${idx++} OR cve_id ILIKE $${idx++} OR component_name ILIKE $${idx++})`);
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }

    const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
    const offset = (filters.page - 1) * filters.limit;

    const countResult = await query<{ count: string }>(`SELECT COUNT(*) FROM unified_findings ${where}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    const dataResult = await query(
      `SELECT ${UF_COLS.join(", ")} FROM unified_findings ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, filters.limit, offset]
    );

    return { data: dataResult.rows.map(ufRow), total, page: filters.page, limit: filters.limit };
  },

  async getFinding(id: string) {
    if (!(await checkTableExists())) return null;
    const result = await query(
      `SELECT ${UF_COLS.join(", ")} FROM unified_findings WHERE id = $1`,
      [id]
    );
    return result.rows.length ? ufRow(result.rows[0]) : null;
  },

  async createFinding(data: any) {
    if (!(await checkTableExists())) {
      return { id: "offline", title: data.title, unifiedSeverity: data.unifiedSeverity, sourceTool: data.sourceTool, status: "OPEN" };
    }
    const cols = ["source_tool", "title", "unified_severity", "detected_date"];
    const vals = ["$1::finding_source", "$2", "$3::severity", "$4"];
    const params: any[] = [
      data.sourceTool, data.title, data.unifiedSeverity,
      data.detectedDate || new Date().toISOString().split("T")[0],
    ];
    let idx = 5;

    const optional: Record<string, string> = {
      sourceId: "source_id", sourceTable: "source_table",
      targetProduct: "target_product", description: "description",
      nativeSeverity: "native_severity", cvssScore: "cvss_score",
      cvssVector: "cvss_vector", cveId: "cve_id", cweId: "cwe_id",
      status: "status", remediation: "remediation",
      fixAvailable: "fix_available", recommendedVersion: "recommended_version",
      remediatedDate: "remediated_date", slaDueDate: "sla_due_date",
      componentName: "component_name", componentVersion: "component_version",
      packageUrl: "package_url", ageInDays: "age_in_days",
      firstSeenDate: "first_seen_date", lastSeenDate: "last_seen_date",
      scanId: "scan_id", productId: "product_id", applicationId: "application_id",
      waiverId: "waiver_id", riskAcceptanceId: "risk_acceptance_id",
      auditFindingId: "audit_finding_id", piiImpact: "pii_impact",
    };

    for (const [key, col] of Object.entries(optional)) {
      if (data[key] !== undefined && data[key] !== null) {
        cols.push(col);
        vals.push(`$${idx++}`);
        params.push(data[key]);
      }
    }

    const result = await query(
      `INSERT INTO unified_findings (${cols.join(", ")}) VALUES (${vals.join(", ")}) RETURNING ${UF_COLS.join(", ")}`,
      params
    );
    return ufRow(result.rows[0]);
  },

  async updateFinding(id: string, data: any) {
    const fields: string[] = [];
    const params: any[] = [];
    let idx = 1;

    const mapping: Record<string, string> = {
      title: "title", description: "description",
      unifiedSeverity: "unified_severity", nativeSeverity: "native_severity",
      cvssScore: "cvss_score", cvssVector: "cvss_vector", cveId: "cve_id", cweId: "cwe_id",
      status: "status", remediation: "remediation",
      fixAvailable: "fix_available", recommendedVersion: "recommended_version",
      remediatedDate: "remediated_date", slaDueDate: "sla_due_date",
      epssScore: "epss_score", cisaKev: "cisa_kev", riskScore: "risk_score",
      componentName: "component_name", componentVersion: "component_version",
      packageUrl: "package_url",
      ageInDays: "age_in_days", lastSeenDate: "last_seen_date",
      waiverId: "waiver_id", riskAcceptanceId: "risk_acceptance_id",
      auditFindingId: "audit_finding_id", piiImpact: "pii_impact",
      targetProduct: "target_product",
    };

    for (const [key, col] of Object.entries(mapping)) {
      if (data[key] !== undefined) {
        fields.push(`${col} = $${idx++}`);
        params.push(data[key]);
      }
    }
    if (!fields.length) return null;

    params.push(id);
    const result = await query(
      `UPDATE unified_findings SET ${fields.join(", ")} WHERE id = $${idx} RETURNING ${UF_COLS.join(", ")}`,
      params
    );
    return result.rows.length ? ufRow(result.rows[0]) : null;
  },

  async softDelete(id: string) {
    await query("UPDATE unified_findings SET deleted_at = NOW() WHERE id = $1", [id]);
  },

  async bulkUpsertFindings(findings: any[]) {
    if (!findings.length) return;
    const client = await getClient();
    try {
      await client.query("BEGIN");
      for (const f of findings) {
        await client.query(
          `INSERT INTO unified_findings (
            source_tool, source_id, source_table, title, unified_severity,
            cvss_score, cve_id, status, component_name, component_version,
            package_url, scan_id, application_id, fix_available,
            recommended_version, metadata
          ) VALUES (
            $1::finding_source, $2, $3, $4, $5::severity,
            $6, $7, $8::unified_finding_status, $9, $10,
            $11, $12, $13, $14,
            $15, $16::jsonb
          ) ON CONFLICT (id) DO UPDATE SET
            cvss_score = EXCLUDED.cvss_score,
            status = EXCLUDED.status,
            updated_at = NOW()`,
          [
            f.sourceTool, f.sourceId, f.sourceTable, f.title, f.unifiedSeverity,
            f.cvssScore, f.cveId, f.status || "OPEN", f.componentName, f.componentVersion,
            f.packageUrl, f.scanId, f.applicationId, f.fixAvailable || false,
            f.recommendedVersion, JSON.stringify(f.metadata || {}),
          ]
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

  async getStats() {
    if (!(await checkTableExists())) return [];
    const result = await query(`
      SELECT
        source_tool, unified_severity, status,
        COUNT(*) as count
      FROM unified_findings
      WHERE deleted_at IS NULL
      GROUP BY GROUPING SETS (
        (source_tool), (unified_severity), (status), ()
      )
    `);
    return result.rows;
  },

  async listFindingsByScanId(scanId: string) {
    if (!(await checkTableExists())) return [];
    const result = await query(
      `SELECT ${UF_COLS.join(", ")} FROM unified_findings WHERE scan_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC`,
      [scanId]
    );
    return result.rows.map(ufRow);
  },

  async listFindingsByAppId(applicationId: string) {
    if (!(await checkTableExists())) return [];
    const result = await query(
      `SELECT ${UF_COLS.join(", ")} FROM unified_findings WHERE application_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC`,
      [applicationId]
    );
    return result.rows.map(ufRow);
  },

  async searchByCve(cveId: string) {
    const result = await query(
      `SELECT ${UF_COLS.join(", ")} FROM unified_findings WHERE cve_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC`,
      [cveId]
    );
    return result.rows.map(ufRow);
  },

  // ── Enrichment methods ──

  async getUnenrichedFindings(limit: number = 50): Promise<any[]> {
    if (!(await checkTableExists())) return [];
    const result = await query(
      `SELECT id, cve_id, source_tool, title FROM unified_findings
       WHERE cve_id IS NOT NULL AND cve_id != ''
         AND (epss_score IS NULL OR epss_score = 0)
         AND deleted_at IS NULL
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  },

  async getEnrichment(cveId: string): Promise<any | null> {
    const result = await query(
      `SELECT * FROM vulnerability_enrichments WHERE cve_id = $1`,
      [cveId.toUpperCase()]
    );
    return result.rows.length ? result.rows[0] : null;
  },

  async upsertEnrichment(data: {
    cveId: string;
    epssScore: number;
    epssPercentile: number;
    cisaKev: boolean;
    cisaKevDate: string | null;
    cisaKevDescription: string | null;
  }): Promise<void> {
    await query(
      `INSERT INTO vulnerability_enrichments (cve_id, epss_score, epss_percentile, cisa_kev, cisa_kev_date, cisa_kev_description, last_fetched_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (cve_id) DO UPDATE SET
         epss_score = EXCLUDED.epss_score,
         epss_percentile = EXCLUDED.epss_percentile,
         cisa_kev = EXCLUDED.cisa_kev,
         cisa_kev_date = EXCLUDED.cisa_kev_date,
         cisa_kev_description = EXCLUDED.cisa_kev_description,
         last_fetched_at = NOW()`,
      [data.cveId.toUpperCase(), data.epssScore, data.epssPercentile, data.cisaKev, data.cisaKevDate, data.cisaKevDescription]
    );
  },

  async applyEnrichmentToFindings(cveId: string, epssScore: number, cisaKev: boolean): Promise<number> {
    const result = await query(
      `UPDATE unified_findings
       SET epss_score = $2, cisa_kev = $3, updated_at = NOW()
       WHERE cve_id = $1 AND deleted_at IS NULL`,
      [cveId.toUpperCase(), epssScore, cisaKev]
    );
    return result.rowCount ?? 0;
  },

  async countEnrichedFindings(): Promise<number> {
    const result = await query(
      "SELECT COUNT(*) as count FROM unified_findings WHERE epss_score > 0 AND deleted_at IS NULL"
    );
    return parseInt((result.rows[0]?.count as string) || "0", 10);
  },

  async countTotalFindingsWithCve(): Promise<number> {
    const result = await query(
      "SELECT COUNT(*) as count FROM unified_findings WHERE cve_id IS NOT NULL AND cve_id != '' AND deleted_at IS NULL"
    );
    return parseInt((result.rows[0]?.count as string) || "0", 10);
  },
};
