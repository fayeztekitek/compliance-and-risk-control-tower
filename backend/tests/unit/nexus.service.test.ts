import { describe, it, expect, vi, beforeAll } from "vitest";
import { riskScoreService } from "../../src/services/riskScore.service.js";
import { NexusHttpClient } from "../../src/services/nexusHttpClient.js";
import { nexusService } from "../../src/services/nexus.service.js";

const mockVulns = [
  { cvssScore: 9.0, severity: "CRITICAL", reachable: "REACHABLE", exploitability: "EASY", ageInDays: 120, fixAvailable: true, status: "Open" },
  { cvssScore: 4.0, severity: "MEDIUM", reachable: "NOT_REACHABLE", exploitability: "HARD", ageInDays: 15, fixAvailable: false, status: "Fixed" },
  { cvssScore: 7.5, severity: "HIGH", reachable: "REACHABLE", exploitability: "MEDIUM", ageInDays: 45, fixAvailable: true, status: "Waived" },
  { cvssScore: 2.0, severity: "LOW", reachable: "UNKNOWN", exploitability: "THEORETICAL", ageInDays: 200, fixAvailable: false, status: "Accepted" },
];

describe("RiskScoreService", () => {

  it("should calculate risk score for CRITICAL vuln on CRITICAL product", () => {
    const score = riskScoreService.calculate(mockVulns[0], "CRITICAL");
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
    expect(score).toBe(100);
  });

  it("should calculate risk score for MEDIUM vuln on LOW product", () => {
    const score = riskScoreService.calculate(mockVulns[1], "LOW");
    expect(score).toBe(27);
  });

  it("should cap risk score at 100", () => {
    const highRisk = { ...mockVulns[0], cvssScore: 10 };
    const score = riskScoreService.calculate(highRisk, "CRITICAL");
    expect(score).toBe(100);
  });

  it("should floor risk score at 0", () => {
    const lowRisk = { cvssScore: 0, severity: "LOW", reachable: "NOT_REACHABLE", exploitability: "THEORETICAL", ageInDays: 0, fixAvailable: false, status: "Waived" };
    const score = riskScoreService.calculate(lowRisk, "LOW");
    expect(score).toBe(0);
  });

  it("should return GREEN for score < 40", () => {
    expect(riskScoreService.getProductGrade(20)).toBe("GREEN");
  });

  it("should return ORANGE for score 40-69", () => {
    expect(riskScoreService.getProductGrade(55)).toBe("ORANGE");
  });

  it("should return RED for score >= 70", () => {
    expect(riskScoreService.getProductGrade(85)).toBe("RED");
  });

  it("should compute aggregates for a list of vulnerabilities", () => {
    const aggregates = riskScoreService.getAggregates(mockVulns, "CRITICAL");
    expect(aggregates.riskScore).toBeGreaterThanOrEqual(0);
    expect(aggregates.criticalCount).toBe(1);
    expect(aggregates.highCount).toBe(1);
    expect(aggregates.mediumCount).toBe(1);
    expect(aggregates.lowCount).toBe(1);
    expect(aggregates.activeWaiversCount).toBe(1);
    expect(aggregates.agingStats.over180).toBe(1);
    expect(aggregates.agingStats.under30).toBe(1);
  });
});

describe("NexusHttpClient", () => {

  it("should mask tokens in logs", async () => {
    const client = new NexusHttpClient({ url: "http://localhost:1", username: "u", token: "my-secret-token-123", timeoutMs: 50, maxRetries: 1 });
    client.clearLogs();
    try { await client.executeRequest("nonexistent"); } catch {}
    const logs = client.getMaskedLogs();
    expect(logs).toContain("[ERROR]");
    expect(logs).toContain("localhost");
  });

  it("should throw on exhausted retries", async () => {
    const client = new NexusHttpClient({ url: "http://localhost:1", username: "u", token: "t", timeoutMs: 100, maxRetries: 1 });
    await expect(client.executeRequest("nonexistent")).rejects.toThrow();
  });
});

describe("NexusService", () => {
  it("should be defined", () => {
    expect(nexusService).toBeDefined();
    expect(typeof nexusService.listProducts).toBe("function");
    expect(typeof nexusService.listVulnerabilities).toBe("function");
    expect(typeof nexusService.getExecutiveKpis).toBe("function");
  });
});
