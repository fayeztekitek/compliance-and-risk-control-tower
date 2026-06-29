import { query } from "../../../config/database.js";

export const vegDeclarations = [
  {
    name: "get_veg_summary",
    description: "Get VEG deal register summary: total deals, total TCV, won/lost counts, top regions, top business lines.",
    parameters: {
      type: "OBJECT",
      properties: {},
    },
  },
  {
    name: "get_top_veg_deals",
    description: "Get the top VEG deals by TCV.",
    parameters: {
      type: "OBJECT",
      properties: {
        limit: { type: "NUMBER", description: "Number of results (default 5)" },
      },
    },
  },
  {
    name: "get_workflow_summary",
    description: "Get workflow request summary: total requests, counts by status (DRAFT, SUBMITTED, APPROVED, REJECTED).",
    parameters: {
      type: "OBJECT",
      properties: {},
    },
  },
];

export async function handleVegTool(name: string, _args: any): Promise<string> {
  switch (name) {
    case "get_veg_summary": {
      const total = await query("SELECT COUNT(*)::int as count, COALESCE(SUM(tcv), 0)::float as total_tcv FROM veg_deals").catch(() => null);
      const decisions = await query("SELECT decision, COUNT(*)::int as count FROM veg_deals GROUP BY decision").catch(() => null);
      return JSON.stringify({
        totalDeals: total?.rows[0]?.count || 0,
        totalTcv: total?.rows[0]?.total_tcv || 0,
        decisions: decisions?.rows || [],
      });
    }
    case "get_top_veg_deals": {
      const limit = Math.min(_args.limit || 5, 20);
      const result = await query(
        "SELECT veg_id, client, business_line, region, decision, tcv FROM veg_deals ORDER BY tcv DESC LIMIT $1",
        [limit]
      ).catch(() => null);
      return JSON.stringify(result?.rows || []);
    }
    case "get_workflow_summary": {
      const result = await query("SELECT status, COUNT(*)::int as count FROM veg_request_workflow GROUP BY status").catch(() => null);
      return JSON.stringify(result?.rows || []);
    }
    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}
