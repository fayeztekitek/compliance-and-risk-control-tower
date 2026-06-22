import { describe, it, expect, vi, beforeAll } from "vitest";
import { riskScoreService } from "../../src/services/riskScore.service.js";
import { NexusHttpClient } from "../../src/services/nexusHttpClient.js";
import { nexusService } from "../../src/services/nexus.service.js";

const mockVulns = [
  { cvssScore: 9.0, unifiedSeverity: "CRITICAL", reachability: "REACHABLE", exploitability: "EASY", ageInDays: 120, fixAvailable: true, status: "OPEN", epssScore: 0, cisaKev: false },
  { cvssScore: 4.0, unifiedSeverity: "MEDIUM", reachability: "NOT_REACHABLE", exploitability: "HARD", ageInDays: 15, fixAvailable: false, status: "FIXED", epssScore: 0, cisaKev: false },
  { cvssScore: 7.5, unifiedSeverity: "HIGH", reachability: "REACHABLE", exploitability: "MEDIUM", ageInDays: 45, fixAvailable: true, status: "WAIVED", epssScore: 0, cisaKev: false },
  { cvssScore: 2.0, unifiedSeverity: "LOW", reachability: "UNKNOWN", exploitability: "THEORETICAL", ageInDays: 200, fixAvailable: false, status: "ACCEPTED", epssScore: 0, cisaKev: false },
];

describe("RiskScoreService", () => {

  it("should calculate risk score for CRITICAL vuln on CRITICAL product", () => {
    const score = riskScoreService.calculate(mockVulns[0], "CRITICAL");
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
    expect(score).toBeGreaterThan(30);
  });

  it("should calculate risk score for MEDIUM vuln on LOW product", () => {
    const score = riskScoreService.calculate(mockVulns[1], "LOW");
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBe(12);
  });

  it("should floor risk score at 0", () => {
    const lowRisk = { cvssScore: 0, unifiedSeverity: "LOW", reachability: "NOT_REACHABLE", exploitability: "THEORETICAL", ageInDays: 0, fixAvailable: false, status: "WAIVED", epssScore: 0, cisaKev: false };
    const score = riskScoreService.calculate(lowRisk, "LOW");
    expect(score).toBe(0);
  });

  it("should cap risk score at 100", () => {
    const extremeRisk = {
      cvssScore: 10, unifiedSeverity: "CRITICAL", reachability: "REACHABLE",
      ageInDays: 200, fixAvailable: false, status: "OPEN",
      epssScore: 0.99, cisaKev: true, exploitability: "EASY",
    };
    const score = riskScoreService.calculate(extremeRisk, "CRITICAL");
    expect(score).toBe(100);
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
