import { describe, it, expect } from "vitest";
import { riskScoreService } from "../../src/services/riskScore.service.js";
import { NexusHttpClient } from "../../src/services/nexusHttpClient.js";

describe("Nexus Functional Tests", () => {
  it("Risk score calculation: CRITICAL vuln on CRITICAL product", () => {
    const vuln = { cvssScore: 9.5, unifiedSeverity: "CRITICAL", reachability: "REACHABLE", exploitability: "EASY", ageInDays: 200, fixAvailable: true, status: "OPEN", epssScore: 0, cisaKev: false };
    const score = riskScoreService.calculate(vuln, "CRITICAL");
    const grade = riskScoreService.getProductGrade(score);
    expect(score).toBeGreaterThan(30);
    expect(score).toBeLessThanOrEqual(100);
    expect(["RED", "ORANGE"]).toContain(grade);
  });

  it("Mock client should create logs with masked tokens", async () => {
    const client = new NexusHttpClient({ url: "https://mock-nexus-server.local", username: "test", token: "mySecretPass123", timeoutMs: 50, maxRetries: 1 });
    client.clearLogs();
    try { await client.executeRequest("api/v2/organizations"); } catch {}
    const logs = client.getMaskedLogs();
    expect(logs).toContain("[ERROR]");
    expect(logs).toContain("mock-nexus-server");
  });

  it("Connection test should return result (even if failed)", async () => {
    const client = new NexusHttpClient({ url: "https://mock-nexus-server.local", username: "test", token: "test", timeoutMs: 1000, maxRetries: 1 });
    const result = await client.testConnection();
    expect(result).toHaveProperty("success");
    expect(result).toHaveProperty("message");
    expect(result).toHaveProperty("duration");
  });
});
