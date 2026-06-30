import { query } from "../../../config/database.js";
import { logger } from "../../../core/logger.js";

export const securityDeclarations = [
  {
    name: "get_vulnerability_summary",
    description: "Get vulnerability summary by severity and status",
    parameters: {
      type: "object", properties: {}, required: [],
    },
  },
  {
    name: "get_scanner_breakdown",
    description: "Get vulnerability counts by scanner source",
    parameters: {
      type: "object", properties: {}, required: [],
    },
  },
  {
    name: "get_component_vulnerabilities",
    description: "Get vulnerabilities for a specific component",
    parameters: {
      type: "object",
      properties: {
        componentName: { type: "string", description: "Component name to search" },
        limit: { type: "integer", description: "Max results (default 20)" },
      },
      required: ["componentName"],
    },
  },
];

export async function handleSecurityTool(name: string, args: any): Promise<string> {
  try {
    switch (name) {
      case "get_vulnerability_summary": {
        const sev = await query(`
          SELECT severity, status, COUNT(*)::int as count
          FROM unified_findings GROUP BY severity, status ORDER BY severity
        `);
        return JSON.stringify(sev.rows);
      }
      case "get_scanner_breakdown": {
        const result = await query(`
          SELECT source, COUNT(*)::int as count FROM unified_findings GROUP BY source ORDER BY count DESC
        `);
        return JSON.stringify(result.rows);
      }
      case "get_component_vulnerabilities": {
        const result = await query(`
          SELECT uf.id, uf.title, uf.severity, uf.cvss_score, uf.status, fc.component_name
          FROM unified_findings uf
          JOIN finding_components fc ON fc.finding_id = uf.id
          WHERE fc.component_name ILIKE $1
          LIMIT $2
        `, [`%${args.componentName}%`, args.limit || 20]);
        return JSON.stringify(result.rows);
      }
      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (err: any) {
    logger.error({ err, tool: name }, "Security tool error");
    return JSON.stringify({ error: err.message });
  }
}
