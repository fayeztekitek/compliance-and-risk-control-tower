import { query } from "../../../config/database.js";
import { logger } from "../../../core/logger.js";

export const auditDeclarations = [
  {
    name: "get_audit_summary",
    description: "Get audit summary — total audits, findings by severity, CAPA status",
    parameters: {
      type: "object", properties: {}, required: [],
    },
  },
  {
    name: "get_open_findings",
    description: "Get open audit findings by severity",
    parameters: {
      type: "object",
      properties: { limit: { type: "integer", description: "Max results (default 20)" } },
      required: [],
    },
  },
];

export async function handleAuditTool(name: string, args: any): Promise<string> {
  try {
    switch (name) {
      case "get_audit_summary": {
        const findings = await query(`
          SELECT severity, status, COUNT(*)::int as count
          FROM audit_findings GROUP BY severity, status ORDER BY severity
        `);
        const capa = await query(`
          SELECT status, COUNT(*)::int as count FROM capa GROUP BY status ORDER BY status
        `);
        return JSON.stringify({ findings: findings.rows, capaStatus: capa.rows });
      }
      case "get_open_findings": {
        const result = await query(`
          SELECT id, title, severity, audit_title, created_at
          FROM audit_findings WHERE status = 'OPEN' ORDER BY severity DESC, created_at DESC LIMIT $1
        `, [args.limit || 20]);
        return JSON.stringify(result.rows);
      }
      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (err: any) {
    logger.error({ err, tool: name }, "Audit tool error");
    return JSON.stringify({ error: err.message });
  }
}
