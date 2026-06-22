import { vegDealRepo, VegDealFilters } from "../repositories/veg-deal.repo.js";
import { NotFoundError } from "../core/errors.js";

export const vegDealService = {
  async list(filters: VegDealFilters) {
    return vegDealRepo.list(filters);
  },

  async getById(id: string) {
    const deal = await vegDealRepo.getById(id);
    if (!deal) throw new NotFoundError("VEG deal", id);
    return deal;
  },

  async getByVegId(vegId: string) {
    const deal = await vegDealRepo.getByVegId(vegId);
    if (!deal) throw new NotFoundError("VEG deal", vegId);
    return deal;
  },

  async create(data: any) {
    return vegDealRepo.create(data);
  },

  async update(id: string, data: any) {
    const existing = await vegDealRepo.getById(id);
    if (!existing) throw new NotFoundError("VEG deal", id);
    const result = await vegDealRepo.update(id, data);
    if (!result) throw new NotFoundError("VEG deal", id);
    return result;
  },

  async delete(id: string) {
    const deleted = await vegDealRepo.delete(id);
    if (!deleted) throw new NotFoundError("VEG deal", id);
    return { success: true };
  },

  async getStats() {
    const [aggregates, decisions, businessLines, regions, topClients, topOwners] = await Promise.all([
      vegDealRepo.getAggregates(),
      vegDealRepo.getDecisionsOverview(),
      vegDealRepo.getBusinessLinesOverview(),
      vegDealRepo.getRegionOverview(),
      vegDealRepo.getTopClients(10),
      vegDealRepo.getTopOwners(10),
    ]);
    return { aggregates, decisions, businessLines, regions, topClients, topOwners };
  },

  async getDecisionsOverview() {
    return vegDealRepo.getDecisionsOverview();
  },

  async getBusinessLinesOverview() {
    return vegDealRepo.getBusinessLinesOverview();
  },

  async getRegionOverview() {
    return vegDealRepo.getRegionOverview();
  },
};
