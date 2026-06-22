import { describe, it, expect, vi, beforeEach } from "vitest";

const mockScanReportRepo = {
  list: vi.fn(),
  get: vi.fn(),
  getLatestByApp: vi.fn(),
  getPreviousReport: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

vi.mock("../../src/repositories/scanReport.repo.js", () => ({
  scanReportRepo: mockScanReportRepo,
}));

describe("ScanReport Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should list scan reports", async () => {
    const expected = { data: [], total: 0, page: 1, limit: 20 };
    mockScanReportRepo.list.mockResolvedValue(expected);

    const { scanReportService } = await import("../../src/services/scanReport.service.js");
    const result = await scanReportService.listScanReports({ page: 1, limit: 20 });

    expect(result).toEqual(expected);
  });

  it("should get scan report by id", async () => {
    const expected = { id: "sr-1", applicationId: "app-1", scannerSource: "NEXUS_IQ" };
    mockScanReportRepo.get.mockResolvedValue(expected);

    const { scanReportService } = await import("../../src/services/scanReport.service.js");
    const result = await scanReportService.getScanReport("sr-1");

    expect(result.applicationId).toBe("app-1");
  });

  it("should throw NotFoundError for unknown scan report", async () => {
    mockScanReportRepo.get.mockResolvedValue(null);

    const { scanReportService } = await import("../../src/services/scanReport.service.js");
    await expect(scanReportService.getScanReport("unknown")).rejects.toThrow();
  });

  it("should get latest by app", async () => {
    const expected = { id: "sr-2", applicationId: "app-1", reportDate: "2026-06-01" };
    mockScanReportRepo.getLatestByApp.mockResolvedValue(expected);

    const { scanReportService } = await import("../../src/services/scanReport.service.js");
    const result = await scanReportService.getLatestByApp("app-1");

    expect(result.reportDate).toBe("2026-06-01");
  });

  it("should get previous report", async () => {
    const expected = { id: "sr-1", applicationId: "app-1", reportDate: "2026-05-01" };
    mockScanReportRepo.getPreviousReport.mockResolvedValue(expected);

    const { scanReportService } = await import("../../src/services/scanReport.service.js");
    const result = await scanReportService.getPreviousReport("app-1", "2026-06-01");

    expect(result.reportDate).toBe("2026-05-01");
  });

  it("should create scan report", async () => {
    const data = { applicationId: "app-1", scannerSource: "NEXUS_IQ", reportDate: "2026-06-01" };
    mockScanReportRepo.create.mockResolvedValue({ id: "sr-3", ...data });

    const { scanReportService } = await import("../../src/services/scanReport.service.js");
    const result = await scanReportService.createScanReport(data);

    expect(result.id).toBe("sr-3");
  });

  it("should update scan report", async () => {
    mockScanReportRepo.get.mockResolvedValue({ id: "sr-1" });
    mockScanReportRepo.update.mockResolvedValue({ id: "sr-1", totalFindings: 42 });

    const { scanReportService } = await import("../../src/services/scanReport.service.js");
    const result = await scanReportService.updateScanReport("sr-1", { totalFindings: 42 });

    expect(result.totalFindings).toBe(42);
  });

  it("should delete scan report", async () => {
    mockScanReportRepo.get.mockResolvedValue({ id: "sr-1" });

    const { scanReportService } = await import("../../src/services/scanReport.service.js");
    await scanReportService.deleteScanReport("sr-1");

    expect(mockScanReportRepo.delete).toHaveBeenCalledWith("sr-1");
  });

  it("should throw when getting latest for unknown app", async () => {
    mockScanReportRepo.getLatestByApp.mockResolvedValue(null);

    const { scanReportService } = await import("../../src/services/scanReport.service.js");
    await expect(scanReportService.getLatestByApp("unknown")).rejects.toThrow();
  });
});
