import { describe, it, expect, vi } from "vitest";
import { emailService } from "../../src/services/email.service.js";
import { slackService } from "../../src/services/slack.service.js";
import { alertRulesRepo } from "../../src/services/alertEngine.service.js";

describe("Email Service", () => {
  it("should send an alert email", async () => {
    const result = await emailService.sendAlert({
      to: ["test@test.com"],
      subject: "Test Alert",
      title: "Critical Finding",
      bodyLines: ["Line 1", "Line 2"],
      severity: "CRITICAL",
    });
    expect(result).toBeDefined();
  });
});

describe("Slack Service", () => {
  it("should skip sending when webhook URL is empty", async () => {
    const result = await slackService.sendAlert("test", "CRITICAL");
    expect(result).toBe(false);
  });
});

describe("Alert Rules Repo", () => {
  it("should evaluate severity rule", async () => {
    const results = await alertRulesRepo.evaluate({
      sourceTool: "NEXUS",
      unifiedSeverity: "CRITICAL",
      title: "Test",
      findingId: "abc-123",
    });
    expect(Array.isArray(results)).toBe(true);
  });

  it("should evaluate CISA KEV rule", async () => {
    const results = await alertRulesRepo.evaluate({
      sourceTool: "NEXUS",
      unifiedSeverity: "HIGH",
      cisaKev: true,
      title: "KEV Finding",
      findingId: "abc-456",
    });
    expect(Array.isArray(results)).toBe(true);
  });
});
