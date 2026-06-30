import { describe, it, expect, vi, beforeEach } from "vitest";

const mockQuery = vi.fn();
vi.mock("../../src/config/database.js", () => ({ query: mockQuery }));

describe("KPI Registry Service", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("evaluateRag should return GREEN when KPI not found", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const { kpiRegistryService } = await import("../../src/services/kpi-registry.service.js");
    const result = await kpiRegistryService.evaluateRag("UNKNOWN_KPI", 50);
    expect(result).toBe("GREEN");
  });

  it("evaluateRag should return RED when the last (most specific) rule matches", async () => {
    // Rules are processed in reverse — last rule in array is checked first
    // So AMBER (last) should match first for value=90 → returns AMBER
    // To get RED, RED must be last in the array
    mockQuery.mockResolvedValueOnce({
      rows: [{
        rag_rules: [
          { rule: "AMBER", condition: "value > 50" },
          { rule: "RED", condition: "value > 80" },
        ],
      }],
    });
    const { kpiRegistryService } = await import("../../src/services/kpi-registry.service.js");
    const result = await kpiRegistryService.evaluateRag("TEST_KPI", 90);
    expect(result).toBe("RED");
  });

  it("evaluateRag should return GREEN when last rule is AMBER but value < threshold", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{
        rag_rules: [
          { rule: "GREEN", condition: "value <= 30" },
          { rule: "AMBER", condition: "value > 50" },
        ],
      }],
    });
    // After reverse: AMBER checked first (value 30 > 50? No) → GREEN checked (30 <= 30? Yes) → GREEN
    const { kpiRegistryService } = await import("../../src/services/kpi-registry.service.js");
    const result = await kpiRegistryService.evaluateRag("TEST_KPI", 30);
    expect(result).toBe("GREEN");
  });

  it("evaluateRag should return GREEN when no conditions match", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{
        rag_rules: [
          { rule: "RED", condition: "value > 80" },
          { rule: "AMBER", condition: "value > 50" },
        ],
      }],
    });
    const { kpiRegistryService } = await import("../../src/services/kpi-registry.service.js");
    const result = await kpiRegistryService.evaluateRag("TEST_KPI", 30);
    expect(result).toBe("GREEN");
  });

  it("evaluateRag should handle empty rag_rules gracefully", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ rag_rules: [] }],
    });
    const { kpiRegistryService } = await import("../../src/services/kpi-registry.service.js");
    const result = await kpiRegistryService.evaluateRag("TEST_KPI", 50);
    expect(result).toBe("GREEN");
  });

  it("evaluateRag should handle complex conditions", async () => {
    // Use mockImplementation so it persists across multiple calls
    mockQuery.mockImplementation(async () => ({
      rows: [{
        rag_rules: [
          { rule: "GREEN", condition: "value < 70" },
          { rule: "AMBER", condition: "value >= 70 && value < 90" },
          { rule: "RED", condition: "value >= 90 && value <= 100" },
        ],
      }],
    }));

    const { kpiRegistryService } = await import("../../src/services/kpi-registry.service.js");

    expect(await kpiRegistryService.evaluateRag("T", 100)).toBe("RED");
    expect(await kpiRegistryService.evaluateRag("T", 95)).toBe("RED");
    expect(await kpiRegistryService.evaluateRag("T", 85)).toBe("AMBER");
    expect(await kpiRegistryService.evaluateRag("T", 70)).toBe("AMBER");
    expect(await kpiRegistryService.evaluateRag("T", 50)).toBe("GREEN");
  });

  it("evaluateRag should process rules in reverse order (last rule wins)", async () => {
    mockQuery.mockImplementation(async () => ({
      rows: [{
        rag_rules: [
          { rule: "GREEN", condition: "value > 0" },
          { rule: "AMBER", condition: "value > 0" },
          { rule: "RED", condition: "value > 0" },
        ],
      }],
    }));
    // Reverse: RED first (matches) → returns RED
    const { kpiRegistryService } = await import("../../src/services/kpi-registry.service.js");
    const result = await kpiRegistryService.evaluateRag("TEST_KPI", 50);
    expect(result).toBe("RED");
  });

  it("evaluateRag should skip invalid conditions", async () => {
    mockQuery.mockImplementation(async () => ({
      rows: [{
        rag_rules: [
          { rule: "RED", condition: "invalid syntax!!!" },
          { rule: "AMBER", condition: "value > 0" },
        ],
      }],
    }));
    const { kpiRegistryService } = await import("../../src/services/kpi-registry.service.js");
    const result = await kpiRegistryService.evaluateRag("TEST_KPI", 50);
    expect(result).toBe("AMBER");
  });

  it("list should map snake_case to camelCase", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{
        id: "k1", name: "RTD Average", description: "Average RTD", formula: "AVG(rtd_value)",
        owner: "PMO", frequency: "MONTHLY", domain: "roadmap", unit: "%",
        higher_is_better: true, thresholds: { warning: 70, critical: 50 },
        rag_rules: [], explanation: "test", source_query: null,
        active: true, created_at: "2025-01-01T00:00:00Z", updated_at: "2025-01-01T00:00:00Z",
      }],
    });
    const { kpiRegistryService } = await import("../../src/services/kpi-registry.service.js");
    const list = await kpiRegistryService.list();

    expect(list).toHaveLength(1);
    expect(list[0].id).toBe("k1");
    expect(list[0].higherIsBetter).toBe(true);
    expect(list[0].createdAt).toBe("2025-01-01T00:00:00Z");
    expect(list[0].domain).toBe("roadmap");
  });
});
