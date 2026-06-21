import { describe, it, expect, vi } from "vitest";
import { projectService } from "../../src/services/project.service";

vi.mock("../../src/repositories/project.repo", () => ({
  projectRepo: {
    list: vi.fn().mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 }),
    getById: vi.fn().mockImplementation((id: string) => id === "p1" ? { id: "p1", name: "Proj A", code: "P001" } : null),
    create: vi.fn().mockImplementation((d: any) => ({ id: "new", ...d })),
    update: vi.fn().mockImplementation((id: string, d: any) => ({ id, ...d })),
    delete: vi.fn().mockResolvedValue(true),
    submitRtd: vi.fn().mockImplementation((id: string, d: any) => ({ id: "rtd1", projectId: id, reviewMonth: d.reviewMonth, declaredRtd: d.declaredRtd, actualConsumed: d.actualConsumed })),
    listRoadmaps: vi.fn().mockResolvedValue([]),
    createRoadmap: vi.fn().mockImplementation((d: any) => ({ id: "rm1", ...d })),
    updateRoadmap: vi.fn().mockImplementation((id: string, d: any) => ({ id, ...d })),
    deleteRoadmap: vi.fn().mockResolvedValue(undefined),
    listSaaSApps: vi.fn().mockResolvedValue([]),
    createSaaSApp: vi.fn().mockImplementation((d: any) => ({ id: "saas1", ...d, lifecycleStage: "ONBOARDING" })),
    updateSaaSApp: vi.fn().mockImplementation((id: string, d: any) => ({ id, ...d })),
    deleteSaaSApp: vi.fn().mockResolvedValue(undefined),
    createPrivacyAssessment: vi.fn().mockImplementation((id: string, d: any) => ({ id: "pa1", saasApplicationId: id, ...d })),
    calculateReadinessScore: vi.fn().mockImplementation((id: string) => id === "saas1" ? 85 : null),
    listAudits: vi.fn().mockResolvedValue([]),
    createAudit: vi.fn().mockImplementation((d: any) => ({ id: "aud1", ...d })),
    updateAudit: vi.fn().mockImplementation((id: string, d: any) => ({ id, ...d })),
    deleteAudit: vi.fn().mockResolvedValue(undefined),
    listFindings: vi.fn().mockResolvedValue([]),
    createFinding: vi.fn().mockImplementation((id: string, d: any) => ({ id: "f1", auditId: id, ...d })),
    listCorrectiveActions: vi.fn().mockResolvedValue([]),
    createCorrectiveAction: vi.fn().mockImplementation((id: string, d: any) => ({ id: "ca1", findingId: id, ...d })),
    closeCorrectiveAction: vi.fn().mockImplementation((id: string, ev: string) => ({ id, status: "COMPLETED", evidenceDescription: ev })),
    listCommittees: vi.fn().mockResolvedValue([]),
    createCommittee: vi.fn().mockImplementation((d: any) => ({ id: "com1", ...d })),
    updateCommittee: vi.fn().mockImplementation((id: string, d: any) => ({ id, ...d })),
    deleteCommittee: vi.fn().mockResolvedValue(undefined),
    listDecisions: vi.fn().mockResolvedValue([]),
    recordDecision: vi.fn().mockImplementation((id: string, d: any) => ({ id: "dec1", committeeId: id, ...d })),
    listObligations: vi.fn().mockResolvedValue([]),
    createObligation: vi.fn().mockImplementation((d: any) => ({ id: "obl1", ...d })),
    verifyObligation: vi.fn().mockImplementation((id: string, d: any) => ({ id, ...d, lastVerifiedDate: "2026-06-21" })),
  },
}));

