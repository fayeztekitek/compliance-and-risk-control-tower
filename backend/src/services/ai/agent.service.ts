import { env } from "../../config/env.js";
import { logger } from "../../core/logger.js";
import { query } from "../../config/database.js";
import { randomUUID } from "crypto";
import { ioRedis } from "../redis.js";
import { AGENT_DEFINITIONS, AgentType } from "./tools/index.js";

let genai: any = null;
try {
  const { GoogleGenAI } = await import("@google/genai");
  genai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
} catch (err) {
  logger.warn({ err }, "Failed to initialize Google GenAI SDK for agents — mock fallback");
}

interface AgentMessage {
  role: "user" | "assistant" | "model";
  content: string;
}

const MEMORY_TTL = 60 * 60 * 24 * 7; // 7 days

export const agentService = {
  async chat(agentType: AgentType, messages: AgentMessage[], options: { stream?: boolean } = {}) {
    const agent = AGENT_DEFINITIONS[agentType];
    if (!agent) throw new Error(`Unknown agent type: ${agentType}`);

    if (!genai || !env.GEMINI_API_KEY) {
      return this.mockChat(agentType, messages, options.stream);
    }

    const contents = messages.map(m => ({
      role: m.role === "assistant" ? "model" : m.role,
      parts: [{ text: m.content }],
    }));

    const config: any = {
      systemInstruction: agent.systemPrompt,
      temperature: 0.3,
      maxOutputTokens: 4096,
      tools: [{
        functionDeclarations: agent.declarations,
      }],
    };

    try {
      if (options.stream) {
        const streamResult = await genai.models.generateContentStream({
          model: env.GEMINI_MODEL,
          contents,
          config,
        });
        return this.handleStreamWithTools(streamResult, agent);
      }

      const response = await genai.models.generateContent({
        model: env.GEMINI_MODEL,
        contents,
        config,
      });

      return this.handleToolCalls(response, agent, messages);
    } catch (err) {
      logger.error({ err, agentType }, "Agent call failed — falling back to mock");
      return this.mockChat(agentType, messages, options.stream);
    }
  },

  async handleToolCalls(response: any, agent: typeof AGENT_DEFINITIONS[AgentType], messages: AgentMessage[]) {
    const candidate = response.candidates?.[0];
    if (!candidate) return response.text || "No response generated.";

    const parts = candidate.content?.parts || [];
    let finalText = "";

    for (const part of parts) {
      if (part.text) {
        finalText += part.text;
      } else if (part.functionCall) {
        const fc = part.functionCall;
        logger.info({ tool: fc.name, args: fc.args }, "Agent executing tool call");
        try {
          const result = await agent.handler(fc.name, fc.args || {});
          const toolResponse = await genai.models.generateContent({
            model: env.GEMINI_MODEL,
            contents: [
              ...messages.map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
              { role: "model", parts: [{ functionCall: { name: fc.name, args: fc.args } }] },
              { role: "user", parts: [{ functionResponse: { name: fc.name, response: { response: JSON.parse(result) } } }] },
            ],
            config: {
              systemInstruction: agent.systemPrompt,
              temperature: 0.3,
              maxOutputTokens: 4096,
              tools: [{ functionDeclarations: agent.declarations }],
            },
          });
          finalText += toolResponse.text || "";
        } catch (err: any) {
          finalText += `\n\nError executing tool '${fc.name}': ${err.message}`;
        }
      }
    }

    return finalText || "I processed your request but don't have enough data to provide a detailed response.";
  },

  async handleStreamWithTools(streamResult: any, agent: typeof AGENT_DEFINITIONS[AgentType]) {
    return {
      async *[Symbol.asyncIterator]() {
        for await (const chunk of streamResult) {
          if (chunk.text) yield { text: chunk.text };
          if (chunk.functionCall) {
            yield { text: `\n[Calling tool: ${chunk.functionCall.name}...]\n` };
          }
        }
      },
    };
  },

  mockChat(agentType: AgentType, messages: AgentMessage[], _stream = false) {
    const agent = AGENT_DEFINITIONS[agentType];
    const lastUserMsg = [...messages].reverse().find(m => m.role === "user");
    const query = lastUserMsg?.content || "";

    const text = `As the ${agent.label}, I'd analyze your query about "${query}". In production, I would execute tool calls against live data to provide data-driven answers.`;

    if (_stream) {
      return {
        async *[Symbol.asyncIterator]() {
          for (const word of text.split(" ")) {
            yield { text: word + " " };
            await new Promise(r => setTimeout(r, 20));
          }
        },
      };
    }
    return text;
  },

  async listAgents() {
    return Object.entries(AGENT_DEFINITIONS).map(([key, def]) => ({
      id: key,
      name: def.label,
      description: def.description,
      icon: def.icon,
      cronSchedule: def.cronSchedule,
    }));
  },

  // --- Memory (Redis) ---
  async getMemory(agentType: string, key: string): Promise<string | null> {
    try {
      return await ioRedis.get(`agent:mem:${agentType}:${key}`);
    } catch { return null; }
  },

  async setMemory(agentType: string, key: string, value: string) {
    try {
      await ioRedis.setex(`agent:mem:${agentType}:${key}`, MEMORY_TTL, value);
    } catch { }
  },

  async getState(agentType: string): Promise<Record<string, string>> {
    try {
      const keys = await ioRedis.keys(`agent:mem:${agentType}:*`);
      if (!keys.length) return {};
      const values = await ioRedis.mget(keys);
      const result: Record<string, string> = {};
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i].replace(`agent:mem:${agentType}:`, "");
        if (values[i]) result[k] = values[i];
      }
      return result;
    } catch { return {}; }
  },

  // --- Run Logs ---
  async logRunStart(agentType: string, triggerType: string, inputSummary?: string): Promise<string> {
    const id = `arl_${randomUUID().slice(0, 8)}`;
    await query(
      `INSERT INTO agent_run_logs (id, agent_type, status, trigger_type, input_summary) VALUES ($1, $2, 'running', $3, $4)`,
      [id, agentType, triggerType, inputSummary || null]
    );
    return id;
  },

  async logRunComplete(runId: string, outputSummary: string, durationMs: number) {
    await query(
      `UPDATE agent_run_logs SET status = 'completed', finished_at = NOW(), duration_ms = $1, output_summary = $2 WHERE id = $3`,
      [durationMs, outputSummary, runId]
    );
  },

  async logRunError(runId: string, errorMessage: string, durationMs: number) {
    await query(
      `UPDATE agent_run_logs SET status = 'failed', finished_at = NOW(), duration_ms = $1, error_message = $2 WHERE id = $3`,
      [durationMs, errorMessage, runId]
    );
  },

  async getRunLogs(agentType?: string, page = 1, limit = 20) {
    const params: any[] = [];
    let idx = 1;
    let where = "";
    if (agentType) { where = `WHERE agent_type = $${idx++}`; params.push(agentType); }

    const count = await query(`SELECT COUNT(*) FROM agent_run_logs ${where}`, params);
    const offset = (page - 1) * limit;
    params.push(limit, offset);
    const data = await query(
      `SELECT id, created_at, agent_type, status, started_at, finished_at, duration_ms, trigger_type, input_summary, error_message
       FROM agent_run_logs ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
      params
    );
    return {
      data: data.rows.map(r => ({ ...r, createdAt: r.created_at, agentType: r.agent_type, triggerType: r.trigger_type, inputSummary: r.input_summary, errorMessage: r.error_message, durationMs: r.duration_ms })),
      total: parseInt(count.rows[0].count, 10), page, limit,
    };
  },

  // --- Recommendations ---
  async createRecommendation(agentType: string, runId: string, title: string, description: string, severity = "info", category?: string, actionUrl?: string) {
    const id = `arec_${randomUUID().slice(0, 8)}`;
    await query(
      `INSERT INTO agent_recommendations (id, agent_type, run_id, title, description, severity, category, action_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, agentType, runId, title, description, severity, category || null, actionUrl || null]
    );
    return id;
  },

  async getRecommendations(agentType?: string, unreadOnly = false, page = 1, limit = 20) {
    const params: any[] = [];
    let idx = 1;
    const conds: string[] = ["is_dismissed = FALSE"];
    if (agentType) { conds.push(`agent_type = $${idx++}`); params.push(agentType); }
    if (unreadOnly) { conds.push("is_read = FALSE"); }

    const where = `WHERE ${conds.join(" AND ")}`;
    const count = await query(`SELECT COUNT(*) FROM agent_recommendations ${where}`, params);
    const offset = (page - 1) * limit;
    params.push(limit, offset);
    const data = await query(
      `SELECT id, created_at, agent_type, run_id, title, description, severity, category, is_read, is_dismissed, action_url
       FROM agent_recommendations ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
      params
    );
    return {
      data: data.rows.map(r => ({ ...r, createdAt: r.created_at, agentType: r.agent_type, runId: r.run_id, isRead: r.is_read, isDismissed: r.is_dismissed, actionUrl: r.action_url })),
      total: parseInt(count.rows[0].count, 10), page, limit,
    };
  },

  async markRecommendationRead(id: string) {
    await query("UPDATE agent_recommendations SET is_read = TRUE WHERE id = $1", [id]);
  },

  async dismissRecommendation(id: string) {
    await query("UPDATE agent_recommendations SET is_dismissed = TRUE WHERE id = $1", [id]);
  },

  // --- Autonomous Run ---
  async runAutonomous(agentType: AgentType, triggerType = "scheduled") {
    const agent = AGENT_DEFINITIONS[agentType];
    if (!agent) throw new Error(`Unknown agent: ${agentType}`);

    const runId = await this.logRunStart(agentType, triggerType, `Autonomous ${agent.label} run`);
    const startTime = Date.now();

    try {
      const state = await this.getState(agentType);
      const stateStr = Object.keys(state).length ? `\n\nCurrent state from memory:\n${JSON.stringify(state, null, 2)}` : "";

      const result = await this.chat(agentType, [
        { role: "user", content: `Run your scheduled analysis. Review the current data and provide insights and recommendations.${stateStr}` },
      ]);

      const text = typeof result === "string" ? result : "Run completed.";
      const durationMs = Date.now() - startTime;
      await this.logRunComplete(runId, text, durationMs);

      await this.setMemory(agentType, "last_run_result", text.slice(0, 500));
      await this.setMemory(agentType, "last_run_at", new Date().toISOString());

      if (text.length > 50) {
        await this.createRecommendation(agentType, runId, `${agent.label} — Weekly Insights`, text.slice(0, 500), "info", agentType);
      }

      return { runId, text };
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      await this.logRunError(runId, err.message, durationMs);
      throw err;
    }
  },
};
