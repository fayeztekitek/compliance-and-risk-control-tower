import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPolicyRuleRepo = {
  list: vi.fn(),
  getById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

vi.mock("../../src/repositories/policyRule.repo.js", () => ({
  policyRuleRepo: mockPolicyRuleRepo,
}));

describe("PolicyRule Service", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("should list policy rules", async () => {
    const expected = [{ id: "pr-1", policy_id: "POL-001", name: "Test Rule", threat_level: "HIGH" }];
    mockPolicyRuleRepo.list.mockResolvedValue(expected);

    const { policyRuleService } = await import("../../src/services/policyRule.service.js");
    const result = await policyRuleService.list();

    expect(result).toEqual(expected);
  });

  it("should list policy rules with filters", async () => {
    mockPolicyRuleRepo.list.mockResolvedValue([]);
    const { policyRuleService } = await import("../../src/services/policyRule.service.js");
    await policyRuleService.list({ threatLevel: "CRITICAL", category: "SECURITY" });

    expect(mockPolicyRuleRepo.list).toHaveBeenCalledWith({ threatLevel: "CRITICAL", category: "SECURITY" });
  });

  it("should get policy rule by id", async () => {
    const expected = { id: "pr-1", policy_id: "POL-001", name: "Test Rule" };
    mockPolicyRuleRepo.getById.mockResolvedValue(expected);

    const { policyRuleService } = await import("../../src/services/policyRule.service.js");
    const result = await policyRuleService.getById("pr-1");

    expect(result.name).toBe("Test Rule");
  });

  it("should throw NotFoundError for unknown rule", async () => {
    mockPolicyRuleRepo.getById.mockResolvedValue(null);

    const { policyRuleService } = await import("../../src/services/policyRule.service.js");
    await expect(policyRuleService.getById("unknown")).rejects.toThrow();
  });

  it("should create a policy rule", async () => {
    const data = { policyId: "POL-002", name: "New Rule", threatLevel: "MEDIUM" };
    mockPolicyRuleRepo.create.mockResolvedValue({ id: "pr-2", ...data });

    const { policyRuleService } = await import("../../src/services/policyRule.service.js");
    const result = await policyRuleService.create(data);

    expect(result.id).toBe("pr-2");
  });

  it("should update a policy rule", async () => {
    mockPolicyRuleRepo.getById.mockResolvedValue({ id: "pr-1" });
    mockPolicyRuleRepo.update.mockResolvedValue({ id: "pr-1", name: "Updated" });

    const { policyRuleService } = await import("../../src/services/policyRule.service.js");
    const result = await policyRuleService.update("pr-1", { name: "Updated" });

    expect(result.name).toBe("Updated");
  });

  it("should throw NotFoundError when updating unknown rule", async () => {
    mockPolicyRuleRepo.getById.mockResolvedValue(null);

    const { policyRuleService } = await import("../../src/services/policyRule.service.js");
    await expect(policyRuleService.update("unknown", { name: "Test" })).rejects.toThrow();
  });

  it("should delete a policy rule", async () => {
    mockPolicyRuleRepo.delete.mockResolvedValue(true);

    const { policyRuleService } = await import("../../src/services/policyRule.service.js");
    const result = await policyRuleService.delete("pr-1");

    expect(result.success).toBe(true);
  });

  it("should throw NotFoundError when deleting unknown rule", async () => {
    mockPolicyRuleRepo.delete.mockResolvedValue(false);

    const { policyRuleService } = await import("../../src/services/policyRule.service.js");
    await expect(policyRuleService.delete("unknown")).rejects.toThrow();
  });
});
