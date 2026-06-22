import { nexusRepo } from "../repositories/nexus.repo.js";
import { unifiedFindingRepo } from "../repositories/unifiedFinding.repo.js";
import { findingOccurrenceRepo } from "../repositories/findingOccurrence.repo.js";
import { projectRepo } from "../repositories/project.repo.js";
import { query } from "../config/database.js";
import { riskScoreService } from "./riskScore.service.js";

export const kpiService = {
  async recalculate() {
    const products = await nexusRepo.listProducts();
    const allVulns = await unifiedFindingRepo.listFindings({ page: 1, limit: 10000 });
    let totalScore = 0;
    let redCount = 0, orangeCount = 0, greenCount = 0;

    for (const p of products) {
      const productVulns = allVulns.data.filter((v: any) => v.productId === p.productId);
      const aggregates = riskScoreService.getAggregates(productVulns, p.businessCriticality);
      totalScore += aggregates.riskScore;
      if (aggregates.grade === "RED") redCount++;
      else if (aggregates.grade === "ORANGE") orangeCount++;
      else greenCount++;
    }

    const avgScore = products.length ? Math.round(totalScore / products.length) : 0;
    const total = allVulns.total;

    await query(
      `INSERT INTO nexus_kpi_snapshots (snapshot_date, global_security_risk_score, total_vulnerabilities, critical_vulnerabilities, high_vulnerabilities, new_vulnerabilities, fixed_vulnerabilities, accepted_risk_count, expired_waivers_count, products_red_count, products_orange_count, products_green_count, security_debt_score, compliance_score)
       VALUES (CURRENT_DATE, $1, $2, $3, $4, 0, 0, 0, 0, $5, $6, $7, $8, 100.00)`,
      [avgScore, total,
       allVulns.data.filter((v: any) => v.unifiedSeverity === "CRITICAL").length,
       allVulns.data.filter((v: any) => v.unifiedSeverity === "HIGH").length,
       redCount, orangeCount, greenCount,
       allVulns.data.filter((v: any) => v.status !== "FIXED" && v.status !== "FALSE_POSITIVE").length * 4]
    );

    return { avgScore, total, redCount, orangeCount, greenCount };
  },

  async get16Kpis() {
    const [products, allVulns, snapshot, projects, waivers, mttr, sla] = await Promise.all([
      nexusRepo.listProducts(),
      unifiedFindingRepo.listFindings({ page: 1, limit: 10000 }),
      nexusRepo.getLatestKpiSnapshot(),
      projectRepo.list({ page: 1, limit: 1000 }),
      nexusRepo.listWaivers({}),
      this.getMTTR().catch(() => ({ overall: 0, bySeverity: {} })),
      this.getSLABreachRate().catch(() => ({ total: 0, breached: 0, breachRate: 0 })),
    ]);

    const [distinctFindings, totalOccurrences] = await Promise.all([
      findingOccurrenceRepo.getDistinctCount().catch(() => 0),
      findingOccurrenceRepo.getTotalOccurrences().catch(() => 0),
    ]);

    const openVulns = allVulns.data.filter((v: any) => v.status === "OPEN");
    const criticalOpen = openVulns.filter((v: any) => v.unifiedSeverity === "CRITICAL");
    const highOpen = openVulns.filter((v: any) => v.unifiedSeverity === "HIGH");
    const slaOverdue = openVulns.filter((v: any) => v.ageInDays > 90);

    const projectsData = Array.isArray(projects.data) ? projects.data : [];
    const deviatingProjects = projectsData.filter((p: any) => p.status === "DEVIATING" || p.status === "HIGH_RISK");
    const budgetOverruns = projectsData.filter((p: any) => {
      const budget = Number(p.initialBudget) || 0;
      const consumed = Number(p.consumedBudget) || 0;
      return budget > 0 && consumed > budget;
    });

    const activeWaivers = waivers.filter((w: any) => w.status === "active");

    return {
      totalVulnerabilities: allVulns.total,
      criticalVulnerabilities: allVulns.data.filter((v: any) => v.unifiedSeverity === "CRITICAL").length,
      highVulnerabilities: allVulns.data.filter((v: any) => v.unifiedSeverity === "HIGH").length,
      openVulnerabilities: openVulns.length,
      slaOverdueVulnerabilities: slaOverdue.length,
      falsePositives: allVulns.data.filter((v: any) => v.status === "FALSE_POSITIVE").length,
      fixedVulnerabilities: allVulns.data.filter((v: any) => v.status === "FIXED").length,
      waivedVulnerabilities: allVulns.data.filter((v: any) => v.status === "WAIVED").length,
      acceptedRisks: allVulns.data.filter((v: any) => v.status === "ACCEPTED").length,
      totalProjects: projectsData.length,
      deviatingProjects: deviatingProjects.length,
      budgetOverrunProjects: budgetOverruns.length,
      activeWaivers: activeWaivers.length,
      productsRed: products.filter((p: any) => p.status === "RED").length,
      productsOrange: products.filter((p: any) => p.status === "ORANGE").length,
      productsGreen: products.filter((p: any) => p.status === "GREEN").length,
      globalRiskScore: snapshot?.globalSecurityRiskScore ?? 0,
      complianceScore: snapshot?.complianceScore ?? 100,
      securityDebtScore: snapshot?.securityDebtScore ?? 0,
      distinctFindings,
      totalOccurrences,
      occurrenceRatio: distinctFindings > 0 ? Number((totalOccurrences / distinctFindings).toFixed(2)) : 0,
      mttrDays: mttr.overall,
      mttrBySeverity: mttr.bySeverity,
      slaTotal: sla.total,
      slaBreached: sla.breached,
      slaBreachRate: sla.breachRate,
      affectedApplications: allVulns.data.filter((v: any) => v.applicationId).length
        ? new Set(allVulns.data.map((v: any) => v.applicationId)).size
        : 0,
      affectedComponents: allVulns.data.filter((v: any) => v.componentName).length
        ? new Set(allVulns.data.map((v: any) => `${v.componentName}@${v.componentVersion}`)).size
        : 0,
    };
  },

  async get4Kris() {
    const kpis = await this.get16Kpis();

    return [
      {
        id: "kri-breach-cost",
        name: "Breach Cost Exposure",
        value: Math.round(kpis.criticalVulnerabilities * 50000 + kpis.highVulnerabilities * 15000),
        threshold: 500000,
        unit: "EUR",
        status: kpis.criticalVulnerabilities >= 10 ? "BREACHED" : kpis.criticalVulnerabilities >= 5 ? "WARNING" : "OK",
      },
      {
        id: "kri-sla-exceeded",
        name: "SLA Exceeded Vulnerabilities",
        value: kpis.slaOverdueVulnerabilities,
        threshold: 10,
        unit: "count",
        status: kpis.slaOverdueVulnerabilities >= 10 ? "BREACHED" : kpis.slaOverdueVulnerabilities >= 5 ? "WARNING" : "OK",
      },
      {
        id: "kri-budget-overrun",
        name: "Budget Overrun Projects",
        value: kpis.budgetOverrunProjects,
        threshold: 3,
        unit: "count",
        status: kpis.budgetOverrunProjects >= 3 ? "BREACHED" : kpis.budgetOverrunProjects >= 1 ? "WARNING" : "OK",
      },
      {
        id: "kri-non-compliant-saas",
        name: "Non-Compliant SaaS",
        value: 0,
        threshold: 2,
        unit: "count",
        status: "OK" as const,
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
      `SELECT snapshot_date, global_security_risk_score, total_vulnerabilities, critical_vulnerabilities, high_vulnerabilities
       FROM nexus_kpi_snapshots ORDER BY snapshot_date DESC LIMIT $1`,
      [months]
    );

    const projectTrends = await query(
      `SELECT review_month as date, COUNT(*) as total, SUM(CASE WHEN variance > 0 THEN 1 ELSE 0 END) as deviating
       FROM rtd_reviews GROUP BY review_month ORDER BY review_month DESC LIMIT $1`,
      [months]
    );

    return {
      securityTrends: snapshots.rows.reverse().map((r: any) => ({
        date: r.snapshot_date,
        riskScore: Number(r.global_security_risk_score),
        total: r.total_vulnerabilities,
        critical: r.critical_vulnerabilities,
        high: r.high_vulnerabilities,
      })),
      projectTrends: projectTrends.rows.reverse().map((r: any) => ({
        date: r.date,
        total: parseInt(r.total, 10),
        deviating: parseInt(r.deviating, 10),
      })),
    };
  },

  async getMTTR() {
    const result = await query(
      `SELECT
        unified_severity,
        AVG(remediated_date - detected_date) as avg_days
       FROM unified_findings
       WHERE status = 'FIXED'
         AND remediated_date IS NOT NULL
         AND detected_date IS NOT NULL
         AND deleted_at IS NULL
       GROUP BY unified_severity
       ORDER BY unified_severity`
    );
    const allAvg = await query(
      `SELECT AVG(remediated_date - detected_date) as avg_days
       FROM unified_findings
       WHERE status = 'FIXED'
         AND remediated_date IS NOT NULL
         AND detected_date IS NOT NULL
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
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN sla_due_date < NOW() AND status != 'FIXED' AND deleted_at IS NULL THEN 1 ELSE 0 END) as breached
       FROM unified_findings
       WHERE sla_due_date IS NOT NULL AND deleted_at IS NULL`
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
    const distinct = await findingOccurrenceRepo.getDistinctCount();
    const totalOcc = await findingOccurrenceRepo.getTotalOccurrences();
    return { distinctFindings: distinct, totalOccurrences: totalOcc };
  },

  async getNewVsFixedTrends(months = 6) {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);
    const cutoffStr = cutoff.toISOString().split("T")[0];

    const result = await query(
      `SELECT
        DATE_TRUNC('month', COALESCE(detected_date, detected_date)) as month,
        COUNT(*) as total,
        SUM(CASE WHEN remediated_date IS NOT NULL THEN 1 ELSE 0 END) as fixed
       FROM unified_findings
       WHERE (detected_date >= $1 OR remediated_date >= $1)
         AND deleted_at IS NULL
       GROUP BY DATE_TRUNC('month', COALESCE(detected_date, detected_date))
       ORDER BY month ASC`,
      [cutoffStr]
    );

    return result.rows.map((r: any) => ({
      month: r.month.toISOString().split("T")[0],
      newCount: parseInt(r.total, 10) - parseInt(r.fixed, 10),
      fixedCount: parseInt(r.fixed, 10),
    }));
  },
};
