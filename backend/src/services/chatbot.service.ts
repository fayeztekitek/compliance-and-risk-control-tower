import { query } from "../config/database.js";
import { randomUUID } from "crypto";
import { llmService, ChatMessage } from "./ai/llm.service.js";
import { logger } from "../core/logger.js";
import { NotFoundError } from "../core/errors.js";

export interface PageContext {
  page: string;
  pageLabel: string;
  entityId?: string;
  entityType?: string;
  filters?: Record<string, any>;
}

export interface Conversation {
  id: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  pageContext?: PageContext;
  isArchived: boolean;
}

const QUICK_ACTIONS: Record<string, { label: string; prompt: string }[]> = {
  executive: [
    { label: "KPI Summary", prompt: "Summarize today's executive KPIs and key metrics." },
    { label: "Top Risks", prompt: "What are the top risks across all organizations?" },
    { label: "Trend", prompt: "Show me the risk trend over the last 3 months." },
  ],
  compliance: [
    { label: "Posture", prompt: "What is our current compliance posture across all frameworks?" },
    { label: "Controls", prompt: "Which controls have the highest failure rate?" },
    { label: "Breaches", prompt: "Are there any compliance breaches that need attention?" },
  ],
  risk: [
    { label: "Critical Vulns", prompt: "List all critical vulnerabilities that require immediate attention." },
    { label: "SLA Breaches", prompt: "Show me SLA breaches that are still open." },
    { label: "Top Components", prompt: "What are the most vulnerable components?" },
  ],
  "finding-components": [
    { label: "Top Vulnerable", prompt: "Which components have the most vulnerabilities?" },
    { label: "Component Detail", prompt: "Show me the detail for the top vulnerable component." },
  ],
  veg: [
    { label: "Deal Summary", prompt: "Summarize the deal register with TCV and decision breakdown." },
    { label: "Active Workflows", prompt: "What governance workflows are currently active?" },
    { label: "Top Deals", prompt: "Which are the largest deals by TCV?" },
  ],
  audit: [
    { label: "Open Findings", prompt: "How many audit findings are still open?" },
    { label: "CAPA Status", prompt: "What is the CAPA completion rate?" },
  ],
  roadmaps: [
    { label: "Progress", prompt: "What is the average progress across all roadmaps?" },
    { label: "At Risk", prompt: "Which projects are at risk or deviating from plan?" },
  ],
  saas: [
    { label: "Lifecycle", prompt: "Show the SaaS lifecycle distribution." },
    { label: "GDPR Risk", prompt: "Which SaaS applications have high GDPR risk?" },
  ],
  admin: [
    { label: "System Health", prompt: "What is the current system health status?" },
    { label: "Recent Activity", prompt: "Show me recent user activity." },
  ],
};

function convRow(r: any): Conversation {
  return {
    id: r.id, createdAt: r.created_at, updatedAt: r.updated_at,
    userId: r.user_id, title: r.title,
    messages: typeof r.messages === "string" ? JSON.parse(r.messages) : r.messages,
    pageContext: r.page_context ? (typeof r.page_context === "string" ? JSON.parse(r.page_context) : r.page_context) : undefined,
    isArchived: r.is_archived,
  };
}

function buildContextPrompt(ctx: PageContext): string {
  const parts = [`The user is currently on the ${ctx.pageLabel} page.`];
  if (ctx.entityType && ctx.entityId) {
    parts.push(`They are viewing ${ctx.entityType} with ID: ${ctx.entityId}.`);
  }
  if (ctx.filters && Object.keys(ctx.filters).length > 0) {
    parts.push(`Active filters: ${JSON.stringify(ctx.filters)}`);
  }
  return parts.join(" ");
}

