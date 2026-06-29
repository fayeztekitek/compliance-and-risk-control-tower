import { nexusRepo } from "../repositories/nexus.repo.js";
import { unifiedFindingRepo } from "../repositories/unifiedFinding.repo.js";
import { query } from "../config/database.js";
import { riskScoreService } from "./riskScore.service.js";

interface ExecutiveSnapshot {
  snapshotDate: string;
  totalOrganizations: number;
  totalApplications: number;
  activeApplications: number;
  inactiveApplications: number;
  neverScanned: number;
  scanCoverageRate: number;
  averageScanAgeDays: number;
  openCritical: number;
  openHigh: number;
  openMedium: number;
  openLow: number;
  totalOpenVulnerabilities: number;
  distinctVulnerabilities: number;
  occurrences: number;
  mitigatedVulnerabilities: number;
  acceptedRisks: number;
  waivedCount: number;
  falsePositives: number;
  newVulnerabilities30d: number;
  fixedVulnerabilities30d: number;
  recurringVulnerabilities: number;
  mttrDays: number;
  avgTimeToCloseDays: number;
  closedThisMonth: number;
  applicationsOutOfSla: number;
  acceptedRisksExpiringSoon: number;
  expiredAcceptedRisks: number;
  applicationsWithoutRecentScan: number;
  criticalAppsWithoutScan: number;
  complianceRate: number;
  slaComplianceRate: number;
  appsWithCriticalVulns: number;
  appsWithHighVulns: number;
  averageRiskScore: number;
  productsRedCount: number;
  productsOrangeCount: number;
  productsGreenCount: number;
  previousTotal: number;
  previousCritical: number;
  previousHigh: number;
  previousRiskScore: number;
  trendDirection: string;
}

