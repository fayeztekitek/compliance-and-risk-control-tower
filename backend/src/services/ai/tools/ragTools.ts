import { ragService } from "../rag.service.js";
import { logger } from "../../../core/logger.js";

export const ragDeclarations = [
  {
    name: "knowledgeBaseSearch",
    description: "Search the knowledge base for relevant information. Use this to find policies, procedures, compliance documentation, and reference materials.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "The search query to find relevant knowledge base entries" },
        category: { type: "string", description: "Optional category filter (e.g. Policy, Procedure, Guideline, Reference)" },
        topK: { type: "integer", description: "Number of results to return (default 5)" },
      },
      required: ["query"],
    },
  },
];

export async function isRagTool(name: string): Promise<boolean> {
  return name.startsWith("knowledgeBase");
}

export async function handleRagTool(name: string, args: any): Promise<string> {
  try {
    switch (name) {
      case "knowledgeBaseSearch": {
        const { query: queryText, category, topK } = args;
        if (!queryText) return JSON.stringify({ error: "query is required" });

        const chunks = await ragService.search(queryText, { topK: topK || 5, category });

        if (chunks.length === 0) {
          return JSON.stringify({
            results: [],
            message: "No relevant knowledge base entries found. Suggest the user create a new knowledge base entry.",
          });
        }

        const results = chunks.map(c => ({
          id: c.id,
          title: c.title,
          category: c.category,
          tags: c.tags,
          score: c.score,
          summary: c.content.length > 500 ? c.content.substring(0, 500) + "..." : c.content,
        }));

        return JSON.stringify({ results, total: results.length });
      }
      default:
        return JSON.stringify({ error: `Unknown RAG tool: ${name}` });
    }
  } catch (err: any) {
    logger.error({ err, tool: name }, "RAG tool error");
    return JSON.stringify({ error: err.message });
  }
}