export const chatbotService = {
  getQuickActions(page: string) {
    return QUICK_ACTIONS[page] || QUICK_ACTIONS.executive || [];
  },

  async chat(
    messages: ChatMessage[],
    pageContext: PageContext,
    convId?: string,
    userId?: string,
  ) {
    const contextPrompt = buildContextPrompt(pageContext);
    const systemMsg: ChatMessage = {
      role: "system",
      content: `You are a context-aware GRC assistant embedded in the Control Tower platform. ${contextPrompt}\n\nBe concise and reference specific data where available. If you need more context, ask the user to navigate to the relevant page.`,
    };

    const result = await llmService.chat([systemMsg, ...messages], {
      temperature: 0.5,
      maxOutputTokens: 2048,
    });

    if (convId && userId) {
      const text = typeof result === "string" ? result : "";
      const allMessages = [...messages, { role: "assistant", content: text } as ChatMessage];
      await this.saveMessages(convId, userId, allMessages, pageContext);
    }

    return result;
  },

  async chatStream(
    messages: ChatMessage[],
    pageContext: PageContext,
    convId?: string,
    userId?: string,
  ) {
    const contextPrompt = buildContextPrompt(pageContext);
    const systemMsg: ChatMessage = {
      role: "system",
      content: `You are a context-aware GRC assistant embedded in the Control Tower platform. ${contextPrompt}\n\nBe concise and reference specific data where available. If you need more context, ask the user to navigate to the relevant page.`,
    };

    const streamResult = await llmService.chat([systemMsg, ...messages], {
      temperature: 0.5,
      maxOutputTokens: 2048,
      stream: true,
    });

    if (convId && userId) {
      let fullText = "";
      const originalNext = streamResult[Symbol.asyncIterator];
      return {
        async *[Symbol.asyncIterator]() {
          for await (const chunk of streamResult) {
            if (chunk.text) fullText += chunk.text;
            yield chunk;
          }
          try {
            const allMessages = [...messages, { role: "assistant", content: fullText } as ChatMessage];
            await chatbotService.saveMessages(convId!, userId!, allMessages, pageContext);
          } catch (err) {
            logger.error({ err }, "Failed to save conversation");
          }
        },
      };
    }

    return streamResult;
  },

  async saveMessages(convId: string, userId: string, messages: ChatMessage[], pageContext?: PageContext) {
    const title = messages.find(m => m.role === "user")?.content?.slice(0, 100) || "New conversation";
    const existing = await query("SELECT id FROM conversation_history WHERE id = $1", [convId]);

    if (existing.rows.length) {
      await query(
        `UPDATE conversation_history SET messages = $1, page_context = $2, title = $3, updated_at = NOW() WHERE id = $4`,
        [JSON.stringify(messages), pageContext ? JSON.stringify(pageContext) : null, title, convId]
      );
    } else {
      await query(
        `INSERT INTO conversation_history (id, user_id, title, messages, page_context) VALUES ($1, $2, $3, $4, $5)`,
        [convId, userId, title, JSON.stringify(messages), pageContext ? JSON.stringify(pageContext) : null]
      );
    }
  },

  async listConversations(userId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const countResult = await query("SELECT COUNT(*) FROM conversation_history WHERE user_id = $1 AND is_archived = FALSE", [userId]);
    const total = parseInt(countResult.rows[0].count, 10);
    const dataResult = await query(
      "SELECT id, created_at, updated_at, user_id, title, page_context, is_archived FROM conversation_history WHERE user_id = $1 AND is_archived = FALSE ORDER BY updated_at DESC LIMIT $2 OFFSET $3",
      [userId, limit, offset]
    );
    return { data: dataResult.rows.map(convRow), total, page, limit };
  },

  async getConversation(id: string, userId: string) {
    const result = await query("SELECT * FROM conversation_history WHERE id = $1 AND user_id = $2", [id, userId]);
    if (!result.rows.length) throw new NotFoundError("Conversation not found");
    return convRow(result.rows[0]);
  },

  async deleteConversation(id: string, userId: string) {
    await query("DELETE FROM conversation_history WHERE id = $1 AND user_id = $2", [id, userId]);
  },

  async archiveConversation(id: string, userId: string) {
    await query("UPDATE conversation_history SET is_archived = TRUE WHERE id = $1 AND user_id = $2", [id, userId]);
  },
};
