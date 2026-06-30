import { query } from "../../../config/database.js";
import { logger } from "../../../core/logger.js";

export const privacyDeclarations = [
  {
    name: "get_privacy_assessment_summary",
    description: "Get privacy assessment summary — status distribution, GDPR risk levels",
    parameters: {
      type: "object", properties: {}, required: [],
    },
  },
];

export async function handlePrivacyTool(name: string, args: any): Promise<string> {
  try {
    switch (name) {
      case "get_privacy_assessment_summary": {
        const statuses = await query(`
          SELECT status, COUNT(*)::int as count
          FROM privacy_assessments GROUP BY status ORDER BY count DESC
        `);
        const gdpr = await query(`
          SELECT gdpr_risk_level, COUNT(*)::int as count
          FROM saas_applications WHERE gdpr_risk_level IS NOT NULL
          GROUP BY gdpr_risk_level ORDER BY count DESC
        `);
        return JSON.stringify({ assessmentStatus: statuses.rows, gdprRiskLevels: gdpr.rows });
      }
      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (err: any) {
    logger.error({ err, tool: name }, "Privacy tool error");
    return JSON.stringify({ error: err.message });
  }
}
