import { findingComponentRepo } from "../repositories/findingComponent.repo.js";
import { NotFoundError } from "../core/errors.js";

export const findingComponentService = {
  async listComponents(filters: { page: number; limit: number; search?: string }) {
    return findingComponentRepo.list(filters);
  },

  async getComponent(id: string) {
    const component = await findingComponentRepo.get(id);
    if (!component) throw new NotFoundError("FindingComponent", id);
    return component;
  },

  async findByCoordinates(groupId: string, artifactId: string, version: string) {
    const component = await findingComponentRepo.findByCoordinates(groupId, artifactId, version);
    if (!component) throw new NotFoundError("FindingComponent", `${groupId}:${artifactId}:${version}`);
    return component;
  },

  async createComponent(data: {
    groupId?: string; artifactId?: string; version: string;
    packageUrl?: string; hash?: string; licenseType?: string; componentName?: string;
  }) {
    return findingComponentRepo.create(data);
  },

  async updateComponent(id: string, data: {
    packageUrl?: string; hash?: string; licenseType?: string; componentName?: string;
  }) {
    const existing = await findingComponentRepo.get(id);
    if (!existing) throw new NotFoundError("FindingComponent", id);
    return findingComponentRepo.update(id, data);
  },

  async deleteComponent(id: string) {
    const existing = await findingComponentRepo.get(id);
    if (!existing) throw new NotFoundError("FindingComponent", id);
    await findingComponentRepo.delete(id);
  },
};
