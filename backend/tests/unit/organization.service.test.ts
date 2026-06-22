import { describe, it, expect, vi, beforeEach } from "vitest";

const mockNexusRepo = {
  listOrganizations: vi.fn(),
  getOrganization: vi.fn(),
  upsertOrganization: vi.fn(),
  updateOrganization: vi.fn(),
  getCompliancePosture: vi.fn(),
  upsertCompliancePosture: vi.fn(),
  listAllCompliancePostures: vi.fn(),
  listProducts: vi.fn(),
};

const mockUnifiedFindingRepo = {
  getStats: vi.fn(),
};

vi.mock("../../src/repositories/nexus.repo.js", () => ({ nexusRepo: mockNexusRepo }));
vi.mock("../../src/repositories/unifiedFinding.repo.js", () => ({ unifiedFindingRepo: mockUnifiedFindingRepo }));

describe("Organization Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should list organizations with compliance posture", async () => {
    mockNexusRepo.listOrganizations.mockResolvedValue([
      { organizationId: "org-1", organizationName: "Org One" },
      { organizationId: "org-2", organizationName: "Org Two" },
    ]);
    mockNexusRepo.getCompliancePosture.mockResolvedValue({ postureGrade: "GREEN", complianceScore: 95 });

    const { organizationService } = await import("../../src/services/organization.service.js");
    const result = await organizationService.listOrganizations();

    expect(result).toHaveLength(2);
    expect(result[0].compliancePosture).toBeDefined();
    expect(result[0].compliancePosture.postureGrade).toBe("GREEN");
  });

  it("should get organization by id with posture", async () => {
    mockNexusRepo.getOrganization.mockResolvedValue({ organizationId: "org-1", organizationName: "Org One" });
    mockNexusRepo.getCompliancePosture.mockResolvedValue({ postureGrade: "RED", complianceScore: 45 });

    const { organizationService } = await import("../../src/services/organization.service.js");
    const result = await organizationService.getOrganization("org-1");

    expect(result.organizationId).toBe("org-1");
    expect(result.compliancePosture.complianceScore).toBe(45);
  });

  it("should throw NotFoundError for unknown org", async () => {
    mockNexusRepo.getOrganization.mockResolvedValue(null);

    const { organizationService } = await import("../../src/services/organization.service.js");
    await expect(organizationService.getOrganization("unknown")).rejects.toThrow();
  });

  it("should upsert organization", async () => {
    mockNexusRepo.upsertOrganization.mockResolvedValue({ organizationId: "org-1", organizationName: "New Org" });

    const { organizationService } = await import("../../src/services/organization.service.js");
    const result = await organizationService.upsertOrganization({ organizationId: "org-1", organizationName: "New Org" });

    expect(result.organizationName).toBe("New Org");
  });

  it("should update organization", async () => {
    mockNexusRepo.getOrganization.mockResolvedValue({ organizationId: "org-1" });
    mockNexusRepo.updateOrganization.mockResolvedValue({ organizationId: "org-1", description: "Updated" });

    const { organizationService } = await import("../../src/services/organization.service.js");
    const result = await organizationService.updateOrganization("org-1", { description: "Updated" });

    expect(result.description).toBe("Updated");
  });

  it("should calculate compliance posture from stats", async () => {
    mockNexusRepo.getOrganization.mockResolvedValue({ organizationId: "org-1" });
    mockUnifiedFindingRepo.getStats.mockResolvedValue([
      { count: "10" },
      { unified_severity: "CRITICAL", count: "2" },
      { unified_severity: "HIGH", count: "3" },
      { status: "OPEN", count: "5" },
      { status: "ACCEPTED", count: "2" },
    ]);
    mockNexusRepo.upsertCompliancePosture.mockResolvedValue({});

    const { organizationService } = await import("../../src/services/organization.service.js");
    await organizationService.recalculateCompliancePosture("org-1");

    expect(mockNexusRepo.upsertCompliancePosture).toHaveBeenCalledWith("org-1", expect.objectContaining({
      totalFindings: 10,
      criticalFindings: 2,
      highFindings: 3,
      openFindings: 5,
      acceptedRisks: 2,
      complianceScore: 70,
    }));
  });
});

describe("Organization Routes", () => {
  it("should register routes in app", async () => {
    const { default: orgRoutes } = await import("../../src/routes/organization.routes.js");
    expect(orgRoutes).toBeDefined();
    expect(typeof orgRoutes).toBe("function");
  });
});
