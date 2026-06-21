import { vegRepo } from "../repositories/veg.repo.js";
import { ValidationError, NotFoundError } from "../core/errors.js";

export const vegService = {
  async list(filters: any) {
    return vegRepo.list(filters);
  },

  async getById(id: string) {
    const veg = await vegRepo.getById(id);
    if (!veg) throw new NotFoundError("VEG request", id);
    const opportunities = await vegRepo.getOpportunities(id);
    const oppsWithContracts = await Promise.all(
      opportunities.map(async (opp) => ({
        ...opp,
        contracts: await vegRepo.getContracts(opp.id),
      }))
    );
    return { ...veg, opportunities: oppsWithContracts };
  },

  async create(data: any) {
    return vegRepo.create(data);
  },

  async update(id: string, data: any) {
    const existing = await vegRepo.getById(id);
    if (!existing) throw new NotFoundError("VEG request", id);

    // Validate status transitions
    if (data.status) {
      const validTransitions: Record<string, string[]> = {
        DRAFT: ["SUBMITTED"],
        SUBMITTED: ["APPROVED", "REJECTED"],
        APPROVED: ["CONTRACT_SIGNATURE"],
        REJECTED: [],
        CONTRACT_SIGNATURE: [],
      };
      const allowed = validTransitions[existing.status] || [];
      if (!allowed.includes(data.status)) {
        throw new ValidationError(
          `Cannot transition from '${existing.status}' to '${data.status}'. Allowed: ${allowed.join(", ") || "none"}`
        );
      }
    }

    return vegRepo.update(id, data);
  },

  async delete(id: string) {
    const deleted = await vegRepo.softDelete(id);
    if (!deleted) throw new NotFoundError("VEG request", id);
    return { success: true };
  },

  async updateDepartmentSignoff(id: string, department: string, state: string) {
    const existing = await vegRepo.getById(id);
    if (!existing) throw new NotFoundError("VEG request", id);
    const veg = await vegRepo.updateDepartmentSignoff(id, department as any, state as any);
    if (!veg) throw new NotFoundError("VEG request", id);

    // Auto-transition to APPROVED if all departments approved
    if (veg.financeState === "APPROVED" && veg.salesState === "APPROVED" &&
        veg.productState === "APPROVED" && veg.legalState === "APPROVED") {
      return vegRepo.update(id, { status: "APPROVED" });
    }
    return veg;
  },

  async updateBidDecision(id: string, decision: string) {
    const existing = await vegRepo.getById(id);
    if (!existing) throw new NotFoundError("VEG request", id);
    const veg = await vegRepo.updateBidDecision(id, decision);
    if (!veg) throw new NotFoundError("VEG request", id);
    return veg;
  },

  async updateGoNoGo(id: string, decision: string) {
    const existing = await vegRepo.getById(id);
    if (!existing) throw new NotFoundError("VEG request", id);
    const veg = await vegRepo.updateGoNoGo(id, decision);
    if (!veg) throw new NotFoundError("VEG request", id);
    return veg;
  },

  async batchSync(requests: any[]) {
    return vegRepo.batchUpsert(requests);
  },

  async createOpportunity(vegRequestId: string, data: any) {
    const existing = await vegRepo.getById(vegRequestId);
    if (!existing) throw new NotFoundError("VEG request", vegRequestId);
    return vegRepo.createOpportunity(vegRequestId, data);
  },

  async createContract(opportunityId: string, data: any) {
    return vegRepo.createContract(opportunityId, data);
  },
};
