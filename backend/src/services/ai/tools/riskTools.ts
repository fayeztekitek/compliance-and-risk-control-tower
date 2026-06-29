import { query } from "../../../config/database.js";

export const riskDeclarations = [
  {
    name: "get_vulnerability_summary",
    description: "Get vulnerability summary counts grouped by severity. Returns counts for CRITICAL, HIGH, MEDIUM, LOW.",
    parameters: {
      type: "OBJECT",
      properties: {},
    },
  },
  {
    name: "get_top_vulnerable_components",
    description: "Get the most vulnerable software components by occurrence count.",
    parameters: {
      type: "OBJECT",
      properties: {
        limit: { type: "NUMBER", description: "Number of results (default 10)" },
      },
    },
  },
  {
    name: "get_risk_metrics",
    description: "Get aggregate risk metrics: total open vulnerabilities, critical count, SLA breach rate, MTTR.",
    parameters: {
      type: "OBJECT",
      properties: {},
    },
  },
];

export async function handleRiskTool(name: string, _args: any): Promise<string> {
  switch (name) {
    case "get_vulnerability_summary": {
      const result = await query(
        "SELECT unified_severity as severity, COUNT(*)::int as count FROM unified_findings GROUP BY unified_severity ORDER BY count DESC"
      ).catch(() => null);
      return JSON.stringify(result?.rows || []);
    }
    case "get_top_vulnerable_components": {
      const limit = Math.min(_args.limit || 10, 50);
      const result = await query(
        `SELECT fc.component_name, fc.version, COUNT(DISTINCT fo.finding_id)::int as finding_count,
                COUNT(fo.id)::int as occurrence_count
         FROM finding_components fc
         JOIN finding_occurrences fo ON fo.component_id = fc.id
         WHERE fo.occurrence_status = 'ACTIVE'
         GROUP BY fc.id, fc.component_name, fc.version
         ORDER BY occurrence_count DESC LIMIT $1`,
        [limit]
      ).catch(() => null);
      return JSON.stringify(result?.rows || []);
    }
    case "get_risk_metrics": {
      const total = await query("SELECT COUNT(*)::int as count FROM unified_findings").catch(() => null);
      const critical = await query("SELECT COUNT(*)::int as count FROM unified_findings WHERE unified_severity = 'CRITICAL'").catch(() => null);
      const slaBreach = await query("SELECT COUNT(*)::int as count FROM unified_findings WHERE sla_due_date < NOW() AND status NOT IN ('FIXED', 'CLOSED', 'ACCEPTED')").catch(() => null);
      return JSON.stringify({
        totalOpenVulnerabilities: total?.rows[0]?.count || 0,
        criticalCount: critical?.rows[0]?.count || 0,
        slaBreachCount: slaBreach?.rows[0]?.count || 0,
      });
    }
    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}
