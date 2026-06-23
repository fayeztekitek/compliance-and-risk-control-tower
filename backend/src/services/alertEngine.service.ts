import { pool } from "../config/database.js";

interface AlertRule {
  id: string;
  name: string;
  source_tool: string | null;
  severity_threshold: string | null;
  condition: string;
  condition_value: string | null;
  channel: string;
  recipients: string[];
  enabled: boolean;
}

type FindingEvent = {
  sourceTool: string;
  unifiedSeverity: string;
  epssScore?: number;
  cisaKev?: boolean;
  slaDueDate?: string;
  title: string;
  findingId: string;
};

export const alertRulesRepo = {
  async getEnabled(): Promise<AlertRule[]> {
    const { rows } = await pool.query("SELECT * FROM alert_rules WHERE enabled = true");
    return rows;
  },

  async evaluate(finding: FindingEvent): Promise<Array<{ rule: AlertRule; matched: boolean; reason: string }>> {
    const rules = await this.getEnabled();
    const results: Array<{ rule: AlertRule; matched: boolean; reason: string }> = [];

    for (const rule of rules) {
      let matched = false;
      let reason = "";

      if (rule.source_tool && rule.source_tool !== finding.sourceTool) {
        results.push({ rule, matched: false, reason: "source_tool mismatch" });
        continue;
      }

      switch (rule.condition) {
        case "SEVERITY": {
          const severityOrder = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
          const findingIdx = severityOrder.indexOf(finding.unifiedSeverity);
          const thresholdIdx = severityOrder.indexOf(rule.severity_threshold || "MEDIUM");
          if (findingIdx >= thresholdIdx) { matched = true; reason = `severity ${finding.unifiedSeverity} >= ${rule.severity_threshold}`; }
          break;
        }
        case "EPSS_SCORE": {
          const threshold = parseFloat(rule.condition_value || "0.9");
          if ((finding.epssScore || 0) >= threshold) { matched = true; reason = `EPSS ${finding.epssScore} >= ${threshold}`; }
          break;
        }
        case "CISA_KEV": {
          if (finding.cisaKev) { matched = true; reason = "CISA KEV flagged"; }
          break;
        }
        case "SLA_BREACH": {
          if (finding.slaDueDate && new Date(finding.slaDueDate) < new Date()) { matched = true; reason = "SLA breached"; }
          break;
        }
      }

      results.push({ rule, matched, reason });
    }

    return results;
  },
};