export const kpiService = {
  async recalculate(): Promise<{ snapshotDate: string; errors: string[] }> {
    const errors: string[] = [];

    // ── Inventory KPIs ──────────────────────────────────────────────
    const orgs = await nexusRepo.listOrganizations();
    const totalOrganizations = orgs.length;

    const apps = await nexusRepo.listApplications();
    const totalApplications = apps.length;

    // Scan age for each app from nexus_scan_reports
    const appScanStats = await query(`
      SELECT a.application_id, a.business_criticality,
        COUNT(sr.id) as scan_count,
        MAX(sr.scan_date) as last_scan_date,
        CASE
          WHEN COUNT(sr.id) = 0 THEN 'never_scanned'
          WHEN MAX(sr.scan_date) < CURRENT_DATE - INTERVAL '3 months' THEN 'inactive'
          ELSE 'active'
        END as scan_status
      FROM nexus_applications a
      LEFT JOIN nexus_scan_reports sr ON sr.application_id = a.application_id
      GROUP BY a.application_id, a.business_criticality
    `);

    const rows = appScanStats.rows;
    const activeApps = rows.filter((r: any) => r.scan_status === 'active').length;
    const inactiveApps = rows.filter((r: any) => r.scan_status === 'inactive').length;
    const neverScanned = rows.filter((r: any) => r.scan_status === 'never_scanned').length;
    const scanCoverageRate = totalApplications > 0
      ? Math.round(((activeApps + inactiveApps) / totalApplications) * 10000) / 100
      : 0;

    // Average scan age (days since last scan per app)
    const avgScanAge = await query(`
      SELECT COALESCE(AVG(CURRENT_DATE - latest.last_scan), 0) as avg_age
      FROM (
        SELECT a.application_id, MAX(sr.scan_date) as last_scan
        FROM nexus_applications a
        JOIN nexus_scan_reports sr ON sr.application_id = a.application_id
        GROUP BY a.application_id
      ) latest
    `);
    const averageScanAgeDays = Number(avgScanAge.rows[0]?.avg_age || 0);

    // ── Security Posture KPIs ───────────────────────────────────────
    // Uses unified_findings (canonical status source) not nexus_vulnerabilities
    // because manual waivers update unified_findings.status but not nexus_vulnerabilities.status
    const vulnStats = await query(`
      SELECT
        uf.unified_severity as severity,
        uf.status,
        COUNT(DISTINCT uf.source_id) as distinct_count,
        COUNT(*) as occurrence_count,
        COUNT(DISTINCT uf.application_id) as affected_apps
      FROM unified_findings uf
      WHERE uf.status IN ('OPEN', 'WAIVED', 'ACCEPTED', 'FALSE_POSITIVE')
        AND uf.source_tool = 'NEXUS'
        AND uf.deleted_at IS NULL
      GROUP BY uf.unified_severity, uf.status
    `);

    let openCritical = 0, openHigh = 0, openMedium = 0, openLow = 0;
    let totalOpenVulns = 0, distinctVulns = 0, occurrences = 0;
    let falsePositives = 0, waivedCount = 0, acceptedCount = 0;
    const appsWithCritical = new Set<string>();
    const appsWithHigh = new Set<string>();

    for (const r of vulnStats.rows) {
      const sev = r.severity;
      const cnt = parseInt(r.distinct_count, 10);
      const occ = parseInt(r.occurrence_count, 10);
      const status = r.status;

      if (status === 'OPEN') {
        if (sev === 'CRITICAL') { openCritical += cnt; }
        else if (sev === 'HIGH') { openHigh += cnt; }
        else if (sev === 'MEDIUM') { openMedium += cnt; }
        else if (sev === 'LOW') { openLow += cnt; }
      }
      if (status !== 'FALSE_POSITIVE') {
        distinctVulns += cnt;
        occurrences += occ;
      }
      if (status === 'FALSE_POSITIVE') {
        falsePositives += cnt;
      }
      if (status === 'OPEN') {
        totalOpenVulns += cnt;
      }
      if (status === 'OPEN' || status === 'ACCEPTED' || status === 'WAIVED') {
        if (sev === 'CRITICAL') appsWithCritical.add(r.application_id);
        if (sev === 'HIGH') appsWithHigh.add(r.application_id);
      }
      if (status === 'WAIVED') waivedCount += cnt;
      if (status === 'ACCEPTED') acceptedCount += cnt;
    }

    // Average risk score from products
    const products = await nexusRepo.listProducts();
    const productsRed = products.filter((p: any) => p.status === 'RED').length;
    const productsOrange = products.filter((p: any) => p.status === 'ORANGE').length;
    const productsGreen = products.filter((p: any) => p.status === 'GREEN').length;

    let totalRiskScore = 0;
    for (const p of products) {
      const vulns = await unifiedFindingRepo.listFindings({ page: 1, limit: 10000, productId: p.id });
      const agg = riskScoreService.getAggregates(vulns.data, p.businessCriticality);
      totalRiskScore += agg.riskScore;
    }
    const averageRiskScore = products.length > 0
      ? Math.round((totalRiskScore / products.length) * 100) / 100
      : 0;

    // ── Remediation KPIs ────────────────────────────────────────────
    const remedStats = await query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'OPEN' AND detected_date IS NOT NULL AND detected_date >= CURRENT_DATE - INTERVAL '30 days') as new_30d,
        COUNT(*) FILTER (WHERE status = 'FIXED' AND remediated_date IS NOT NULL AND remediated_date >= CURRENT_DATE - INTERVAL '30 days') as fixed_30d,
        COUNT(*) FILTER (WHERE status = 'FIXED' AND remediated_date IS NOT NULL AND DATE_TRUNC('month', remediated_date) = DATE_TRUNC('month', CURRENT_DATE)) as closed_this_month,
        AVG(remediated_date - detected_date) FILTER (WHERE status = 'FIXED' AND remediated_date IS NOT NULL AND detected_date IS NOT NULL) as avg_mttr,
        AVG(remediated_date - detected_date) FILTER (WHERE status = 'FIXED' AND remediated_date IS NOT NULL AND detected_date IS NOT NULL) as avg_close
      FROM unified_findings uf
      WHERE uf.source_tool = 'NEXUS' AND uf.deleted_at IS NULL
    `);

    const rm = remedStats.rows[0] || {};
    const newVulnerabilities30d = parseInt(rm.new_30d || '0', 10);
    const fixedVulnerabilities30d = parseInt(rm.fixed_30d || '0', 10);
    const closedThisMonth = parseInt(rm.closed_this_month || '0', 10);
    const mttrDays = Number(rm.avg_mttr || 0);
    const avgTimeToCloseDays = Number(rm.avg_close || 0);

    // Recurring = status changed back to OPEN in last 30 days (detected before, still open now)
    const recurringStats = await query(`
      SELECT COUNT(*) as cnt FROM unified_findings
      WHERE source_tool = 'NEXUS' AND deleted_at IS NULL
        AND status = 'OPEN'
        AND detected_date < CURRENT_DATE - INTERVAL '30 days'
        AND updated_at >= CURRENT_DATE - INTERVAL '30 days'
    `);
    const recurringVulnerabilities = parseInt(recurringStats.rows[0]?.cnt || '0', 10);

    // ── Risk acceptances / waivers ──────────────────────────────────
    const waivers = await nexusRepo.listWaivers({});
    const acceptedRisks = waivers.filter((w: any) => w.status === 'active').length;
    const expiredAcceptedRisks = waivers.filter((w: any) => w.status === 'expired').length;
    const acceptedRisksExpiringSoon = waivers.filter((w: any) => {
      if (w.status !== 'active' || !w.expirationDate) return false;
      const days = (new Date(w.expirationDate).getTime() - Date.now()) / 86400000;
      return days > 0 && days <= 30;
    }).length;

    // Mitigated = Fixed + Waived + False Positive
    const mitigatedStats = await query(`
      SELECT COUNT(*) as cnt FROM unified_findings
      WHERE source_tool = 'NEXUS' AND deleted_at IS NULL
        AND status IN ('FIXED', 'WAIVED', 'FALSE_POSITIVE')
    `);
    const mitigatedVulnerabilities = parseInt(mitigatedStats.rows[0]?.cnt || '0', 10);

    // ── Governance & Compliance KPIs ────────────────────────────────
    // SLA breach: findings where sla_due_date < NOW() and not Fixed
    const slaStats = await query(`
      SELECT
        COUNT(*) as total_sla,
        SUM(CASE WHEN sla_due_date < NOW() AND status != 'FIXED' THEN 1 ELSE 0 END) as breached
      FROM unified_findings
      WHERE source_tool = 'NEXUS' AND deleted_at IS NULL
        AND sla_due_date IS NOT NULL
    `);
    const slaTotal = parseInt(slaStats.rows[0]?.total_sla || '0', 10);
    const slaBreached = parseInt(slaStats.rows[0]?.breached || '0', 10);
    const slaComplianceRate = slaTotal > 0
      ? Math.round(((slaTotal - slaBreached) / slaTotal) * 10000) / 100
      : 100;

    // Compliance rate: (1 - breached/total) for ALL findings
    const totalFindings = await query(`
      SELECT COUNT(*) as cnt FROM unified_findings WHERE source_tool = 'NEXUS' AND deleted_at IS NULL
    `);
    const totalF = parseInt(totalFindings.rows[0]?.cnt || '1', 10);
    const nonCompliant = await query(`
      SELECT COUNT(*) as cnt FROM unified_findings
      WHERE source_tool = 'NEXUS' AND deleted_at IS NULL
        AND (sla_due_date IS NOT NULL AND sla_due_date < NOW() AND status != 'FIXED')
    `);
    const nC = parseInt(nonCompliant.rows[0]?.cnt || '0', 10);
    const complianceRate = Math.round(((totalF - nC) / totalF) * 10000) / 100;

    // Applications out of SLA
    const appsOutOfSla = await query(`
      SELECT COUNT(DISTINCT application_id) as cnt FROM unified_findings
      WHERE source_tool = 'NEXUS' AND deleted_at IS NULL
        AND sla_due_date IS NOT NULL AND sla_due_date < NOW() AND status != 'FIXED'
    `);
    const applicationsOutOfSla = parseInt(appsOutOfSla.rows[0]?.cnt || '0', 10);

    // Apps without recent scan (6 months)
    const appsWithoutRecentScan = rows.filter((r: any) =>
      r.scan_status === 'never_scanned' || r.scan_status === 'inactive'
    ).length;

    // Critical apps without scan
    const criticalAppsWithoutScan = rows.filter((r: any) =>
      r.scan_status === 'never_scanned' && r.business_criticality === 'CRITICAL'
    ).length;

    // ── Trend comparison (vs previous snapshot) ─────────────────────
    const prevSnapshot = await query(
      `SELECT total_vulnerabilities as prev_total, critical_vulnerabilities as prev_critical,
              high_vulnerabilities as prev_high, global_security_risk_score as prev_risk
        FROM nexus_kpi_snapshots ORDER BY snapshot_date DESC, created_at DESC LIMIT 1 OFFSET 1`
    );
    const prev = prevSnapshot.rows[0] || {};
    const previousTotal = parseInt(prev.prev_total || '0', 10);
    const previousCritical = parseInt(prev.prev_critical || '0', 10);
    const previousHigh = parseInt(prev.prev_high || '0', 10);
    const previousRiskScore = Number(prev.prev_risk || 0);

    const totalVulns = openCritical + openHigh + openMedium + openLow;
    let trendDirection = 'stable';
    if (totalVulns > previousTotal && previousTotal > 0) trendDirection = 'worsening';
    else if (totalVulns < previousTotal && previousTotal > 0) trendDirection = 'improving';

    // ── Insert snapshot ─────────────────────────────────────────────
    const snapshotDate = new Date().toISOString().split('T')[0];
    await query(
      `INSERT INTO nexus_kpi_snapshots (
        snapshot_date, snapshot_type,
        total_organizations, total_applications, active_applications, inactive_applications,
        never_scanned, scan_coverage_rate, average_scan_age_days,
        open_critical, open_high, open_medium, open_low,
        total_open_vulnerabilities, distinct_vulnerabilities, occurrences,
        total_vulnerabilities, critical_vulnerabilities, high_vulnerabilities,
        mitigated_vulnerabilities, accepted_risks, false_positives, waived_count,
        new_vulnerabilities_30d, fixed_vulnerabilities_30d, recurring_vulnerabilities,
        mttr_days, avg_time_to_close_days, closed_this_month,
        applications_out_of_sla, accepted_risks_expiring_soon, expired_accepted_risks,
        applications_without_recent_scan, critical_apps_without_scan,
        compliance_rate, sla_compliance_rate,
        apps_with_critical_vulns, apps_with_high_vulns,
        average_risk_score, global_security_risk_score,
        products_red_count, products_orange_count, products_green_count,
        security_debt_score, compliance_score,
        previous_total, previous_critical, previous_high, previous_risk_score,
        trend_direction
      ) VALUES (
        $1, 'computed',
        $2, $3, $4, $5,
        $6, $7, $8,
        $9, $10, $11, $12,
        $13, $14, $15,
        $16, $17, $18,
        $19, $20, $21, $22,
        $23, $24, $25,
        $26, $27, $28,
        $29, $30, $31,
        $32, $33,
        $34, $35,
        $36, $37,
        $38, $39,
        $40, $41, $42,
        $43, $44,
        $45, $46, $47, $48,
        $49
      )`,
      [
        snapshotDate,
        totalOrganizations, totalApplications, activeApps, inactiveApps,
        neverScanned, scanCoverageRate, averageScanAgeDays,
        openCritical, openHigh, openMedium, openLow,
        totalOpenVulns, distinctVulns, occurrences,
        totalVulns, openCritical, openHigh,
        mitigatedVulnerabilities, acceptedRisks, falsePositives, waivedCount,
        newVulnerabilities30d, fixedVulnerabilities30d, recurringVulnerabilities,
        mttrDays, avgTimeToCloseDays, closedThisMonth,
        applicationsOutOfSla, acceptedRisksExpiringSoon, expiredAcceptedRisks,
        appsWithoutRecentScan, criticalAppsWithoutScan,
        complianceRate, slaComplianceRate,
        appsWithCritical.size, appsWithHigh.size,
        averageRiskScore, averageRiskScore,
        productsRed, productsOrange, productsGreen,
        Math.round((totalVulns - mitigatedVulnerabilities) * 4), complianceRate,
        previousTotal, previousCritical, previousHigh, previousRiskScore,
        trendDirection,
      ]
    );

    return { snapshotDate, errors };
  },

  async getLatestSnapshot(): Promise<ExecutiveSnapshot | null> {
    const r = await query("SELECT * FROM nexus_kpi_snapshots ORDER BY snapshot_date DESC, created_at DESC LIMIT 1");
    if (!r.rows.length) return null;
    const s = r.rows[0];
    return {
      snapshotDate: s.snapshot_date,
      totalOrganizations: s.total_organizations || 0,
      totalApplications: s.total_applications || 0,
      activeApplications: s.active_applications || 0,
      inactiveApplications: s.inactive_applications || 0,
      neverScanned: s.never_scanned || 0,
      scanCoverageRate: Number(s.scan_coverage_rate || 0),
      averageScanAgeDays: Number(s.average_scan_age_days || 0),
      openCritical: s.open_critical || 0,
      openHigh: s.open_high || 0,
      openMedium: s.open_medium || 0,
      openLow: s.open_low || 0,
      totalOpenVulnerabilities: s.total_open_vulnerabilities || 0,
      distinctVulnerabilities: s.distinct_vulnerabilities || 0,
      occurrences: s.occurrences || 0,
      mitigatedVulnerabilities: s.mitigated_vulnerabilities || 0,
      acceptedRisks: s.accepted_risks || 0,
      waivedCount: s.waived_count || 0,
      falsePositives: s.false_positives || 0,
      newVulnerabilities30d: s.new_vulnerabilities_30d || 0,
      fixedVulnerabilities30d: s.fixed_vulnerabilities_30d || 0,
      recurringVulnerabilities: s.recurring_vulnerabilities || 0,
      mttrDays: Number(s.mttr_days || 0),
      avgTimeToCloseDays: Number(s.avg_time_to_close_days || 0),
      closedThisMonth: s.closed_this_month || 0,
      applicationsOutOfSla: s.applications_out_of_sla || 0,
      acceptedRisksExpiringSoon: s.accepted_risks_expiring_soon || 0,
      expiredAcceptedRisks: s.expired_accepted_risks || 0,
      applicationsWithoutRecentScan: s.applications_without_recent_scan || 0,
      criticalAppsWithoutScan: s.critical_apps_without_scan || 0,
      complianceRate: Number(s.compliance_rate || 100),
      slaComplianceRate: Number(s.sla_compliance_rate || 100),
      appsWithCriticalVulns: s.apps_with_critical_vulns || 0,
      appsWithHighVulns: s.apps_with_high_vulns || 0,
      averageRiskScore: Number(s.average_risk_score || 0),
      productsRedCount: s.products_red_count || 0,
      productsOrangeCount: s.products_orange_count || 0,
      productsGreenCount: s.products_green_count || 0,
      previousTotal: s.previous_total || 0,
      previousCritical: s.previous_critical || 0,
      previousHigh: s.previous_high || 0,
      previousRiskScore: Number(s.previous_risk_score || 0),
      trendDirection: s.trend_direction || 'stable',
    };
  },

  async get16Kpis() {
    const snapshot = await this.getLatestSnapshot();
    if (!snapshot) {
      return await this._computeOnTheFlyFallback();
    }
    return {
      totalVulnerabilities: snapshot.distinctVulnerabilities,
      criticalVulnerabilities: snapshot.openCritical,
      highVulnerabilities: snapshot.openHigh,
      openVulnerabilities: snapshot.totalOpenVulnerabilities,
      slaOverdueVulnerabilities: snapshot.applicationsOutOfSla,
      falsePositives: snapshot.falsePositives,
      fixedVulnerabilities: snapshot.mitigatedVulnerabilities,
      waivedVulnerabilities: snapshot.waivedCount,
      acceptedRisks: snapshot.acceptedRisks,
      totalProjects: 0,
      deviatingProjects: 0,
      budgetOverrunProjects: 0,
      activeWaivers: snapshot.acceptedRisks,
      productsRed: snapshot.productsRedCount,
      productsOrange: snapshot.productsOrangeCount,
      productsGreen: snapshot.productsGreenCount,
      globalRiskScore: snapshot.averageRiskScore,
      complianceScore: snapshot.complianceRate,
      securityDebtScore: Math.round((snapshot.distinctVulnerabilities - snapshot.mitigatedVulnerabilities) * 4),
      distinctFindings: snapshot.distinctVulnerabilities,
      totalOccurrences: snapshot.occurrences,
      occurrenceRatio: snapshot.distinctVulnerabilities > 0
        ? Number((snapshot.occurrences / snapshot.distinctVulnerabilities).toFixed(2)) : 0,
      mttrDays: snapshot.mttrDays,
      mttrBySeverity: {},
      slaTotal: Math.round(snapshot.applicationsOutOfSla + snapshot.slaComplianceRate * 0.01 * snapshot.applicationsOutOfSla),
      slaBreached: snapshot.applicationsOutOfSla,
      slaBreachRate: 100 - snapshot.slaComplianceRate,
      affectedApplications: snapshot.appsWithCriticalVulns + snapshot.appsWithHighVulns,
      affectedComponents: 0,
    };
  },

  async _computeOnTheFlyFallback() {
    const products = await nexusRepo.listProducts();
    const allVulns = await unifiedFindingRepo.listFindings({ page: 1, limit: 10000 });
    const snapshot = await nexusRepo.getLatestKpiSnapshot();

    const openVulns = allVulns.data.filter((v: any) => v.status === "OPEN");
    const slaOverdue = openVulns.filter((v: any) => v.ageInDays > 90);
    const falsePositives = allVulns.data.filter((v: any) => v.status === "FALSE_POSITIVE");
    const fixed = allVulns.data.filter((v: any) => v.status === "FIXED");
    const waived = allVulns.data.filter((v: any) => v.status === "WAIVED");
    const accepted = allVulns.data.filter((v: any) => v.status === "ACCEPTED");

    return {
      totalVulnerabilities: allVulns.total,
      criticalVulnerabilities: allVulns.data.filter((v: any) => v.unifiedSeverity === "CRITICAL").length,
      highVulnerabilities: allVulns.data.filter((v: any) => v.unifiedSeverity === "HIGH").length,
      openVulnerabilities: openVulns.length,
      slaOverdueVulnerabilities: slaOverdue.length,
      falsePositives: falsePositives.length,
      fixedVulnerabilities: fixed.length,
      waivedVulnerabilities: waived.length,
      acceptedRisks: accepted.length,
      totalProjects: 0,
      deviatingProjects: 0,
      budgetOverrunProjects: 0,
      activeWaivers: waived.length,
      productsRed: products.filter((p: any) => p.status === "RED").length,
      productsOrange: products.filter((p: any) => p.status === "ORANGE").length,
      productsGreen: products.filter((p: any) => p.status === "GREEN").length,
      globalRiskScore: snapshot?.globalSecurityRiskScore ?? 0,
      complianceScore: snapshot?.complianceScore ?? 100,
      securityDebtScore: snapshot?.securityDebtScore ?? 0,
      distinctFindings: 0,
      totalOccurrences: 0,
      occurrenceRatio: 0,
      mttrDays: 0,
      mttrBySeverity: {},
      slaTotal: 0, slaBreached: 0, slaBreachRate: 0,
      affectedApplications: 0, affectedComponents: 0,
    };
  },

  async get4Kris() {
    const kpis = await this.get16Kpis();
    return [
      {
        id: "kri-breach-cost",
        name: "Breach Cost Exposure",
        value: Math.round(kpis.criticalVulnerabilities * 50000 + kpis.highVulnerabilities * 15000),
        threshold: 500000, unit: "EUR",
        status: kpis.criticalVulnerabilities >= 10 ? "BREACHED" : kpis.criticalVulnerabilities >= 5 ? "WARNING" : "OK",
      },
      {
        id: "kri-sla-exceeded",
        name: "SLA Exceeded Vulnerabilities",
        value: kpis.slaOverdueVulnerabilities,
        threshold: 10, unit: "count",
        status: kpis.slaOverdueVulnerabilities >= 10 ? "BREACHED" : kpis.slaOverdueVulnerabilities >= 5 ? "WARNING" : "OK",
      },
      {
        id: "kri-budget-overrun",
        name: "Budget Overrun Projects",
        value: kpis.budgetOverrunProjects, threshold: 3, unit: "count",
        status: kpis.budgetOverrunProjects >= 3 ? "BREACHED" : kpis.budgetOverrunProjects >= 1 ? "WARNING" : "OK",
      },
      {
        id: "kri-non-compliant-saas",
        name: "Non-Compliant SaaS",
        value: 0, threshold: 2, unit: "count", status: "OK" as const,
      },
    ];
  },

  async get5x5Heatmap() {
    const products = await nexusRepo.listProducts();
    const cells: { x: number; y: number; count: number; productId?: string }[] = [];
    const severityLevels = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
    const ageRanges = [">180", "91-180", "31-90", "8-30", "0-7"];

    for (const p of products) {
      const vulns = await unifiedFindingRepo.listFindings({ page: 1, limit: 10000, productId: p.id });
      for (let si = 0; si < severityLevels.length; si++) {
        for (let ai = 0; ai < ageRanges.length; ai++) {
          let count = 0;
          for (const v of vulns.data) {
            if (v.unifiedSeverity === severityLevels[si]) {
              const age = v.ageInDays ?? 0;
              if (ai === 0 && age > 180) count++;
              else if (ai === 1 && age > 90 && age <= 180) count++;
              else if (ai === 2 && age > 30 && age <= 90) count++;
              else if (ai === 3 && age > 7 && age <= 30) count++;
              else if (ai === 4 && age <= 7) count++;
            }
          }
          cells.push({ x: si, y: ai, count, productId: p.productId });
        }
      }
    }
    return { severityLevels, ageRanges, cells };
  },

  async getMonthlyTrends(months = 12) {
    const snapshots = await query(
      `SELECT snapshot_date, global_security_risk_score, total_vulnerabilities,
              critical_vulnerabilities, high_vulnerabilities,
              open_critical, open_high, open_medium, open_low,
              total_open_vulnerabilities, distinct_vulnerabilities, occurrences,
              scan_coverage_rate, active_applications
       FROM nexus_kpi_snapshots ORDER BY snapshot_date DESC, created_at DESC LIMIT $1`,
      [months]
    );
    return {
      securityTrends: snapshots.rows.reverse().map((r: any) => ({
        date: r.snapshot_date,
        riskScore: Number(r.global_security_risk_score),
        total: r.total_vulnerabilities,
        critical: r.critical_vulnerabilities,
        high: r.high_vulnerabilities,
        openCritical: r.open_critical,
        openHigh: r.open_high,
        openMedium: r.open_medium,
        openLow: r.open_low,
        totalOpen: r.total_open_vulnerabilities,
        distinctVulns: r.distinct_vulnerabilities,
        occurrences: r.occurrences,
        scanCoverage: Number(r.scan_coverage_rate),
        activeApps: r.active_applications,
      })),
      projectTrends: [],
    };
  },

  async getMTTR() {
    const result = await query(
      `SELECT unified_severity,
              AVG(remediated_date - detected_date) as avg_days
       FROM unified_findings
       WHERE status = 'FIXED' AND remediated_date IS NOT NULL
         AND detected_date IS NOT NULL AND deleted_at IS NULL
       GROUP BY unified_severity`
    );
    const allAvg = await query(
      `SELECT AVG(remediated_date - detected_date) as avg_days
       FROM unified_findings WHERE status = 'FIXED'
         AND remediated_date IS NOT NULL AND detected_date IS NOT NULL
         AND deleted_at IS NULL`
    );
    return {
      overall: Math.round(Number(allAvg.rows[0]?.avg_days || 0) * 10) / 10,
      bySeverity: Object.fromEntries(
        result.rows.map((r: any) => [r.unified_severity, Math.round(Number(r.avg_days) * 10) / 10])
      ),
    };
  },

  async getSLABreachRate() {
    const result = await query(
      `SELECT COUNT(*) as total,
              SUM(CASE WHEN sla_due_date < NOW() AND status != 'FIXED' AND deleted_at IS NULL THEN 1 ELSE 0 END) as breached
       FROM unified_findings WHERE sla_due_date IS NOT NULL AND deleted_at IS NULL`
    );
    const total = parseInt(result.rows[0]?.total || "0", 10);
    const breached = parseInt(result.rows[0]?.breached || "0", 10);
    return {
      total,
      breached,
      breachRate: total > 0 ? Math.round((breached / total) * 10000) / 100 : 0,
    };
  },

  async getDistinctVsOccurrences() {
    const snapshot = await this.getLatestSnapshot();
    if (snapshot) {
      return { distinctFindings: snapshot.distinctVulnerabilities, totalOccurrences: snapshot.occurrences };
    }
    return { distinctFindings: 0, totalOccurrences: 0 };
  },

  async getNewVsFixedTrends(months = 6) {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);
    const result = await query(
      `SELECT DATE_TRUNC('month', COALESCE(detected_date, detected_date)) as month,
              COUNT(*) as total,
              SUM(CASE WHEN remediated_date IS NOT NULL THEN 1 ELSE 0 END) as fixed
       FROM unified_findings
       WHERE (detected_date >= $1 OR remediated_date >= $1) AND deleted_at IS NULL
       GROUP BY DATE_TRUNC('month', COALESCE(detected_date, detected_date))
       ORDER BY month ASC`,
      [cutoff.toISOString().split("T")[0]]
    );
    return result.rows.map((r: any) => ({
      month: r.month.toISOString().split("T")[0],
      newCount: parseInt(r.total, 10) - parseInt(r.fixed, 10),
      fixedCount: parseInt(r.fixed, 10),
    }));
  },
};