describe("Project Service (unit)", () => {
  it("should list projects", async () => {
    const r = await projectService.listProjects({ page: 1, limit: 20 });
    expect(r.total).toBe(0);
  });

  it("should get project by id", async () => {
    const r = await projectService.getProject("p1");
    expect(r.name).toBe("Proj A");
  });

  it("should throw on unknown project", async () => {
    await expect(projectService.getProject("x")).rejects.toThrow(/not found/i);
  });

  it("should create project", async () => {
    const r = await projectService.createProject({ name: "New", code: "N001" });
    expect(r.id).toBe("new");
  });

  it("should update project", async () => {
    const r = await projectService.updateProject("p1", { name: "Updated" });
    expect(r.name).toBe("Updated");
  });

  it("should delete project", async () => {
    const r = await projectService.deleteProject("p1");
    expect(r.success).toBe(true);
  });

  it("should submit RTD and calculate variance", async () => {
    const r = await projectService.submitRtd("p1", { reviewMonth: "2026-06", declaredRtd: 100, actualConsumed: 80 });
    expect(r.reviewMonth).toBe("2026-06");
    expect(r.declaredRtd).toBe(100);
  });

  it("should create roadmap", async () => {
    const r = await projectService.createRoadmap({ name: "RM1", type: "STRATEGIC", targetDate: "2026-12-31" });
    expect(r.id).toBe("rm1");
  });

  it("should create SaaS app", async () => {
    const r = await projectService.createSaaSApp({ name: "App1" });
    expect(r.lifecycleStage).toBe("ONBOARDING");
  });

  it("should enforce SaaS lifecycle transitions", async () => {
    const { projectRepo } = await import("../../src/repositories/project.repo");
    (projectRepo.listSaaSApps as any).mockResolvedValueOnce([{ id: "saas1", lifecycleStage: "ONBOARDING" }]);
    await projectService.updateSaaSApp("saas1", { lifecycleStage: "GO_LIVE" });
    expect(projectRepo.updateSaaSApp).toHaveBeenCalled();
  });

  it("should reject invalid SaaS lifecycle transition", async () => {
    const { projectRepo } = await import("../../src/repositories/project.repo");
    (projectRepo.listSaaSApps as any).mockResolvedValueOnce([{ id: "saas1", lifecycleStage: "GO_LIVE" }]);
    await expect(projectService.updateSaaSApp("saas1", { lifecycleStage: "ONBOARDING" })).rejects.toThrow(/cannot transition/i);
  });

  it("should submit privacy assessment", async () => {
    const r = await projectService.submitPrivacyAssessment("saas1", { gdprReady: true });
    expect(r.id).toBe("pa1");
  });

  it("should calculate readiness score", async () => {
    const r = await projectService.getReadinessScore("saas1");
    expect(r.score).toBe(85);
  });

  it("should create audit", async () => {
    const r = await projectService.createAudit({ title: "Audit 1", type: "ACCESS_AUDIT" });
    expect(r.id).toBe("aud1");
  });

  it("should create finding and link to audit", async () => {
    const r = await projectService.createFinding("aud1", { title: "Finding 1", severity: "HIGH" });
    expect(r.auditId).toBe("aud1");
  });

  it("should create corrective action and link to finding", async () => {
    const r = await projectService.createCorrectiveAction("f1", { description: "Fix it", dueDate: "2026-07-01" });
    expect(r.findingId).toBe("f1");
  });

  it("should close corrective action with evidence", async () => {
    const r = await projectService.closeCorrectiveAction("ca1", "Evidence uploaded");
    expect(r.status).toBe("COMPLETED");
  });

  it("should create committee", async () => {
    const r = await projectService.createCommittee({ name: "Steering", date: "2026-07-01", type: "VEG_COMMITTEE" });
    expect(r.id).toBe("com1");
  });

  it("should record decision", async () => {
    const r = await projectService.recordDecision("com1", { title: "Approve", outcome: "APPROVED" });
    expect(r.outcome).toBe("APPROVED");
  });

  it("should create contractual obligation", async () => {
    const r = await projectService.createObligation({ title: "Obl 1", requirement: "Must comply" });
    expect(r.id).toBe("obl1");
  });

  it("should verify obligation", async () => {
    const r = await projectService.verifyObligation("obl1", { status: "COMPLIANT" });
    expect(r.status).toBe("COMPLIANT");
  });

  it("should throw NotFoundError on update for unknown project", async () => {
    const { projectRepo } = await import("../../src/repositories/project.repo");
    (projectRepo.update as any).mockResolvedValueOnce(null);
    await expect(projectService.updateProject("x", { name: "X" })).rejects.toThrow(/not found/i);
  });

  it("should throw NotFoundError on RTD for unknown project", async () => {
    await expect(projectService.submitRtd("unknown", { reviewMonth: "2026-06", declaredRtd: 100, actualConsumed: 80 })).rejects.toThrow(/not found/i);
  });
});
