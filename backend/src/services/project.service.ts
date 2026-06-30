import { projectRepo } from "../repositories/project.repo.js";
import { NotFoundError, ValidationError } from "../core/errors.js";

export const projectService = {
  async listProjects(filters: any) { return projectRepo.list(filters); },
  async getProject(id: string) { const p = await projectRepo.getById(id); if (!p) throw new NotFoundError("Project", id); return p; },
  async createProject(data: any) { return projectRepo.create(data); },
  async updateProject(id: string, data: any) { const p = await projectRepo.update(id, data); if (!p) throw new NotFoundError("Project", id); return p; },
  async deleteProject(id: string) { const ok = await projectRepo.delete(id); if (!ok) throw new NotFoundError("Project", id); return { success: true }; },

  async submitRtd(projectId: string, data: any) {
    const p = await projectRepo.getById(projectId);
    if (!p) throw new NotFoundError("Project", projectId);
    return projectRepo.submitRtd(projectId, data);
  },

  // Roadmaps
  async listRoadmaps() { return projectRepo.listRoadmaps(); },
  async createRoadmap(data: any) { return projectRepo.createRoadmap(data); },
  async updateRoadmap(id: string, data: any) { const r = await projectRepo.updateRoadmap(id, data); if (!r) throw new NotFoundError("Roadmap", id); return r; },
  async deleteRoadmap(id: string) { return projectRepo.deleteRoadmap(id); },

  // SaaS
  async listSaaSApps() { return projectRepo.listSaaSApps(); },
  async createSaaSApp(data: any) { return projectRepo.createSaaSApp(data); },
  async updateSaaSApp(id: string, data: any) {
    // Validate lifecycle transitions
    if (data.lifecycleStage) {
      const apps = await projectRepo.listSaaSApps();
      const app = apps.find((a: any) => a.id === id);
      if (!app) throw new NotFoundError("SaaS application", id);
      const valid: Record<string, string[]> = { ONBOARDING: ["GO_LIVE"], GO_LIVE: ["OFFBOARDING"], OFFBOARDING: [] };
      const allowed = valid[app.lifecycleStage] || [];
      if (!allowed.includes(data.lifecycleStage)) {
        throw new ValidationError(`Cannot transition from '${app.lifecycleStage}' to '${data.lifecycleStage}'. Allowed: ${allowed.join(", ") || "none"}`);
      }
    }
    const app = await projectRepo.updateSaaSApp(id, data);
    if (!app) throw new NotFoundError("SaaS application", id);
    return app;
  },
  async deleteSaaSApp(id: string) { return projectRepo.deleteSaaSApp(id); },
  async submitPrivacyAssessment(saasId: string, data: any) { return projectRepo.createPrivacyAssessment(saasId, data); },
  async getReadinessScore(saasId: string) { const s = await projectRepo.calculateReadinessScore(saasId); if (s === null) throw new NotFoundError("SaaS application", saasId); return { score: s }; },

  // Audits
  async listAudits() { return projectRepo.listAudits(); },
  async getAudit(id: string) { const a = await projectRepo.getAudit(id); if (!a) throw new NotFoundError("Audit", id); return a; },
  async createAudit(data: any) { return projectRepo.createAudit(data); },
  async updateAudit(id: string, data: any) { const a = await projectRepo.updateAudit(id, data); if (!a) throw new NotFoundError("Audit", id); return a; },
  async deleteAudit(id: string) { return projectRepo.deleteAudit(id); },
  async listFindings(auditId: string) { return projectRepo.listFindings(auditId); },
  async createFinding(auditId: string, data: any) { return projectRepo.createFinding(auditId, data); },
  async updateFinding(findingId: string, data: any) { const f = await projectRepo.updateFinding(findingId, data); if (!f) throw new NotFoundError("Finding", findingId); return f; },
  async listCorrectiveActions(findingId: string) { return projectRepo.listCorrectiveActions(findingId); },
  async createCorrectiveAction(findingId: string, data: any) { return projectRepo.createCorrectiveAction(findingId, data); },
  async closeCorrectiveAction(id: string, evidence: string) { const ca = await projectRepo.closeCorrectiveAction(id, evidence); if (!ca) throw new NotFoundError("Corrective action", id); return ca; },
  async listCapa(auditId: string) { return projectRepo.listCapa(auditId); },
  async createCapa(auditId: string, data: any) { return projectRepo.createCapa(auditId, data); },

  // Committees
  async listCommittees(filters: { page: number; limit: number }) { return projectRepo.listCommittees(filters); },
  async getCommittee(id: string) { const c = await projectRepo.getCommittee(id); if (!c) throw new NotFoundError("Committee", id); return c; },
  async createCommittee(data: any) { return projectRepo.createCommittee(data); },
  async updateCommittee(id: string, data: any) { const c = await projectRepo.updateCommittee(id, data); if (!c) throw new NotFoundError("Committee", id); return c; },
  async deleteCommittee(id: string) { return projectRepo.deleteCommittee(id); },
  async listDecisions(committeeId: string) { return projectRepo.listDecisions(committeeId); },
  async recordDecision(committeeId: string, data: any) { return projectRepo.recordDecision(committeeId, data); },
  async listCommitteeObligations(committeeId: string) { return projectRepo.listCommitteeObligations(committeeId); },
  async createCommitteeObligation(committeeId: string, data: any) { return projectRepo.createCommitteeObligation(committeeId, data); },
  async updateObligation(obligationId: string, data: any) { const o = await projectRepo.updateObligation(obligationId, data); if (!o) throw new NotFoundError("Obligation", obligationId); return o; },

  // Contractual Obligations
  async listObligations() { return projectRepo.listObligations(); },
  async createObligation(data: any) { return projectRepo.createObligation(data); },
  async verifyObligation(id: string, data: any) { return projectRepo.verifyObligation(id, data); },

  // Milestones
  async listMilestones(projectId: string) { return projectRepo.listMilestones(projectId); },
  async createMilestone(projectId: string, data: any) { await this.getProject(projectId); return projectRepo.createMilestone(projectId, data); },
  async updateMilestone(id: string, data: any) { const m = await projectRepo.updateMilestone(id, data); if (!m) throw new NotFoundError("Milestone", id); return m; },
  async deleteMilestone(id: string) { return projectRepo.deleteMilestone(id); },

  // Risks
  async listRisks(projectId: string) { return projectRepo.listRisks(projectId); },
  async createRisk(projectId: string, data: any) { await this.getProject(projectId); return projectRepo.createRisk(projectId, data); },
  async updateRisk(id: string, data: any) { const r = await projectRepo.updateRisk(id, data); if (!r) throw new NotFoundError("Risk", id); return r; },
  async deleteRisk(id: string) { return projectRepo.deleteRisk(id); },

  // Status Snapshots
  async listStatusSnapshots(projectId: string) { return projectRepo.listStatusSnapshots(projectId); },
  async createStatusSnapshot(projectId: string) { await this.getProject(projectId); return projectRepo.createStatusSnapshot(projectId); },
};
