import { query } from "../../../config/database.js";
import { logger } from "../../../core/logger.js";

export const reportingDeclarations = [
  {
    name: "get_available_reports",
    description: "List available report templates and their descriptions",
    parameters: {
      type: "object", properties: {}, required: [],
    },
  },
  {
    name: "get_dashboard_export_data",
    description: "Get summary data suitable for export/reporting across all domains",
    parameters: {
      type: "object",
      properties: {
        domain: { type: "string", description: "Domain to export: compliance, risk, audit, veg, executive" },
      },
      required: ["domain"],
    },
  },
];

export async function handleReportingTool(name: string, args: any): Promise<string> {
  try {
    switch (name) {
      case "get_available_reports":
        return JSON.stringify({
          reports: [
            { id: "executive-summary", name: "Executive Summary", domains: ["executive"] },
            { id: "compliance-posture", name: "Compliance Posture Report", domains: ["compliance"] },
            { id: "vulnerability-report", name: "Vulnerability Report", domains: ["risk", "security"] },
            { id: "audit-findings", name: "Audit Findings Report", domains: ["audit"] },
            { id: "veg-deal-report", name: "VEG Deal Register Report", domains: ["veg"] },
            { id: "roadmap-progress", name: "Roadmap Progress Report", domains: ["roadmap"] },
            { id: "saa-sportfolio", name: "SaaS Portfolio Report", domains: ["saas"] },
          ],
        });
      case "get_dashboard_export_data": {
        const domain = args.domain;
        if (domain === "executive") {
          const kpis = await query(`SELECT COUNT(*)::int as total_findings FROM unified_findings`);
          const severities = await query(`SELECT severity, COUNT(*)::int as count FROM unified_findings GROUP BY severity`);
          return JSON.stringify({ totalFindings: kpis.rows[0]?.total_findings, severityDistribution: severities.rows });
        }
        if (domain === "compliance") {
          const classes = await query(`SELECT classification, COUNT(*)::int as count FROM compliance_classification GROUP BY classification`);
          return JSON.stringify({ classificationDistribution: classes.rows });
        }
        if (domain === "risk") {
          const sev = await query(`SELECT severity, status, COUNT(*)::int as count FROM unified_findings GROUP BY severity, status`);
          return JSON.stringify({ vulnerabilitySeverity: sev.rows });
        }
        if (domain === "veg") {
          const deals = await query(`SELECT decision, COUNT(*)::int as count, ROUND(SUM(tcv)::numeric, 2) as total_tcv FROM veg_deals GROUP BY decision`);
          return JSON.stringify({ dealSummary: deals.rows });
        }
        return JSON.stringify({ message: `No export data available for domain: ${domain}` });
      }
      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (err: any) {
    logger.error({ err, tool: name }, "Reporting tool error");
    return JSON.stringify({ error: err.message });
  }
}
