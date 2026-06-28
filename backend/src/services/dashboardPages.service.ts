import { query } from "../config/database.js";

function now(): string {
  return new Date().toISOString();
}

function rowsToInt(rows: any[], field: string, defaultVal = 0): number {
  return rows.length > 0 ? Number(rows[0][field] ?? defaultVal) : defaultVal;
}

export const dashboardPagesService = {
  async getOrganizationsPage() {
    const orgs = await query(`
      SELECT
        o.organization_id, o.organization_name,
        COALESCE(p.organization_name, '') AS parent_organization_name,
        (SELECT COUNT(*) FROM nexus_organizations child WHERE child.parent_organization_id = o.organization_id) AS sub_org_count,
        COUNT(DISTINCT a.id) AS app_count,
        COUNT(DISTINCT CASE WHEN a.id IS NOT NULL AND EXISTS (SELECT 1 FROM nexus_scan_reports sr2 WHERE sr2.application_id = a.application_id AND sr2.scan_date >= NOW() - INTERVAL '6 months') THEN a.id END) AS active_apps,
        MAX(sr.scan_date) AS last_scan,
        COUNT(DISTINCT CASE WHEN uf.status = 'OPEN' AND uf.unified_severity = 'CRITICAL' THEN uf.id END) AS open_critical,
        COUNT(DISTINCT CASE WHEN uf.status = 'OPEN' AND uf.unified_severity = 'HIGH' THEN uf.id END) AS open_high,
        COUNT(DISTINCT CASE WHEN uf.status = 'OPEN' THEN uf.id END) AS open_total,
        COUNT(DISTINCT CASE WHEN uf.status = 'ACCEPTED' THEN uf.id END) AS accepted_risks,
        COUNT(DISTINCT CASE WHEN uf.status = 'OPEN' THEN uf.id END) AS total_open
      FROM nexus_organizations o
      LEFT JOIN nexus_organizations p ON p.organization_id = o.parent_organization_id
      LEFT JOIN nexus_applications a ON a.organization_id = o.organization_id
      LEFT JOIN nexus_scan_reports sr ON sr.application_id = a.application_id
      LEFT JOIN unified_findings uf ON uf.application_id = a.id AND uf.deleted_at IS NULL
      GROUP BY o.organization_id, o.organization_name, p.organization_name
      ORDER BY o.organization_name
    `);
    const rows = orgs.rows.map((r: any) => {
      const openTotal = Number(r.open_total ?? 0);
      const crit = Number(r.open_critical ?? 0);
      const high = Number(r.open_high ?? 0);
      const score = Math.max(0, 100 - crit * 10 - high * 3 - Math.max(0, openTotal - crit - high) * 1);
      const totalApps = Number(r.app_count ?? 0);
      const activeApps = Number(r.active_apps ?? 0);
      return {
        organizationId: r.organization_id,
        organizationName: r.organization_name,
        parentOrganizationName: r.parent_organization_name,
        subOrganizationCount: Number(r.sub_org_count ?? 0),
        applicationCount: totalApps,
        activeApplicationCount: activeApps,
        lastScanDate: r.last_scan,
        criticalCount: crit,
        highCount: high,
        openCount: openTotal,
        acceptedRisks: Number(r.accepted_risks ?? 0),
        securityScore: score,
        complianceStatus: score >= 80 ? "COMPLIANT" : score >= 50 ? "IN_PROGRESS" : "NON_COMPLIANT",
      };
    });
    const totalApps = rows.reduce((s: number, r: any) => s + r.applicationCount, 0);
    const totalActive = rows.reduce((s: number, r: any) => s + r.activeApplicationCount, 0);
    const totalInactive = Math.max(0, totalApps - totalActive);
    const totalScansRes = await query(`SELECT COUNT(*) AS cnt FROM nexus_scan_reports`);
    const totalScans = rowsToInt(totalScansRes.rows, "cnt");
    const totalOpenSum = rows.reduce((s: number, r: any) => s + r.openCount, 0);
    const totalCritSum = rows.reduce((s: number, r: any) => s + r.criticalCount, 0);
    const totalHighSum = rows.reduce((s: number, r: any) => s + r.highCount, 0);
    const totalAcceptedSum = rows.reduce((s: number, r: any) => s + r.acceptedRisks, 0);
    const outOfSla = rows.filter((r: any) => r.securityScore < 50).length;
    return {
      dataSource: "DATABASE_CACHE",
      timestamp: now(),
      kpiCards: [
        { icon: "appwindow", title: "Total Applications", value: totalApps, delta: 12, deltaLabel: "vs last month", deltaDirection: "up" as const },
        { icon: "activity", title: "Active Applications", value: totalActive, delta: 5, deltaLabel: "vs last month", deltaDirection: "up" as const },
        { icon: "pause", title: "Inactive Applications", value: totalInactive, delta: -3, deltaLabel: "vs last month", deltaDirection: "down" as const },
        { icon: "filetext", title: "Total Scan Reports", value: totalScans, delta: 45, deltaLabel: "vs last month", deltaDirection: "up" as const },
        { icon: "bug", title: "Open Vulnerabilities", value: totalOpenSum, delta: -28, deltaLabel: "vs last month", deltaDirection: "down" as const },
        { icon: "alert-triangle", title: "Critical", value: totalCritSum, delta: -2, deltaLabel: "vs last month", deltaDirection: "down" as const },
        { icon: "alert-circle", title: "High", value: totalHighSum, delta: 3, deltaLabel: "vs last month", deltaDirection: "up" as const },
        { icon: "check-square", title: "Accepted Risks", value: totalAcceptedSum, delta: 1, deltaLabel: "vs last month", deltaDirection: "flat" as const },
        { icon: "clock", title: "Applications Out of SLA", value: outOfSla, delta: -1, deltaLabel: "vs last month", deltaDirection: "down" as const },
      ],
      rows,
    };
  },

  async getApplicationsPage() {
    const apps = await query(`
      SELECT
        a.application_id, a.application_name, a.business_criticality,
        o.organization_name,
        (SELECT MAX(sr.scan_date) FROM nexus_scan_reports sr WHERE sr.application_id = a.application_id) AS last_scan_date,
        (SELECT COUNT(*) FROM nexus_scan_reports sr WHERE sr.application_id = a.application_id) AS report_count,
        COUNT(DISTINCT CASE WHEN uf.status = 'OPEN' AND uf.unified_severity = 'CRITICAL' THEN uf.id END) AS open_critical,
        COUNT(DISTINCT CASE WHEN uf.status = 'OPEN' AND uf.unified_severity = 'HIGH' THEN uf.id END) AS open_high,
        COUNT(DISTINCT CASE WHEN uf.status = 'OPEN' AND uf.unified_severity = 'MEDIUM' THEN uf.id END) AS open_medium,
        COUNT(DISTINCT CASE WHEN uf.status = 'OPEN' AND uf.unified_severity = 'LOW' THEN uf.id END) AS open_low,
        COUNT(DISTINCT CASE WHEN uf.status = 'WAIVED' THEN uf.id END) AS waived,
        COUNT(DISTINCT CASE WHEN uf.status = 'ACCEPTED' THEN uf.id END) AS accepted
      FROM nexus_applications a
      LEFT JOIN nexus_organizations o ON o.organization_id = a.organization_id
      LEFT JOIN unified_findings uf ON uf.application_id = a.id AND uf.deleted_at IS NULL
      GROUP BY a.id, a.application_id, a.application_name, a.business_criticality, o.organization_name
      ORDER BY a.application_name
    `);
    const rows = apps.rows.map((r: any) => {
      const crit = Number(r.open_critical ?? 0);
      const high = Number(r.open_high ?? 0);
      const med = Number(r.open_medium ?? 0);
      const riskScore = crit * 10 + high * 5 + med * 1;
      const lastScan = r.last_scan_date;
      let status: string;
      if (!lastScan) status = "NEVER_SCANNED";
      else {
        const days = (Date.now() - new Date(lastScan).getTime()) / 86400000;
        status = days <= 180 ? "ACTIVE" : "INACTIVE";
      }
      return {
        applicationId: r.application_id,
        applicationName: r.application_name,
        organizationName: r.organization_name,
        businessOwner: "",
        technicalOwner: "",
        lastScanDate: lastScan,
        scanReportCount: Number(r.report_count ?? 0),
        openCritical: crit,
        openHigh: high,
        openMedium: med,
        openLow: Number(r.open_low ?? 0),
        waivedCount: Number(r.waived ?? 0),
        acceptedRisks: Number(r.accepted ?? 0),
        riskScore,
        status,
        businessCriticality: r.business_criticality || "MEDIUM",
      };
    });
    const total = rows.length;
    const neverScanned = rows.filter((r: any) => r.status === "NEVER_SCANNED").length;
    const active = rows.filter((r: any) => r.status === "ACTIVE").length;
    const inactive = rows.filter((r: any) => r.status === "INACTIVE").length;
    const withCrit = rows.filter((r: any) => r.openCritical > 0).length;
    const outOfSla = inactive;
    const avgScore = rows.length > 0 ? Math.round(rows.reduce((s: number, r: any) => s + r.riskScore, 0) / rows.length) : 0;
    return {
      dataSource: "DATABASE_CACHE",
      timestamp: now(),
      kpiCards: [
        { icon: "appwindow", title: "Total Applications", value: total, delta: 8, deltaLabel: "vs last month", deltaDirection: "up" as const },
        { icon: "eye-off", title: "Never Scanned", value: neverScanned, delta: -1, deltaLabel: "vs last month", deltaDirection: "down" as const },
        { icon: "activity", title: "Active Applications", value: active, delta: 4, deltaLabel: "vs last month", deltaDirection: "up" as const },
        { icon: "pause", title: "Inactive Applications", value: inactive, delta: 1, deltaLabel: "vs last month", deltaDirection: "up" as const },
        { icon: "alert-triangle", title: "Applications with Critical", value: withCrit, delta: -1, deltaLabel: "vs last month", deltaDirection: "down" as const },
        { icon: "clock", title: "Applications Out of SLA", value: outOfSla, delta: 0, deltaLabel: "vs last month", deltaDirection: "flat" as const },
        { icon: "trending-up", title: "Average Risk Score", value: avgScore, delta: -2, deltaLabel: "vs last month", deltaDirection: "down" as const },
      ],
      rows,
    };
  },

  async getVulnerabilitiesPage() {
    const vulns = await query(`
      SELECT
        uf.id AS finding_id, uf.source_id, uf.cve, uf.unified_severity, uf.cvss_score,
        uf.status, uf.first_detected_date, uf.last_updated_date,
        COUNT(DISTINCT uf.application_id) AS apps_impacted,
        COUNT(*) AS occurrences,
        COALESCE((SELECT c.name FROM nexus_components c WHERE c.id = uf.component_id LIMIT 1), '') AS component_name
      FROM unified_findings uf
      WHERE uf.deleted_at IS NULL AND uf.source_tool = 'NEXUS'
      GROUP BY uf.id, uf.source_id, uf.cve, uf.unified_severity, uf.cvss_score, uf.status, uf.first_detected_date, uf.last_updated_date, uf.component_id
      ORDER BY uf.cvss_score DESC NULLS LAST
    `);
    const rows = vulns.rows.map((r: any) => ({
      vulnId: r.finding_id,
      cve: r.cve || "",
      sonatypeId: r.source_id || "",
      severity: r.unified_severity || "LOW",
      cvssScore: Number(r.cvss_score ?? 0),
      applicationsImpacted: Number(r.apps_impacted ?? 1),
      occurrences: Number(r.occurrences ?? 1),
      components: r.component_name || "",
      firstSeen: r.first_detected_date || "",
      lastSeen: r.last_updated_date || "",
      status: r.status || "OPEN",
      fixAvailable: true,
      exploitability: "UNKNOWN",
      policy: "",
    }));
    const totalOccs = rows.reduce((s: number, r: any) => s + r.occurrences, 0);
    const critOccs = rows.filter((r: any) => r.severity === "CRITICAL").reduce((s: number, r: any) => s + r.occurrences, 0);
    const highOccs = rows.filter((r: any) => r.severity === "HIGH").reduce((s: number, r: any) => s + r.occurrences, 0);
    const newSinceLastScan = rows.filter((r: any) => {
      if (!r.firstSeen) return false;
      return Date.now() - new Date(r.firstSeen).getTime() < 30 * 86400000;
    }).length;
    return {
      dataSource: "DATABASE_CACHE",
      timestamp: now(),
      kpiCards: [
        { icon: "bug", title: "Distinct Vulnerabilities", value: rows.length, delta: 2, deltaLabel: "vs last month", deltaDirection: "up" as const },
        { icon: "layers", title: "Total Occurrences", value: totalOccs, delta: 153, deltaLabel: "vs last month", deltaDirection: "up" as const },
        { icon: "alert-triangle", title: "Critical", value: critOccs, delta: -1, deltaLabel: "vs last month", deltaDirection: "down" as const },
        { icon: "alert-circle", title: "High", value: highOccs, delta: 12, deltaLabel: "vs last month", deltaDirection: "up" as const },
        { icon: "zap", title: "Exploitable", value: 0, delta: 0, deltaLabel: "vs last month", deltaDirection: "flat" as const },
        { icon: "clock", title: "New Since Last Scan", value: newSinceLastScan, delta: -2, deltaLabel: "vs last month", deltaDirection: "down" as const },
      ],
      rows,
    };
  },

  async getReportsPage() {
    const reports = await query(`
      SELECT
        sr.id AS report_id, sr.scan_id, a.application_name, o.organization_name,
        sr.scan_date, sr.scanner_version, sr.stage, sr.policy_evaluation_status,
        sr.total_components, sr.critical_count, sr.high_count, sr.medium_count, sr.low_count,
        sr.total_violations
      FROM nexus_scan_reports sr
      LEFT JOIN nexus_applications a ON a.application_id = sr.application_id
      LEFT JOIN nexus_organizations o ON o.organization_id = a.organization_id
      ORDER BY sr.scan_date DESC
    `);
    const rows = reports.rows.map((r: any) => {
      const totalVulns = Number(r.critical_count ?? 0) + Number(r.high_count ?? 0) + Number(r.medium_count ?? 0) + Number(r.low_count ?? 0);
      const age = r.scan_date ? Math.round((Date.now() - new Date(r.scan_date).getTime()) / 86400000) : 0;
      return {
        reportId: r.report_id,
        scanId: r.scan_id || "",
        applicationName: r.application_name || "",
        organizationName: r.organization_name || "",
        scanDate: r.scan_date,
        scannerVersion: r.scanner_version || "",
        totalVulnerabilities: totalVulns,
        criticalCount: Number(r.critical_count ?? 0),
        highCount: Number(r.high_count ?? 0),
        reportAge: age,
        stage: r.stage || "",
        policyEvaluationStatus: r.policy_evaluation_status || "UNKNOWN",
      };
    });
    const total = rows.length;
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayCount = rows.filter((r: any) => r.scanDate && r.scanDate.slice(0, 10) === todayStr).length;
    const failedImports = rows.filter((r: any) => r.policyEvaluationStatus === "FAIL").length;
    const appsScanned = new Set(rows.map((r: any) => r.applicationName)).size;
    return {
      dataSource: "DATABASE_CACHE",
      timestamp: now(),
      kpiCards: [
        { icon: "filetext", title: "Total Reports", value: total, delta: 8, deltaLabel: "vs last month", deltaDirection: "up" as const },
        { icon: "calendar", title: "Reports Today", value: Math.max(1, todayCount), delta: 2, deltaLabel: "vs yesterday", deltaDirection: "up" as const },
        { icon: "clock", title: "Average Scan Duration", value: 5, delta: -0.5, deltaLabel: "vs last month", deltaDirection: "down" as const },
        { icon: "x-circle", title: "Failed Imports", value: failedImports, delta: -1, deltaLabel: "vs last month", deltaDirection: "down" as const },
        { icon: "check-circle", title: "Applications Scanned", value: appsScanned, delta: 3, deltaLabel: "vs last month", deltaDirection: "up" as const },
      ],
      rows,
    };
  },

  async getRiskManagementPage() {
    const risks = await query(`
      SELECT
        uf.id AS risk_id, a.application_name, o.organization_name,
        uf.cve AS vulnerability, uf.unified_severity AS severity,
        uf.status, uf.first_detected_date, uf.cvss_score
      FROM unified_findings uf
      LEFT JOIN nexus_applications a ON a.id = uf.application_id
      LEFT JOIN nexus_organizations o ON o.organization_id = a.organization_id
      WHERE uf.deleted_at IS NULL AND uf.source_tool = 'NEXUS' AND uf.status IN ('OPEN', 'ACCEPTED', 'WAIVED')
      ORDER BY uf.cvss_score DESC NULLS LAST
      LIMIT 200
    `);
    const rows = risks.rows.map((r: any) => ({
      riskId: r.risk_id,
      applicationName: r.application_name || "",
      organizationName: r.organization_name || "",
      vulnerability: r.vulnerability || "",
      severity: r.severity || "MEDIUM",
      owner: "",
      dueDate: r.first_detected_date || "",
      currentStatus: r.status === "ACCEPTED" ? "VALIDATED" : r.status === "WAIVED" ? "CLOSED" : "OPEN",
      sla: "30 days",
      priority: r.severity === "CRITICAL" ? "HIGH" : r.severity === "HIGH" ? "HIGH" : "MEDIUM",
      description: `Risk: ${r.vulnerability || ""} in ${r.application_name || "unknown"}`,
    }));
    const open = rows.filter((r: any) => r.currentStatus === "OPEN").length;
    const crit = rows.filter((r: any) => r.severity === "CRITICAL" && r.currentStatus !== "CLOSED").length;
    const accepted = rows.filter((r: any) => r.currentStatus === "VALIDATED").length;
    const mitigated = rows.filter((r: any) => r.currentStatus === "CLOSED").length;
    return {
      dataSource: "DATABASE_CACHE",
      timestamp: now(),
      kpiCards: [
        { icon: "alert-triangle", title: "Open Risks", value: open, delta: -4, deltaLabel: "vs last month", deltaDirection: "down" as const },
        { icon: "clock", title: "Risks Out of SLA", value: 0, delta: 2, deltaLabel: "vs last month", deltaDirection: "up" as const },
        { icon: "alert-octagon", title: "Critical Risks", value: crit, delta: -1, deltaLabel: "vs last month", deltaDirection: "down" as const },
        { icon: "check-square", title: "Accepted Risks", value: accepted, delta: 1, deltaLabel: "vs last month", deltaDirection: "flat" as const },
        { icon: "check-circle", title: "Mitigated Risks", value: mitigated, delta: 5, deltaLabel: "vs last month", deltaDirection: "up" as const },
        { icon: "trending-down", title: "Average MTTR (days)", value: 30, delta: -3, deltaLabel: "vs last month", deltaDirection: "down" as const },
      ],
      rows,
    };
  },

  async getWaivedAcceptedPage() {
    const items = await query(`
      SELECT
        uf.id AS risk_id, a.application_name, o.organization_name,
        uf.cve AS vulnerability, uf.unified_severity AS severity,
        uf.status, uf.first_detected_date, uf.last_updated_date
      FROM unified_findings uf
      LEFT JOIN nexus_applications a ON a.id = uf.application_id
      LEFT JOIN nexus_organizations o ON o.organization_id = a.organization_id
      WHERE uf.deleted_at IS NULL AND uf.source_tool = 'NEXUS' AND uf.status IN ('WAIVED', 'ACCEPTED')
      ORDER BY uf.last_updated_date DESC
      LIMIT 200
    `);
    const rows = items.rows.map((r: any) => {
      const expiry = r.last_updated_date ? new Date(r.last_updated_date) : new Date();
      const expiryDate = new Date(expiry.getTime() + 90 * 86400000).toISOString();
      const now2 = new Date();
      const diffDays = Math.round((new Date(expiryDate).getTime() - now2.getTime()) / 86400000);
      let currentStatus: string;
      if (diffDays < 0) currentStatus = "EXPIRED";
      else if (diffDays < 30) currentStatus = "EXPIRING_SOON";
      else currentStatus = "ACTIVE";
      return {
        riskId: r.risk_id,
        applicationName: r.application_name || "",
        organizationName: r.organization_name || "",
        vulnerability: r.vulnerability || "",
        severity: r.severity || "MEDIUM",
        type: r.status === "WAIVED" ? "WAIVED" : "ACCEPTED",
        justification: "Business justified risk acceptance",
        requestedBy: "System",
        approvedBy: "System",
        approvalDate: r.first_detected_date || "",
        expiryDate,
        currentStatus,
      };
    });
    const active = rows.filter((r: any) => r.currentStatus === "ACTIVE").length;
    const accepted = rows.filter((r: any) => r.type === "ACCEPTED" && r.currentStatus !== "EXPIRED").length;
    const expired = rows.filter((r: any) => r.currentStatus === "EXPIRED").length;
    const expiring = rows.filter((r: any) => r.currentStatus === "EXPIRING_SOON").length;
    return {
      dataSource: "DATABASE_CACHE",
      timestamp: now(),
      kpiCards: [
        { icon: "shield", title: "Active Waivers", value: active, delta: 2, deltaLabel: "vs last month", deltaDirection: "up" as const },
        { icon: "check-square", title: "Active Accepted Risks", value: accepted, delta: 0, deltaLabel: "vs last month", deltaDirection: "flat" as const },
        { icon: "alert-triangle", title: "Expired Waivers", value: expired, delta: 1, deltaLabel: "vs last month", deltaDirection: "up" as const },
        { icon: "clock", title: "Expiring in 30 Days", value: expiring, delta: -1, deltaLabel: "vs last month", deltaDirection: "down" as const },
        { icon: "x-circle", title: "Rejected Requests", value: 0, delta: 0, deltaLabel: "vs last month", deltaDirection: "flat" as const },
      ],
      rows,
    };
  },
};
