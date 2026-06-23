import { scanReportRepo } from "../repositories/scanReport.repo.js";
import { NotFoundError } from "../core/errors.js";

export const scanReportService = {
  async listScanReports(filters: {
    page: number; limit: number;
    applicationId?: string; scannerSource?: string;
    fromDate?: string; toDate?: string;
  }) {
    return scanReportRepo.list(filters);
  },

  async getScanReport(id: string) {
    const report = await scanReportRepo.get(id);
    if (!report) throw new NotFoundError("ScanReport", id);
    return report;
  },

  async getLatestByApp(applicationId: string, scannerSource?: string) {
    const report = await scanReportRepo.getLatestByApp(applicationId, scannerSource);
    if (!report) throw new NotFoundError("ScanReport", `latest for app ${applicationId}`);
    return report;
  },

  async getPreviousReport(applicationId: string, currentReportDate: string, scannerSource?: string) {
    const report = await scanReportRepo.getPreviousReport(applicationId, currentReportDate, scannerSource);
    if (!report) throw new NotFoundError("ScanReport", `previous report for app ${applicationId}`);
    return report;
  },

  async createScanReport(data: {
    applicationId: string; scannerSource: string;
    reportDate: string; reportVersion?: string; scanType?: string;
    rawReportId?: string; totalFindings?: number; totalOccurrences?: number;
    metadata?: any;
  }) {
    return scanReportRepo.create(data);
  },

  async updateScanReport(id: string, data: {
    totalFindings?: number; totalOccurrences?: number; metadata?: any;
    reportVersion?: string;
  }) {
    const existing = await scanReportRepo.get(id);
    if (!existing) throw new NotFoundError("ScanReport", id);
    return scanReportRepo.update(id, data);
  },

  async deleteScanReport(id: string) {
    const existing = await scanReportRepo.get(id);
    if (!existing) throw new NotFoundError("ScanReport", id);
    await scanReportRepo.delete(id);
  },

  async getPolicyViolationsByApp(applicationId: string) {
    return scanReportRepo.getPolicyViolationsByApp(applicationId);
  },

  async getAggregatedPolicyViolations() {
    return scanReportRepo.getAggregatedPolicyViolations();
  },
};
