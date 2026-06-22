import { describe, it, expect, vi, beforeEach } from "vitest";

const mockScanReportRepo = {
  get: vi.fn(),
  getLatestByApp: vi.fn(),
  getPreviousReport: vi.fn(),
};

const mockUnifiedFindingRepo = {
  listFindingsByScanId: vi.fn(),
};

vi.mock("../../src/repositories/scanReport.repo.js", () => ({
  scanReportRepo: mockScanReportRepo,
}));

vi.mock("../../src/repositories/unifiedFinding.repo.js", () => ({
  unifiedFindingRepo: mockUnifiedFindingRepo,
}));

describe("ReportComparison Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseFinding = (overrides = {}) => ({
    id: "f-1",
    cveId: "CVE-2024-0001",
    componentName: "log4j",
    componentVersion: "2.14.0",
    unifiedSeverity: "CRITICAL",
    riskScore: 70,
    title: "Critical vuln",
    status: "OPEN",
    ...overrides,
  });

  it("should detect new, fixed, and recurring vulnerabilities", async () => {
    mockScanReportRepo.get.mockResolvedValueOnce({ id: "latest", reportDate: "2026-06-01" });
    mockScanReportRepo.get.mockResolvedValueOnce({ id: "prev", reportDate: "2026-05-01" });

    mockUnifiedFindingRepo.listFindingsByScanId
      .mockResolvedValueOnce([
        baseFinding({ id: "f1", cveId: "CVE-2024-0001" }),
        baseFinding({ id: "f2", cveId: "CVE-2024-0002", unifiedSeverity: "HIGH", riskScore: 50 }),
        baseFinding({ id: "f3", cveId: "CVE-2024-0003", unifiedSeverity: "MEDIUM", riskScore: 30 }),
      ])
      .mockResolvedValueOnce([
        baseFinding({ id: "f1", cveId: "CVE-2024-0001" }),
        baseFinding({ id: "f4", cveId: "CVE-2024-0004", unifiedSeverity: "LOW", riskScore: 10 }),
      ]);

    const { reportComparisonService } = await import("../../src/services/reportComparison.service.js");
    const result = await reportComparisonService.compareReports("latest", "prev");

    expect(result.newCount).toBe(2);
    expect(result.fixedCount).toBe(1);
    expect(result.recurringCount).toBe(1);

    expect(result.newVulnerabilities).toHaveLength(2);
    expect(result.newVulnerabilities.map((v: any) => v.cveId)).toContain("CVE-2024-0002");
    expect(result.newVulnerabilities.map((v: any) => v.cveId)).toContain("CVE-2024-0003");

    expect(result.fixedVulnerabilities).toHaveLength(1);
    expect(result.fixedVulnerabilities[0].cveId).toBe("CVE-2024-0004");

    expect(result.recurringVulnerabilities).toHaveLength(1);
    expect(result.recurringVulnerabilities[0].cveId).toBe("CVE-2024-0001");
  });

  it("should calculate risk evolution", async () => {
    mockScanReportRepo.get.mockResolvedValueOnce({ id: "latest", reportDate: "2026-06-01" });
    mockScanReportRepo.get.mockResolvedValueOnce({ id: "prev", reportDate: "2026-05-01" });

    mockUnifiedFindingRepo.listFindingsByScanId
      .mockResolvedValueOnce([
        baseFinding({ riskScore: 70 }),
        baseFinding({ id: "f2", cveId: "CVE-2024-0002", riskScore: 50 }),
      ])
      .mockResolvedValueOnce([
        baseFinding({ riskScore: 70 }),
      ]);

    const { reportComparisonService } = await import("../../src/services/reportComparison.service.js");
    const result = await reportComparisonService.compareReports("latest", "prev");

    expect(result.riskEvolution.latestTotalRisk).toBe(120);
    expect(result.riskEvolution.previousTotalRisk).toBe(70);
    expect(result.riskEvolution.delta).toBe(50);
  });

  it("should calculate severity shift", async () => {
    mockScanReportRepo.get.mockResolvedValueOnce({ id: "latest", reportDate: "2026-06-01" });
    mockScanReportRepo.get.mockResolvedValueOnce({ id: "prev", reportDate: "2026-05-01" });

    mockUnifiedFindingRepo.listFindingsByScanId
      .mockResolvedValueOnce([
        baseFinding({ cveId: "CVE-NEW-1", unifiedSeverity: "CRITICAL" }),
        baseFinding({ cveId: "CVE-NEW-2", unifiedSeverity: "HIGH" }),
      ])
      .mockResolvedValueOnce([
        baseFinding({ cveId: "CVE-FIXED-1", unifiedSeverity: "MEDIUM" }),
        baseFinding({ cveId: "CVE-FIXED-2", unifiedSeverity: "LOW" }),
      ]);

    const { reportComparisonService } = await import("../../src/services/reportComparison.service.js");
    const result = await reportComparisonService.compareReports("latest", "prev");

    expect(result.severityShift.CRITICAL).toBe(1);
    expect(result.severityShift.HIGH).toBe(1);
    expect(result.severityShift.MEDIUM).toBe(-1);
    expect(result.severityShift.LOW).toBe(-1);
  });

  it("should use component:version key when no CVE", async () => {
    mockScanReportRepo.get.mockResolvedValueOnce({ id: "latest", reportDate: "2026-06-01" });
    mockScanReportRepo.get.mockResolvedValueOnce({ id: "prev", reportDate: "2026-05-01" });

    mockUnifiedFindingRepo.listFindingsByScanId
      .mockResolvedValueOnce([
        baseFinding({ cveId: null, componentName: "jackson", componentVersion: "2.9.0" }),
      ])
      .mockResolvedValueOnce([]);

    const { reportComparisonService } = await import("../../src/services/reportComparison.service.js");
    const result = await reportComparisonService.compareReports("latest", "prev");

    expect(result.newCount).toBe(1);
    expect(result.fixedCount).toBe(0);
  });

  it("should throw NotFoundError for missing reports", async () => {
    mockScanReportRepo.get.mockResolvedValue(null);

    const { reportComparisonService } = await import("../../src/services/reportComparison.service.js");
    await expect(reportComparisonService.compareReports("invalid", "prev")).rejects.toThrow();
  });

  it("should get latest comparison for an application", async () => {
    mockScanReportRepo.getLatestByApp.mockResolvedValue({ id: "latest", reportDate: "2026-06-01" });
    mockScanReportRepo.getPreviousReport.mockResolvedValue({ id: "prev", reportDate: "2026-05-01" });
    mockScanReportRepo.get.mockResolvedValueOnce({ id: "latest", reportDate: "2026-06-01" });
    mockScanReportRepo.get.mockResolvedValueOnce({ id: "prev", reportDate: "2026-05-01" });
    mockUnifiedFindingRepo.listFindingsByScanId.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    const { reportComparisonService } = await import("../../src/services/reportComparison.service.js");
    const result = await reportComparisonService.getLatestComparison("app-1");

    expect(result.latestReportId).toBe("latest");
    expect(result.previousReportId).toBe("prev");
  });

  it("should throw when no previous report exists", async () => {
    mockScanReportRepo.getLatestByApp.mockResolvedValue({ id: "latest", reportDate: "2026-06-01" });
    mockScanReportRepo.getPreviousReport.mockResolvedValue(null);

    const { reportComparisonService } = await import("../../src/services/reportComparison.service.js");
    await expect(reportComparisonService.getLatestComparison("app-1")).rejects.toThrow();
  });

  it("should return correct date fields", async () => {
    mockScanReportRepo.get.mockResolvedValueOnce({ id: "latest", reportDate: "2026-06-15" });
    mockScanReportRepo.get.mockResolvedValueOnce({ id: "prev", reportDate: "2026-05-01" });
    mockUnifiedFindingRepo.listFindingsByScanId.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    const { reportComparisonService } = await import("../../src/services/reportComparison.service.js");
    const result = await reportComparisonService.compareReports("latest", "prev");

    expect(result.latestReportDate).toBe("2026-06-15");
    expect(result.previousReportDate).toBe("2026-05-01");
  });
});
