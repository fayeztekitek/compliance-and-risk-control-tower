import { describe, it, expect, vi } from "vitest";
import { securityService } from "../../src/services/security.service";
import { NotFoundError, ValidationError } from "../../src/core/errors";

vi.mock("../../src/repositories/security.repo", () => ({
  securityRepo: {
    listWaivers: vi.fn().mockResolvedValue([]),
    createWaiver: vi.fn().mockImplementation((d: any) => ({ id: "w1", ...d, status: "PENDING" })),
    updateWaiverStatus: vi.fn().mockImplementation((id: string, status: string) => ({ id, status, vulnerability_id: "v1" })),
    listRiskAcceptances: vi.fn().mockResolvedValue([]),
    createRiskAcceptance: vi.fn().mockImplementation((d: any) => ({ id: "ra1", ...d, status: "PENDING" })),
    updateRiskAcceptanceStatus: vi.fn().mockImplementation((id: string, status: string) => ({ id, status, vulnerability_id: "v1" })),
    listSlaIncidents: vi.fn().mockResolvedValue([{ id: "sla1", title: "Breach", status: "OPEN" }]),
    createSlaIncident: vi.fn().mockImplementation((d: any) => ({ id: "sla-new", ...d })),
  },
}));

vi.mock("../../src/repositories/unifiedFinding.repo", () => ({
  unifiedFindingRepo: {
    listFindings: vi.fn().mockResolvedValue({ data: [{ id: "v1", title: "Test Vuln", status: "OPEN", unifiedSeverity: "HIGH" }], total: 1, page: 1, limit: 20 }),
    getFinding: vi.fn().mockImplementation((id: string) =>
      id === "known" ? { id: "known", title: "Known Vuln", status: "OPEN", unifiedSeverity: "HIGH", sourceTool: "VERACODE", slaDueDate: "2026-12-31", targetProduct: "App" } : null
    ),
    createFinding: vi.fn().mockImplementation((d: any) => ({ id: "new", ...d, status: "OPEN" })),
    updateFinding: vi.fn().mockImplementation((id: string, d: any) => ({ id, ...d })),
    bulkUpsertFindings: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("Security Service (unit)", () => {
  it("should list vulnerabilities", async () => {
    const result = await securityService.listVulnerabilities({ page: 1, limit: 20 });
    expect(result.total).toBe(1);
    expect(result.data[0].title).toBe("Test Vuln");
  });

  it("should get vulnerability by id", async () => {
    const result = await securityService.getVulnerability("known");
    expect(result.id).toBe("known");
    expect(result.title).toBe("Known Vuln");
  });

  it("should throw NotFoundError for unknown vuln", async () => {
    await expect(securityService.getVulnerability("unknown")).rejects.toThrow(/not found/i);
  });

  it("should reject SLA due date in the past", async () => {
    const past = new Date();
    past.setDate(past.getDate() - 1);
    await expect(
      securityService.createVulnerability({ title: "Test", severity: "HIGH", sourceScanner: "VERACODE", slaDueDate: past.toISOString().split("T")[0] })
    ).rejects.toThrow(/future/i);
  });

  it("should create a vulnerability", async () => {
    const future = new Date();
    future.setDate(future.getDate() + 30);
    const result = await securityService.createVulnerability({ title: "New Vuln", severity: "CRITICAL", sourceScanner: "VERACODE", slaDueDate: future.toISOString().split("T")[0] });
    expect(result.id).toBe("new");
  });

  it("should enforce status transitions", async () => {
    const { unifiedFindingRepo } = await import("../../src/repositories/unifiedFinding.repo");
    (unifiedFindingRepo.getFinding as any).mockResolvedValueOnce({
      id: "known", title: "Known Vuln", status: "OPEN", unifiedSeverity: "HIGH", slaDueDate: "2026-12-31", targetProduct: "App",
    });
    const result = await securityService.updateVulnerability("known", { status: "FIXED" });
    expect(result.id).toBe("known");

    (unifiedFindingRepo.getFinding as any).mockResolvedValueOnce({
      id: "known", title: "Known Vuln", status: "FIXED", unifiedSeverity: "HIGH", slaDueDate: "2026-12-31", targetProduct: "App",
    });
    await expect(securityService.updateVulnerability("known", { status: "FALSE_POSITIVE" })).rejects.toThrow(/cannot transition/i);
  });

  it("should set false positive with explanation", async () => {
    const result = await securityService.setFalsePositive("known", "This is a false positive because the code is not reachable");
    expect(result.status).toBe("FALSE_POSITIVE");
    expect(result.metadata?.explanation_false_positive).toBe("This is a false positive because the code is not reachable");
  });

  it("should create waiver and link to vuln", async () => {
    const result = await securityService.createWaiver({ vulnerabilityId: "known", title: "Waiver 1", rationale: "Business need", expiryDate: "2026-12-31" });
    expect(result.id).toBe("w1");
    expect(result.status).toBe("PENDING");
  });

  it("should approve waiver and update vuln status to WAIVED", async () => {
    const { securityRepo } = await import("../../src/repositories/security.repo");
    const { unifiedFindingRepo } = await import("../../src/repositories/unifiedFinding.repo");
    (securityRepo.listWaivers as any).mockResolvedValueOnce([{ id: "w1", vulnerability_id: "known" }]);
    (securityRepo.updateWaiverStatus as any).mockResolvedValueOnce({ id: "w1", vulnerability_id: "known", status: "APPROVED" });

    const result = await securityService.approveWaiver("w1");
    expect(result.status).toBe("APPROVED");
    expect(unifiedFindingRepo.updateFinding).toHaveBeenCalledWith("known", { status: "WAIVED" });
  });

  it("should create risk acceptance and link to vuln", async () => {
    const result = await securityService.createRiskAcceptance({
      vulnerabilityId: "known", title: "RA 1", businessImpact: "Low risk, internal tool", mitigationPlan: "Monitor quarterly", expiryDate: "2026-12-31",
    });
    expect(result.id).toBe("ra1");
  });

  it("should approve risk acceptance and update vuln status to FIXED", async () => {
    const { securityRepo } = await import("../../src/repositories/security.repo");
    const { unifiedFindingRepo } = await import("../../src/repositories/unifiedFinding.repo");
    (securityRepo.listRiskAcceptances as any).mockResolvedValueOnce([]);
    (securityRepo.updateRiskAcceptanceStatus as any).mockResolvedValueOnce({ id: "ra1", vulnerability_id: "known", status: "APPROVED" });

    const result = await securityService.approveRiskAcceptance("ra1");
    expect(result.status).toBe("APPROVED");
    expect(unifiedFindingRepo.updateFinding).toHaveBeenCalledWith("known", { status: "FIXED" });
  });

  it("should list SLA incidents", async () => {
    const result = await securityService.listSlaIncidents();
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Breach");
  });

  it("should detect SLA breaches for overdue OPEN vulns", async () => {
    const { securityRepo } = await import("../../src/repositories/security.repo");
    const { unifiedFindingRepo } = await import("../../src/repositories/unifiedFinding.repo");
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    (unifiedFindingRepo.listFindings as any).mockResolvedValueOnce({
      data: [{ id: "v-overdue", title: "Overdue Vuln", status: "OPEN", slaDueDate: yesterday.toISOString().split("T")[0], targetProduct: "App" }],
      total: 1, page: 1, limit: 1000,
    });

    await securityService.detectSlaBreaches();
    expect(securityRepo.createSlaIncident).toHaveBeenCalled();
  });

  it("should import scan results", async () => {
    const raw = [
      { title: "XSS", severity: "HIGH", scanner: "VERACODE", slaDueDate: "2026-09-01", product: "App" },
    ];
    const result = await securityService.importScan(raw);
    expect(result.imported).toBe(1);
  });

  it("should check waiver expiry and auto-expire", async () => {
    const { securityRepo } = await import("../../src/repositories/security.repo");
    const { unifiedFindingRepo } = await import("../../src/repositories/unifiedFinding.repo");
    vi.mocked(securityRepo.listWaivers).mockReset();
    vi.mocked(securityRepo.listWaivers).mockResolvedValue([]);
    const past = new Date(); past.setDate(past.getDate() - 1);
    vi.mocked(securityRepo.listWaivers).mockResolvedValue([
      { id: "w-expired", vulnerability_id: "v1", status: "APPROVED", expiry_date: past.toISOString() },
    ]);
    vi.mocked(securityRepo.updateWaiverStatus).mockReset();
    vi.mocked(securityRepo.updateWaiverStatus).mockResolvedValue({ id: "w-expired", status: "EXPIRED" });

    await securityService.checkWaiverExpiry();
    expect(securityRepo.updateWaiverStatus).toHaveBeenCalledWith("w-expired", "EXPIRED");
    expect(unifiedFindingRepo.updateFinding).toHaveBeenCalledWith("v1", { status: "OPEN" });
  });
});
