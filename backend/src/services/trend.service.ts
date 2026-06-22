import { query } from "../config/database.js";
import { unifiedFindingRepo } from "../repositories/unifiedFinding.repo.js";
import { scanReportRepo } from "../repositories/scanReport.repo.js";

export interface TrendPoint {
  reportDate: string;
  reportId: string;
  totalFindings: number;
  totalOccurrences: number;
  totalPolicyViolations: number;
  riskScore: number;
  severityBreakdown: Record<string, number>;
}

export interface TrendResponse {
  applicationId: string;
  months: number;
  dataPoints: TrendPoint[];
  velocity: {
    newPerWeek: number;
    fixedPerWeek: number;
    netVelocity: number;
  };
  riskProjection: {
    currentRisk: number;
    projectedRisk: number;
    projectedDate: string;
    direction: "improving" | "worsening" | "stable";
  };
}

export interface VelocitySnapshot {
  weekStart: string;
  newCount: number;
  fixedCount: number;
  recurringCount: number;
}

export const trendService = {
  async getTrend(applicationId: string, months: number = 6): Promise<TrendResponse> {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);
    const cutoffStr = cutoff.toISOString().split("T")[0];

    const reports = await scanReportRepo.list({
      page: 1, limit: 100,
      applicationId,
      fromDate: cutoffStr,
    });

    const dataPoints: TrendPoint[] = [];
    for (const report of reports.data) {
      const findings = await unifiedFindingRepo.listFindingsByScanId(report.id);
      const severityBreakdown: Record<string, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, NONE: 0 };
      let riskScore = 0;
      for (const f of findings) {
        const sev = f.unifiedSeverity || "NONE";
        severityBreakdown[sev] = (severityBreakdown[sev] || 0) + 1;
        if (f.riskScore) riskScore += f.riskScore;
      }

      dataPoints.push({
        reportDate: report.reportDate,
        reportId: report.id,
        totalFindings: report.totalFindings || findings.length,
        totalOccurrences: report.totalOccurrences || 0,
        totalPolicyViolations: (report as any).totalPolicyViolations || 0,
        riskScore: Math.round(riskScore * 100) / 100,
        severityBreakdown,
      });
    }

    const velocity = await this.getVulnerabilityVelocity(applicationId, months);
    const riskProjection = this._projectRisk(dataPoints);

    return {
      applicationId,
      months,
      dataPoints,
      velocity: {
        newPerWeek: Math.round(velocity.reduce((s, v) => s + v.newCount, 0) / Math.max(1, velocity.length) * 100) / 100,
        fixedPerWeek: Math.round(velocity.reduce((s, v) => s + v.fixedCount, 0) / Math.max(1, velocity.length) * 100) / 100,
        netVelocity: Math.round((velocity.reduce((s, v) => s + v.newCount, 0) - velocity.reduce((s, v) => s + v.fixedCount, 0)) / Math.max(1, velocity.length) * 100) / 100,
      },
      riskProjection,
    };
  },

  async getOrgTrend(organizationId: string, months: number = 6): Promise<{
    organizationId: string;
    totalFindings: number;
    totalOccurrences: number;
    applicationTrends: TrendResponse[];
  }> {
    const result = await query(
      `SELECT id FROM nexus_products WHERE organization_id = $1`,
      [organizationId]
    );

    const appTrends: TrendResponse[] = [];
    let totalFindings = 0;
    let totalOccurrences = 0;

    for (const row of result.rows) {
      const report = await scanReportRepo.getLatestByApp(row.id);
      if (report) {
        totalFindings += report.totalFindings || 0;
        totalOccurrences += report.totalOccurrences || 0;
      }
      const trend = await this.getTrend(row.id, months);
      appTrends.push(trend);
    }

    return {
      organizationId,
      totalFindings,
      totalOccurrences,
      applicationTrends: appTrends,
    };
  },

  async getVulnerabilityVelocity(applicationId?: string, months: number = 3): Promise<VelocitySnapshot[]> {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);
    const cutoffStr = cutoff.toISOString().split("T")[0];

    const reports = applicationId
      ? (await scanReportRepo.list({ page: 1, limit: 50, applicationId, fromDate: cutoffStr })).data
      : (await scanReportRepo.list({ page: 1, limit: 50, fromDate: cutoffStr })).data;

    if (reports.length < 2) return [];

    const snapshots: VelocitySnapshot[] = [];
    for (let i = 1; i < reports.length; i++) {
      const prev = reports[i];
      const curr = reports[i - 1];

      const [prevFindings, currFindings] = await Promise.all([
        unifiedFindingRepo.listFindingsByScanId(prev.id),
        unifiedFindingRepo.listFindingsByScanId(curr.id),
      ]);

      const prevKeys = new Set(prevFindings.map((f: any) => f.cveId || `${f.componentName}:${f.componentVersion}`));
      const currKeys = new Set(currFindings.map((f: any) => f.cveId || `${f.componentName}:${f.componentVersion}`));

      let newCount = 0;
      let recurringCount = 0;
      for (const key of currKeys) {
        if (prevKeys.has(key)) {
          recurringCount++;
        } else {
          newCount++;
        }
      }

      let fixedCount = 0;
      for (const key of prevKeys) {
        if (!currKeys.has(key)) {
          fixedCount++;
        }
      }

      const weekStart = new Date(curr.reportDate);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      snapshots.push({
        weekStart: weekStart.toISOString().split("T")[0],
        newCount,
        fixedCount,
        recurringCount,
      });
    }

    return snapshots;
  },

  _projectRisk(dataPoints: TrendPoint[]): TrendResponse["riskProjection"] {
    if (dataPoints.length < 2) {
      return {
        currentRisk: dataPoints[0]?.riskScore || 0,
        projectedRisk: dataPoints[0]?.riskScore || 0,
        projectedDate: dataPoints[0]?.reportDate || new Date().toISOString().split("T")[0],
        direction: "stable",
      };
    }

    const sorted = [...dataPoints].sort((a, b) => a.reportDate.localeCompare(b.reportDate));
    const n = sorted.length;
    const indices = Array.from({ length: n }, (_, i) => i);

    const sumX = indices.reduce((s, i) => s + i, 0);
    const sumY = sorted.reduce((s, p) => s + p.riskScore, 0);
    const sumXY = indices.reduce((s, i) => s + i * sorted[i].riskScore, 0);
    const sumX2 = indices.reduce((s, i) => s + i * i, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    const projectedRisk = Math.max(0, sorted[n - 1].riskScore + slope * 2);
    const projectedDate = new Date(sorted[n - 1].reportDate);
    projectedDate.setMonth(projectedDate.getMonth() + 2);

    return {
      currentRisk: sorted[n - 1].riskScore,
      projectedRisk: Math.round(projectedRisk * 100) / 100,
      projectedDate: projectedDate.toISOString().split("T")[0],
      direction: slope < -0.5 ? "improving" : slope > 0.5 ? "worsening" : "stable",
    };
  },
};
