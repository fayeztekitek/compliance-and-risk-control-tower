import { policyRuleRepo } from "../repositories/policyRule.repo.js";
import { NotFoundError } from "../core/errors.js";

export const policyRuleService = {
  async list(filters?: { threatLevel?: string; category?: string }) {
    return policyRuleRepo.list(filters);
  },

  async getById(id: string) {
    const rule = await policyRuleRepo.getById(id);
    if (!rule) throw new NotFoundError("Policy rule", id);
    return rule;
  },

  async create(data: { policyId: string; name: string; threatLevel: string; category?: string; description?: string }) {
    return policyRuleRepo.create(data);
  },

  async update(id: string, data: { name?: string; threatLevel?: string; category?: string; description?: string }) {
    const existing = await policyRuleRepo.getById(id);
    if (!existing) throw new NotFoundError("Policy rule", id);
    const updated = await policyRuleRepo.update(id, data);
    if (!updated) throw new NotFoundError("Policy rule", id);
    return updated;
  },

  async delete(id: string) {
    const deleted = await policyRuleRepo.delete(id);
    if (!deleted) throw new NotFoundError("Policy rule", id);
    return { success: true };
  },
};
