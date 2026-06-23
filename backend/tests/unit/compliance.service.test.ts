import { describe, it, expect, vi, beforeEach } from "vitest";

const mockComplianceRepo = {
  getClassifications: vi.fn(),
  getById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  getFrameworkSummaries: vi.fn(),
  getRegulatoryMappings: vi.fn(),
  getSlaBreaches: vi.fn(),
  autoClassify: vi.fn(),
  detectAndUpdateBreaches: vi.fn(),
};

vi.mock("../../src/repositories/compliance.repo.js", () => ({
  complianceRepo: mockComplianceRepo,
}));

const mockUnifiedFindingRepo = {
  getFinding: vi.fn(),
};

vi.mock("../../src/repositories/unifiedFinding.repo.js", () => ({
  unifiedFindingRepo: mockUnifiedFindingRepo,
}));

describe("Compliance Service", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("should get framework summaries", async () => {
    const expected = [{ framework: "GDPR", total_findings: 5, breached: 1, remediated: 2, active: 2 }];
    mockComplianceRepo.getFrameworkSummaries.mockResolvedValue(expected);

    const { complianceService } = await import("../../src/services/compliance.service.js");
    const result = await complianceService.getFrameworkSummaries();

    expect(result).toEqual(expected);
  });

  it("should get SLA breaches", async () => {
    const expected = [{ id: "br-1", framework: "GDPR", days_overdue: 5 }];
    mockComplianceRepo.getSlaBreaches.mockResolvedValue(expected);

    const { complianceService } = await import("../../src/services/compliance.service.js");
    const result = await complianceService.getSlaBreaches();

    expect(result).toEqual(expected);
  });

  it("should auto-classify a finding", async () => {
    mockUnifiedFindingRepo.getFinding.mockResolvedValue({ id: "f-1", unifiedSeverity: "CRITICAL" });
    mockComplianceRepo.autoClassify.mockResolvedValue([{ id: "cc-1", framework: "GDPR" }]);

    const { complianceService } = await import("../../src/services/compliance.service.js");
    const result = await complianceService.autoClassify("f-1");

    expect(result).toHaveLength(1);
    expect(mockComplianceRepo.autoClassify).toHaveBeenCalledWith("f-1", "CRITICAL");
  });

  it("should throw NotFoundError when auto-classifying unknown finding", async () => {
    mockUnifiedFindingRepo.getFinding.mockResolvedValue(null);

    const { complianceService } = await import("../../src/services/compliance.service.js");
    await expect(complianceService.autoClassify("unknown")).rejects.toThrow();
  });

  it("should detect breaches", async () => {
    mockComplianceRepo.detectAndUpdateBreaches.mockResolvedValue([{ id: "cc-1", status: "BREACHED" }]);

    const { complianceService } = await import("../../src/services/compliance.service.js");
    const result = await complianceService.detectBreaches();

    expect(result).toHaveLength(1);
  });

  it("should update classification", async () => {
    mockComplianceRepo.getById.mockResolvedValue({ id: "cc-1" });
    mockComplianceRepo.update.mockResolvedValue({ id: "cc-1", status: "REMEDIATED" });

    const { complianceService } = await import("../../src/services/compliance.service.js");
    const result = await complianceService.updateClassification("cc-1", { status: "REMEDIATED" });

    expect(result.status).toBe("REMEDIATED");
  });

  it("should throw NotFoundError when updating unknown classification", async () => {
    mockComplianceRepo.getById.mockResolvedValue(null);

    const { complianceService } = await import("../../src/services/compliance.service.js");
    await expect(complianceService.updateClassification("unknown", { status: "REMEDIATED" })).rejects.toThrow();
  });

  it("should get classifications with filters", async () => {
    mockComplianceRepo.getClassifications.mockResolvedValue([]);

    const { complianceService } = await import("../../src/services/compliance.service.js");
    await complianceService.getClassifications({ framework: "GDPR", status: "ACTIVE" });

    expect(mockComplianceRepo.getClassifications).toHaveBeenCalledWith({ framework: "GDPR", status: "ACTIVE" });
  });

  it("should get regulatory mappings", async () => {
    const expected = [{ framework: "GDPR", severity: "CRITICAL", sla_days: 3 }];
    mockComplianceRepo.getRegulatoryMappings.mockResolvedValue(expected);

    const { complianceService } = await import("../../src/services/compliance.service.js");
    const result = await complianceService.getRegulatoryMappings();

    expect(result).toEqual(expected);
  });
});
