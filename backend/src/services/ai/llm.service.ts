import { env } from "../../config/env.js";
import { logger } from "../../core/logger.js";

let genai: any = null;
try {
  const { GoogleGenAI } = await import("@google/genai");
  genai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
} catch (err) {
  logger.warn({ err }, "Failed to initialize Google GenAI SDK — mock fallback enabled");
}

const SYSTEM_PROMPT = `You are an expert GRC (Governance, Risk & Compliance) Copilot for an enterprise platform called "Control Tower". You help users understand their compliance posture, security vulnerabilities, risk metrics, audit findings, governance decisions (VEG deals), and more.

Available data domains in this platform:
- Compliance: compliance scores, framework mappings, control assessments
- Risk: risk registers, risk scores, mitigation status
- Audit: audit findings, remediation plans
- Security: vulnerability management, CVE tracking, nexus IQ analysis
- VEG Governance: deal register (investment decisions), workflow requests (RFI/RFP/Bid committees)
- Committees: governance committee decisions and minutes
- Roadmaps: project roadmaps and milestones
- SaaS: SaaS product portfolio

Be concise, professional, and data-driven. When you don't have specific data, explain what data would be needed and suggest how to find it. Never make up specific numbers. If asked about tasks you cannot perform, politely explain your limitations.`;

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatOptions {
  temperature?: number;
  maxOutputTokens?: number;
  stream?: boolean;
}

export const llmService = {
  async chat(messages: ChatMessage[], options: ChatOptions = {}) {
    const { temperature = 0.7, maxOutputTokens = 2048, stream = false } = options;

    if (!genai || !env.GEMINI_API_KEY) {
      return this.mockChat(messages, stream);
    }

    const contents = messages.map(m => ({
      role: m.role === "system" ? "user" : m.role,
      parts: [{ text: m.content }],
    }));

    const systemInstruction = messages.find(m => m.role === "system")?.content || SYSTEM_PROMPT;

    try {
      if (stream) {
        const streamResult = await genai.models.generateContentStream({
          model: env.GEMINI_MODEL,
          contents,
          config: {
            systemInstruction,
            temperature,
            maxOutputTokens,
          },
        });
        return streamResult;
      }

      const response = await genai.models.generateContent({
        model: env.GEMINI_MODEL,
        contents,
        config: {
          systemInstruction,
          temperature,
          maxOutputTokens,
        },
      });
      return response.text;
    } catch (err) {
      logger.error({ err }, "Gemini API call failed — falling back to mock");
      return this.mockChat(messages, stream);
    }
  },

  async listModels() {
    if (!genai || !env.GEMINI_API_KEY) {
      return [{ name: "mock-gemini", displayName: "Mock Gemini (no API key)" }];
    }
    const result = await genai.models.list();
    return (result.models || []).map((m: any) => ({
      name: m.name,
      displayName: m.displayName || m.name,
    }));
  },

  mockChat(messages: ChatMessage[], _stream = false) {
    const lastUserMsg = [...messages].reverse().find(m => m.role === "user");
    const query = lastUserMsg?.content || "";

    if (_stream) {
      const text = this.generateMockResponse(query);
      return {
        async *[Symbol.asyncIterator]() {
          for (const chunk of splitIntoChunks(text, 5)) {
            yield { text: chunk };
            await new Promise(r => setTimeout(r, 30));
          }
        },
      };
    }

    return this.generateMockResponse(query);
  },

  generateMockResponse(query: string): string {
    const q = query.toLowerCase();
    if (q.includes("compliance") || q.includes("audit")) {
      return `Based on the available compliance data, I can help you analyze your compliance posture across multiple frameworks (SOC 2, ISO 27001, PCI DSS). To provide specific metrics, I would query the compliance dashboard API. You can also check the Compliance Dashboard for a real-time view of control effectiveness and framework coverage.`;
    }
    if (q.includes("risk") || q.includes("vulnerability") || q.includes("cve")) {
      return `I can help analyze your risk and vulnerability posture. The platform tracks vulnerabilities from Nexus IQ, Fortify, SonarQube, and Veracode. For a comprehensive view, check the Risk Dashboard which shows severity distribution, mitigation status, and trending over time.`;
    }
    if (q.includes("deal") || q.includes("veg") || q.includes("investment")) {
      return `The VEG Governance module tracks committee investment decisions. You can view the Deal Register for all reviewed deals with TCV, PS, and decision outcomes. The Workflow Requests section tracks the lifecycle of governance requests (RFI, RFP, Bid Committees).`;
    }
    if (q.includes("hello") || q.includes("hi")) {
      return `Hello! I'm your GRC Copilot. I can help with compliance, risk, security, audit, and governance questions. What would you like to explore?`;
    }
    return `I understand you're asking about "${query}". To give you a precise answer, I would need to query the relevant domain APIs. You can navigate to the specific dashboard for detailed data, or let me know which domain you'd like to explore further.`;
  },
};

function splitIntoChunks(text: string, wordsPerChunk: number): string[] {
  const words = text.split(" ");
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += wordsPerChunk) {
    chunks.push(words.slice(i, i + wordsPerChunk).join(" "));
  }
  return chunks;
}
