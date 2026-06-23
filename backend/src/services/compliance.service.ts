import { complianceRepo } from "../repositories/compliance.repo.js";
import { unifiedFindingRepo } from "../repositories/unifiedFinding.repo.js";
import { NotFoundError } from "../core/errors.js";

export const complianceService = {
  async getClassifications(filters?: { framework?: string; findingId?: string; status?: string }) {
    return complianceRepo.getClassifications(filters);
  },

  async getFrameworkSummaries() {
    return complianceRepo.getFrameworkSummaries();
  },

  async getRegulatoryMappings() {
    return complianceRepo.getRegulatoryMappings();
  },

  async getSlaBreaches() {
    return complianceRepo.getSlaBreaches();
  },

  async autoClassify(findingId: string) {
    const finding = await unifiedFindingRepo.getFinding(findingId);
    if (!finding) throw new NotFoundError("Unified finding", findingId);
    return complianceRepo.autoClassify(findingId, finding.unifiedSeverity);
  },

  async detectBreaches() {
    return complianceRepo.detectAndUpdateBreaches();
  },

  async updateClassification(id: string, data: { requirement?: string; impactAssessment?: string; status?: string }) {
    const existing = await complianceRepo.getById(id);
    if (!existing) throw new NotFoundError("Compliance classification", id);
    const updated = await complianceRepo.update(id, data);
    if (!updated) throw new NotFoundError("Compliance classification", id);
    return updated;
  },
};
