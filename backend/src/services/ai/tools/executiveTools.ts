import { query } from "../../../config/database.js";
import { logger } from "../../../core/logger.js";

export const executiveDeclarations = [
  {
    name: "get_kpi_summary",
    description: "Get executive KPI summary — compliance score, vulnerability counts, SLA breaches, org health",
    parameters: {
      type: "object", properties: {}, required: [],
    },
  },
  {
    name: "get_org_risk_heatmap",
    description: "Get organizational risk heatmap data — risk levels per organization",
    parameters: {
      type: "object", properties: {}, required: [],
    },
  },
  {
    name: "get_top_risky_apps",
    description: "Get top risky applications by vulnerability count",
    parameters: {
      type: "object",
      properties: { limit: { type: "integer", description: "Number of apps to return (default 10)" } },
      required: [],
    },
  },
];

export async function handleExecutiveTool(name: string, args: any): Promise<string> {
  try {
    switch (name) {
      case "get_kpi_summary": {
        const counts = await query(`
          SELECT severity, COUNT(*)::int as count FROM unified_findings GROUP BY severity ORDER BY count DESC
        `);
        const complianceResult = await query(`
          SELECT classification, COUNT(*)::int as count FROM compliance_classification GROUP BY classification ORDER BY count DESC
        `);
        const slaResult = await query(`
          SELECT COUNT(*)::int as open_breaches FROM sla_breaches WHERE status = 'OPEN'
        `);
        return JSON.stringify({
          vulnerabilityCounts: counts.rows,
          complianceClassification: complianceResult.rows,
          openSlaBreaches: slaResult.rows[0]?.open_breaches || 0,
        });
      }
      case "get_org_risk_heatmap": {
        const result = await query(`
          SELECT o.name as organization, uf.severity, COUNT(*)::int as count
          FROM unified_findings uf
          JOIN organizations o ON o.id = uf.organization_id
          GROUP BY o.name, uf.severity ORDER BY o.name, count DESC
        `);
        return JSON.stringify(result.rows);
      }
      case "get_top_risky_apps": {
        const limit = args.limit || 10;
        const result = await query(`
          SELECT app_name, COUNT(*)::int as vuln_count, MAX(CAST(cvss_score AS numeric)) as max_cvss
          FROM unified_findings WHERE app_name IS NOT NULL
          GROUP BY app_name ORDER BY vuln_count DESC LIMIT $1
        `, [limit]);
        return JSON.stringify(result.rows);
      }
      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (err: any) {
    logger.error({ err, tool: name }, "Executive tool error");
    return JSON.stringify({ error: err.message });
  }
}
