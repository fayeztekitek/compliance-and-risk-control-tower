import { llmService, ChatMessage, ChatOptions } from "../llm.service.js";
import { ragService } from "../rag.service.js";
import { env } from "../../../config/env.js";
import { query } from "../../../config/database.js";

export interface CopilotDefinition {
  id: string;
  label: string;
  description: string;
  icon: string;
  systemPrompt: string;
  mockResponse: (q: string) => string;
}

const COPPILOT_DEFS: Record<string, CopilotDefinition> = {
  executive: {
    id: "executive",
    label: "Executive Copilot",
    description: "Executive dashboard insights, KPIs, risks, and strategic overview",
    icon: "📊",
    systemPrompt: `You are the Executive Copilot for Control Tower. You provide strategic insights from executive dashboards: KPIs, risk trends, organizational health, and top-level metrics. Be concise and focus on actionable executive summaries. Always cite specific numbers when available.`,
    mockResponse: (q) => `[Executive Copilot] I would analyze "${q}" against executive KPIs — compliance scores, vulnerability trends, org risk heatmap, and SLA breach rates. Check the Executive Dashboard for real-time metrics.`,
  },
  compliance: {
    id: "compliance",
    label: "Compliance Copilot",
    description: "Framework mappings, control assessments, compliance posture",
    icon: "🛡️",
    systemPrompt: `You are the Compliance Copilot for Control Tower. You help users understand compliance posture across SOC 2, ISO 27001, PCI DSS, and other frameworks. Reference framework mappings, control effectiveness rates, and non-conformity counts. Be precise and cite specific numbers.`,
    mockResponse: (q) => `[Compliance Copilot] I would analyze "${q}" against framework mappings, control pass/fail rates, and breach data. Check the Compliance Dashboard for real-time posture.`,
  },
  security: {
    id: "security",
    label: "Security Copilot",
    description: "Vulnerability management, CVE tracking, scanner integration",
    icon: "🔒",
    systemPrompt: `You are the Security Copilot for Control Tower. You analyze vulnerabilities from Nexus IQ, Fortify, SonarQube, Veracode, and other scanners. Prioritize by severity, CVSS score, and EPSS. Suggest remediation priorities. Be data-driven and cite specific vulnerabilities.`,
    mockResponse: (q) => `[Security Copilot] I would analyze "${q}" against vulnerability data from all scanners — severity distribution, CVSS scores, EPSS, and component-level risk. Check the Risk Dashboard for details.`,
  },
  audit: {
    id: "audit",
    label: "Audit Copilot",
    description: "Audit planning, findings, CAPA tracking",
    icon: "📋",
    systemPrompt: `You are the Audit Copilot for Control Tower. You help with audit planning, finding analysis, and CAPA tracking. Reference audit schedules, finding severity, and corrective action status. Be thorough and cite specific audit IDs.`,
    mockResponse: (q) => `[Audit Copilot] I would analyze "${q}" against audit schedules, finding severity distribution, and CAPA completion rates. Check the Audit Dashboard for current status.`,
  },
  roadmap: {
    id: "roadmap",
    label: "Roadmap Copilot",
    description: "Project roadmaps, milestones, strategic planning",
    icon: "🗺️",
    systemPrompt: `You are the Roadmap Copilot for Control Tower. You help with project roadmaps, milestone tracking, budget consumption, and go-live readiness. Provide timeline summaries and flag at-risk items. Be concise and reference specific projects.`,
    mockResponse: (q) => `[Roadmap Copilot] I would analyze "${q}" against project roadmaps — milestone progress, budget consumption, and go-live readiness. Check the Roadmaps Dashboard for details.`,
  },
  veg: {
    id: "veg",
    label: "VEG Copilot",
    description: "Deal register, governance workflow, investment decisions",
    icon: "💼",
    systemPrompt: `You are the VEG Governance Copilot for Control Tower. You help with investment deal analysis, workflow request tracking, and committee decision summaries. Reference financial metrics (TCV, PS) and decision outcomes. Be precise with numbers.`,
    mockResponse: (q) => `[VEG Copilot] I would analyze "${q}" against the deal register — TCV totals, decision breakdowns, and workflow request statuses. Check the VEG Governance workspace for details.`,
  },
  privacy: {
    id: "privacy",
    label: "Privacy Copilot",
    description: "GDPR compliance, privacy assessments, data protection",
    icon: "🔐",
    systemPrompt: `You are the Privacy Copilot for Control Tower. You help with GDPR compliance, privacy impact assessments, data protection measures, and privacy-by-design reviews. Reference specific regulations and assessment statuses.`,
    mockResponse: (q) => `[Privacy Copilot] I would analyze "${q}" against privacy assessments, GDPR compliance status, and data protection measures. Check the Privacy dashboard for current posture.`,
  },
  reporting: {
    id: "reporting",
    label: "Reporting Copilot",
    description: "Generate reports, export data, summarize findings",
    icon: "📄",
    systemPrompt: `You are the Reporting Copilot for Control Tower. You help generate reports, export dashboards to CSV/PDF, and summarize findings across domains. Understand report templates and available data sources. Be helpful and guide users to the right export tools.`,
    mockResponse: (q) => `[Reporting Copilot] I would help "${q}" by generating reports from available data sources. You can also use the Export button on any dashboard for CSV downloads.`,
  },
};

export const COPILOT_DEFINITIONS = COPPILOT_DEFS;

export type CopilotType = keyof typeof COPILOT_DEFINITIONS;

export const copilotService = {
  list() {
    return Object.entries(COPILOT_DEFINITIONS).map(([id, def]) => ({
      id, label: def.label, description: def.description, icon: def.icon,
    }));
  },

  async chat(type: CopilotType, messages: ChatMessage[], options: ChatOptions = {}) {
    const copilot = COPILOT_DEFINITIONS[type];
    if (!copilot) throw new Error(`Unknown copilot: ${type}`);

    const lastUserMsg = [...messages].reverse().find(m => m.role === "user");
    let ragContext = "";

    if (lastUserMsg && env.GEMINI_API_KEY) {
      try {
        const result = await ragService.buildContext(lastUserMsg.content, { topK: 3, maxChars: 3000 });
        if (result.context) ragContext = result.context;
      } catch { }
    }

    const systemPrompt = ragContext
      ? `${copilot.systemPrompt}\n\n${ragContext}`
      : copilot.systemPrompt;

    if (!env.GEMINI_API_KEY) {
      return this.mockChat(copilot, messages, options.stream);
    }

    const withSystem: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    return llmService.chat(withSystem, options);
  },

  mockChat(copilot: CopilotDefinition, messages: ChatMessage[], stream = false) {
    const lastUserMsg = [...messages].reverse().find(m => m.role === "user");
    const text = copilot.mockResponse(lastUserMsg?.content || "");

    if (stream) {
      const chunks = text.split(" ");
      return {
        async *[Symbol.asyncIterator]() {
          for (const chunk of chunks) {
            yield { text: chunk + " " };
            await new Promise(r => setTimeout(r, 20));
          }
        },
      };
    }
    return text;
  },
};
