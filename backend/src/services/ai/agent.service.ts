import { env } from "../../config/env.js";
import { logger } from "../../core/logger.js";
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

    return finalText || "I processed your request but don't have enough data to provide a detailed response. Try asking a more specific question.";
  },

  async handleStreamWithTools(streamResult: any, agent: typeof AGENT_DEFINITIONS[AgentType]) {
    return {
      async *[Symbol.asyncIterator]() {
        for await (const chunk of streamResult) {
          if (chunk.text) yield { text: chunk.text };
          if (chunk.functionCall) {
            const fc = chunk.functionCall;
            yield { text: `\n[Calling tool: ${fc.name}...]\n` };
          }
        }
      },
    };
  },

  mockChat(agentType: AgentType, messages: AgentMessage[], _stream = false) {
    const agent = AGENT_DEFINITIONS[agentType];
    const lastUserMsg = [...messages].reverse().find(m => m.role === "user");
    const query = lastUserMsg?.content || "";

    const mockResponses: Record<string, string> = {
      compliance: `As the Compliance Agent, I'd analyze your query about "${query}". In production, I would query the compliance database for framework mappings, control effectiveness rates, and non-conformity counts. For now, check the Compliance Dashboard for real-time posture data.`,
      risk: `As the Risk Analyst Agent, I'd analyze your query about "${query}". In production, I would query vulnerability counts by severity, component security data, SLA breach rates, and EPSS scores. Check the Risk Dashboard for current metrics.`,
      veg: `As the VEG Governance Agent, I'd analyze your query about "${query}". In production, I would query the deal register for TCV totals, decision breakdowns, and workflow request statuses. Check the VEG Governance workspace for detailed data.`,
    };

    const text = mockResponses[agentType] || `Agent processing "${query}". In production, I would execute tool calls against live APIs to provide data-driven answers.`;

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
    }));
  },
};
