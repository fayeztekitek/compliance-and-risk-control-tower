import { query } from "../../../config/database.js";
import { logger } from "../../../core/logger.js";

export const roadmapDeclarations = [
  {
    name: "get_roadmap_summary",
    description: "Get roadmap summary — total roadmaps, average progress, project status distribution",
    parameters: {
      type: "object", properties: {}, required: [],
    },
  },
  {
    name: "get_at_risk_projects",
    description: "Get projects that are at risk or deviating from plan",
    parameters: {
      type: "object",
      properties: { limit: { type: "integer", description: "Max results (default 20)" } },
      required: [],
    },
  },
];

export async function handleRoadmapTool(name: string, args: any): Promise<string> {
  try {
    switch (name) {
      case "get_roadmap_summary": {
        const result = await query(`
          SELECT COUNT(*)::int as total_roadmaps,
                 ROUND(AVG(progress)::numeric, 1) as avg_progress
          FROM roadmaps
        `);
        const projects = await query(`
          SELECT state, COUNT(*)::int as count FROM roadmap_projects GROUP BY state ORDER BY count DESC
        `);
        return JSON.stringify({ summary: result.rows[0], projectStates: projects.rows });
      }
      case "get_at_risk_projects": {
        const result = await query(`
          SELECT id, name, state, progress, deviation
          FROM roadmap_projects WHERE state IN ('DEVIATING', 'HIGH_RISK', 'DELAYED')
          ORDER BY deviation DESC NULLS LAST LIMIT $1
        `, [args.limit || 20]);
        return JSON.stringify(result.rows);
      }
      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (err: any) {
    logger.error({ err, tool: name }, "Roadmap tool error");
    return JSON.stringify({ error: err.message });
  }
}
