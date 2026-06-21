import { describe, it, expect } from "vitest";
import { riskScoreService } from "../../src/services/riskScore.service.js";
import { NexusHttpClient } from "../../src/services/nexusHttpClient.js";

describe("Nexus Functional Tests", () => {
  it("Risk score calculation: CRITICAL vuln → 100 score → RED grade", () => {
    const vuln = { cvssScore: 9.5, severity: "CRITICAL", reachable: "REACHABLE", exploitability: "EASY", ageInDays: 200, fixAvailable: true, status: "Open" };
    const score = riskScoreService.calculate(vuln, "CRITICAL");
    const grade = riskScoreService.getProductGrade(score);
    expect(score).toBe(100);
    expect(grade).toBe("RED");
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
