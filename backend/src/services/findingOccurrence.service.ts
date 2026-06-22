import { findingOccurrenceRepo } from "../repositories/findingOccurrence.repo.js";
import { unifiedFindingRepo } from "../repositories/unifiedFinding.repo.js";
import { NotFoundError, ValidationError } from "../core/errors.js";

export const findingOccurrenceService = {
  async listOccurrences(filters: {
    page: number; limit: number;
    findingId?: string; componentId?: string; status?: string;
  }) {
    return findingOccurrenceRepo.list(filters);
  },

  async getOccurrence(id: string) {
    const occurrence = await findingOccurrenceRepo.get(id);
    if (!occurrence) throw new NotFoundError("FindingOccurrence", id);
    return occurrence;
  },

  async listByFinding(findingId: string, filters: { page: number; limit: number }) {
    const finding = await unifiedFindingRepo.getFinding(findingId);
    if (!finding) throw new NotFoundError("UnifiedFinding", findingId);
    return findingOccurrenceRepo.listByFinding(findingId, filters);
  },

  async listByComponent(componentId: string, filters: { page: number; limit: number }) {
    const { findingComponentRepo } = await import("../repositories/findingComponent.repo.js");
    const component = await findingComponentRepo.get(componentId);
    if (!component) throw new NotFoundError("FindingComponent", componentId);
    return findingOccurrenceRepo.listByComponent(componentId, filters);
  },

  async createOccurrence(data: {
    findingId: string; componentId?: string;
    path?: string; module?: string; scope?: string;
  }) {
    const finding = await unifiedFindingRepo.getFinding(data.findingId);
    if (!finding) throw new NotFoundError("UnifiedFinding", data.findingId);
    if (data.componentId) {
      const { findingComponentRepo } = await import("../repositories/findingComponent.repo.js");
      const component = await findingComponentRepo.get(data.componentId);
      if (!component) throw new NotFoundError("FindingComponent", data.componentId);
    }
    return findingOccurrenceRepo.create(data);
  },

  async updateOccurrence(id: string, data: {
    path?: string; module?: string; scope?: string;
    componentId?: string; occurrenceStatus?: string;
    lastDetectedDate?: string;
  }) {
    const existing = await findingOccurrenceRepo.get(id);
    if (!existing) throw new NotFoundError("FindingOccurrence", id);
    return findingOccurrenceRepo.update(id, data);
  },

  async deleteOccurrence(id: string) {
    const existing = await findingOccurrenceRepo.get(id);
    if (!existing) throw new NotFoundError("FindingOccurrence", id);
    await findingOccurrenceRepo.delete(id);
  },

  async getDistinctCount(applicationId?: string) {
    return findingOccurrenceRepo.getDistinctCount(applicationId);
  },

  async getTotalOccurrences(applicationId?: string) {
    return findingOccurrenceRepo.getTotalOccurrences(applicationId);
  },
};
