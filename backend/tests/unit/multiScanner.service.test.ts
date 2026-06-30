import { describe, it, expect } from "vitest";
import { mapFortifyVulnerability, mapFortifySeverity } from "../../src/services/fortifyAdapter.js";
import { mapSonarqubeIssue, mapSonarqubeSeverity, processSonarqubeWebhook } from "../../src/services/sonarqubeAdapter.js";
import { mapVeracodeFlaw, mapVeracodeSeverity } from "../../src/services/veracodeAdapter.js";

describe("Fortify Adapter", () => {
  it("maps priority to severity", () => {
    expect(mapFortifySeverity(1)).toBe("CRITICAL");
    expect(mapFortifySeverity(2)).toBe("HIGH");
    expect(mapFortifySeverity(3)).toBe("MEDIUM");
    expect(mapFortifySeverity(4)).toBe("LOW");
    expect(mapFortifySeverity(5)).toBe("LOW");
  });

  it("maps a vulnerability to a finding input", () => {
    const vuln = { id: "vuln-1", category: "SQL Injection", priority: 1, cweId: "CWE-89", fileName: "db.php", lineNumber: 42, kingdom: "Input Validation" };
    const input = mapFortifyVulnerability(vuln, "my-app");
    expect(input.sourceId).toBe("vuln-1");
    expect(input.severity).toBe("CRITICAL");
    expect(input.cweId).toBe("CWE-89");
    expect(input.fileName).toBe("db.php");
    expect(input.lineNumber).toBe(42);
    expect(input.targetProduct).toBe("my-app");
    expect(input.sourceTable).toBe("fortify");
  });

  it("handles missing fields gracefully", () => {
    const vuln = { id: "vuln-2", category: "", priority: 3 };
    const input = mapFortifyVulnerability(vuln, "my-app");
    expect(input.title).toBe("Fortify finding");
    expect(input.severity).toBe("MEDIUM");
  });
});

describe("SonarQube Adapter", () => {
  it("maps severity correctly", () => {
    expect(mapSonarqubeSeverity("BLOCKER")).toBe("CRITICAL");
    expect(mapSonarqubeSeverity("CRITICAL")).toBe("HIGH");
    expect(mapSonarqubeSeverity("MAJOR")).toBe("MEDIUM");
    expect(mapSonarqubeSeverity("MINOR")).toBe("LOW");
    expect(mapSonarqubeSeverity("INFO")).toBe("LOW");
    expect(mapSonarqubeSeverity("UNKNOWN")).toBe("MEDIUM");
  });

  it("maps an issue to a finding input", () => {
    const issue = { key: "sq-1", severity: "CRITICAL", message: "SQL injection", rule: "typescript:S3649", line: 15, type: "VULNERABILITY" };
    const input = mapSonarqubeIssue(issue, "my-app");
    expect(input.sourceId).toBe("sq-1");
    expect(input.severity).toBe("HIGH");
    expect(input.targetProduct).toBe("my-app");
    expect(input.sourceTable).toBe("sonarqube");
  });

  it("processes webhook payload filtering resolved issues", () => {
    const payload = {
      project: { key: "my-app", name: "my-app" },
      qualityGate: { status: "OK", conditions: [] },
      issues: [
        { key: "sq-1", severity: "MAJOR", type: "BUG", message: "bug", rule: "x", status: "OPEN", component: "my-app" },
        { key: "sq-2", severity: "BLOCKER", type: "VULNERABILITY", message: "vuln", rule: "y", status: "RESOLVED", component: "my-app" },
        { key: "sq-3", severity: "INFO", type: "CODE_SMELL", message: "smell", rule: "z", status: "OPEN", component: "my-app" },
      ],
      analysedAt: "2025-01-01T00:00:00Z",
    };
    const findings = processSonarqubeWebhook(payload);
    expect(findings).toHaveLength(2);
    expect(findings[0].sourceId).toBe("sq-1");
    expect(findings[1].sourceId).toBe("sq-3");
  });

  it("returns empty array when no issues", () => {
    const payload = {
      project: { key: "my-app", name: "my-app" },
      qualityGate: { status: "OK", conditions: [] },
      analysedAt: "2025-01-01T00:00:00Z",
    };
    expect(processSonarqubeWebhook(payload)).toHaveLength(0);
  });
});

describe("Veracode Adapter", () => {
  it("maps severity levels", () => {
    expect(mapVeracodeSeverity(5)).toBe("CRITICAL");
    expect(mapVeracodeSeverity(4)).toBe("HIGH");
    expect(mapVeracodeSeverity(3)).toBe("HIGH");
    expect(mapVeracodeSeverity(2)).toBe("HIGH");
    expect(mapVeracodeSeverity(1)).toBe("MEDIUM");
    expect(mapVeracodeSeverity(0)).toBe("LOW");
    expect(mapVeracodeSeverity(99)).toBe("MEDIUM");
  });

  it("maps a flaw to a finding input", () => {
    const flaw = { issueId: "v-1", categoryName: "XSS", severity: 5, cveId: "CVE-2025-0001", description: "Cross-site scripting", moduleName: "auth.js", modulePath: "/app/auth.js", exploitLevel: 3, remediationStatus: "OPEN" };
    const input = mapVeracodeFlaw(flaw, "my-app");
    expect(input.sourceId).toBe("v-1");
    expect(input.severity).toBe("CRITICAL");
    expect(input.cweId).toBe("CVE-2025-0001");
    expect(input.targetProduct).toBe("my-app");
    expect(input.sourceTable).toBe("veracode");
  });

  it("handles missing cve and description", () => {
    const flaw = { issueId: "v-2", categoryName: "SSRF", severity: 3, exploitLevel: 0, remediationStatus: "OPEN" };
    const input = mapVeracodeFlaw(flaw, "my-app");
    expect(input.sourceId).toBe("v-2");
    expect(input.cweId).toBeUndefined();
    expect(input.description).toContain("SSRF");
  });
});

describe("ScannerHttpClient", () => {
  it("can be instantiated with config", async () => {
    const { ScannerHttpClient } = await import("../../src/services/scannerHttpClient.js");
    const client = new ScannerHttpClient({ url: "https://example.com", authHeader: "Bearer test" });
    expect(client).toBeDefined();
    expect(client.getMaskedLogs()).toBe("");
    client.clearLogs();
  });
});
