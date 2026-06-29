import { query } from "../../../config/database.js";

export const complianceDeclarations = [
  {
    name: "get_compliance_summary",
    description: "Get compliance posture summary across all frameworks. Returns control effectiveness rates, open non-conformities, and framework coverage.",
    parameters: {
      type: "OBJECT",
      properties: {},
    },
  },
  {
    name: "get_compliance_by_framework",
    description: "Get compliance details for a specific framework.",
    parameters: {
      type: "OBJECT",
      properties: {
        framework: { type: "STRING", description: "Framework name (SOC 2, ISO 27001, PCI DSS, etc.)" },
      },
      required: ["framework"],
    },
  },
];

export async function handleComplianceTool(name: string, args: any): Promise<string> {
  switch (name) {
    case "get_compliance_summary": {
      const frameworks = await query("SELECT framework, COUNT(*)::int as total, COUNT(*) FILTER (WHERE status = 'COMPLIANT')::int as compliant FROM compliance_classification GROUP BY framework").catch(() => null);
      const total = await query("SELECT COUNT(*)::int as count FROM compliance_classification").catch(() => null);
      const data = frameworks?.rows || [];
      return JSON.stringify({
        totalItems: total?.rows[0]?.count || 0,
        frameworks: data.length ? data : [],
        summary: data.map((f: any) => `${f.framework}: ${f.compliant}/${f.total} compliant`).join("\n") || "No compliance data available",
      });
    }
    case "get_compliance_by_framework": {
      const result = await query(
        "SELECT * FROM compliance_classification WHERE framework ILIKE $1 LIMIT 20",
        [`%${args.framework}%`]
      ).catch(() => null);
      return JSON.stringify(result?.rows || []);
    }
    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}
