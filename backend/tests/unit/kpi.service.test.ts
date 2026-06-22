import { describe, it, expect, beforeAll } from "vitest";
import { healthCheck } from "../../src/config/database.js";
import { kpiService } from "../../src/services/kpi.service.js";
import { riskScoreService } from "../../src/services/riskScore.service.js";

let dbOk = false;

beforeAll(async () => {
  dbOk = await healthCheck();
});

describe("KPI Service", () => {
  it("get4Kris should return 4 KRI objects with correct shape", async () => {
    if (!dbOk) return;
    const kris = await kpiService.get4Kris();
    expect(kris).toHaveLength(4);
    for (const k of kris) {
      expect(k).toHaveProperty("id");
      expect(k).toHaveProperty("name");
      expect(k).toHaveProperty("value");
      expect(k).toHaveProperty("threshold");
      expect(k).toHaveProperty("status");
      expect(["OK", "WARNING", "BREACHED"]).toContain(k.status);
    }
  });

  it("get16Kpis should return all expected KPI keys", async () => {
    if (!dbOk) return;
    const kpis = await kpiService.get16Kpis();
    const expectedKeys = [
      "totalVulnerabilities", "criticalVulnerabilities", "highVulnerabilities",
      "openVulnerabilities", "slaOverdueVulnerabilities", "falsePositives",
      "fixedVulnerabilities", "waivedVulnerabilities", "acceptedRisks",
      "totalProjects", "deviatingProjects", "budgetOverrunProjects",
      "activeWaivers", "productsRed", "productsOrange", "productsGreen",
      "globalRiskScore", "complianceScore", "securityDebtScore",
      "distinctFindings", "totalOccurrences", "occurrenceRatio",
    ];
    for (const key of expectedKeys) {
      expect(kpis).toHaveProperty(key);
    }
  });

  it("get5x5Heatmap should return severity and age range labels", async () => {
    if (!dbOk) return;
    const heatmap = await kpiService.get5x5Heatmap();
    expect(heatmap.severityLevels).toHaveLength(4);
    expect(heatmap.ageRanges).toHaveLength(5);
    expect(Array.isArray(heatmap.cells)).toBe(true);
  });

  it("getMonthlyTrends should return security and project trend arrays", async () => {
    if (!dbOk) return;
    const trends = await kpiService.getMonthlyTrends(3);
    expect(trends).toHaveProperty("securityTrends");
    expect(trends).toHaveProperty("projectTrends");
    expect(Array.isArray(trends.securityTrends)).toBe(true);
    expect(Array.isArray(trends.projectTrends)).toBe(true);
  });
});

describe("RiskScoreService helpers", () => {
  it("should calculate correct grade for boundary scores", () => {
    expect(riskScoreService.getProductGrade(0)).toBe("GREEN");
    expect(riskScoreService.getProductGrade(39)).toBe("GREEN");
    expect(riskScoreService.getProductGrade(40)).toBe("ORANGE");
    expect(riskScoreService.getProductGrade(69)).toBe("ORANGE");
    expect(riskScoreService.getProductGrade(70)).toBe("RED");
    expect(riskScoreService.getProductGrade(100)).toBe("RED");
  });
});
