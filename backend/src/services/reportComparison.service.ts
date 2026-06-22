import { unifiedFindingRepo } from "../repositories/unifiedFinding.repo.js";
import { scanReportRepo } from "../repositories/scanReport.repo.js";
import { NotFoundError } from "../core/errors.js";

function findingKey(f: any): string {
  return f.cveId || `${f.componentName || "unknown"}:${f.componentVersion || "unknown"}`;
}

export interface ReportComparison {
  latestReportId: string;
  previousReportId: string;
  latestReportDate: string;
  previousReportDate: string;
  newVulnerabilities: any[];
  fixedVulnerabilities: any[];
  recurringVulnerabilities: any[];
  newCount: number;
  fixedCount: number;
  recurringCount: number;
  riskEvolution: {
    latestTotalRisk: number;
    previousTotalRisk: number;
    delta: number;
  };
  severityShift: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
    NONE: number;
  };
}

export const reportComparisonService = {
  async compareReports(latestReportId: string, previousReportId: string): Promise<ReportComparison> {
    const [latestReport, previousReport] = await Promise.all([
      scanReportRepo.get(latestReportId),
      scanReportRepo.get(previousReportId),
    ]);
    if (!latestReport) throw new NotFoundError("ScanReport", latestReportId);
    if (!previousReport) throw new NotFoundError("ScanReport", previousReportId);

    const [latestFindings, previousFindings] = await Promise.all([
      unifiedFindingRepo.listFindingsByScanId(latestReportId),
      unifiedFindingRepo.listFindingsByScanId(previousReportId),
    ]);

    const previousKeys = new Set(previousFindings.map(findingKey));
    const latestKeys = new Set(latestFindings.map(findingKey));

    const newVulns: any[] = [];
    const recurringVulns: any[] = [];
    for (const f of latestFindings) {
      const key = findingKey(f);
      if (previousKeys.has(key)) {
        recurringVulns.push(f);
      } else {
        newVulns.push(f);
      }
    }

    const fixedVulns: any[] = [];
    for (const f of previousFindings) {
      const key = findingKey(f);
      if (!latestKeys.has(key)) {
        fixedVulns.push(f);
      }
    }

    const latestTotalRisk = latestFindings.reduce((s: number, f: any) => s + (f.riskScore || 0), 0);
    const previousTotalRisk = previousFindings.reduce((s: number, f: any) => s + (f.riskScore || 0), 0);

    const severityShift: any = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, NONE: 0 };
    function countSeverity(sevs: Record<string, number>, arr: any[], sign: number) {
      for (const f of arr) {
        const sev = f.unifiedSeverity || "NONE";
        sevs[sev] = (sevs[sev] || 0) + sign;
      }
    }
    countSeverity(severityShift, newVulns, 1);
    countSeverity(severityShift, fixedVulns, -1);

    return {
      latestReportId,
      previousReportId,
      latestReportDate: latestReport.reportDate,
      previousReportDate: previousReport.reportDate,
      newVulnerabilities: newVulns,
      fixedVulnerabilities: fixedVulns,
      recurringVulnerabilities: recurringVulns,
      newCount: newVulns.length,
      fixedCount: fixedVulns.length,
      recurringCount: recurringVulns.length,
      riskEvolution: {
        latestTotalRisk: Math.round(latestTotalRisk * 100) / 100,
        previousTotalRisk: Math.round(previousTotalRisk * 100) / 100,
        delta: Math.round((latestTotalRisk - previousTotalRisk) * 100) / 100,
      },
      severityShift,
    };
  },

  async getLatestComparison(applicationId: string): Promise<ReportComparison> {
    const latest = await scanReportRepo.getLatestByApp(applicationId);
    if (!latest) throw new NotFoundError("Latest ScanReport", `app ${applicationId}`);
    const previous = await scanReportRepo.getPreviousReport(applicationId, latest.reportDate);
    if (!previous) throw new NotFoundError("Previous ScanReport", `app ${applicationId}`);
    return this.compareReports(latest.id, previous.id);
  },
};
