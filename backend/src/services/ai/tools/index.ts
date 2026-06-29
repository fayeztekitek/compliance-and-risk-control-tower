import { complianceDeclarations, handleComplianceTool } from "./complianceTools.js";
import { riskDeclarations, handleRiskTool } from "./riskTools.js";
import { vegDeclarations, handleVegTool } from "./vegTools.js";

export const AGENT_DEFINITIONS: Record<string, {
  label: string;
  description: string;
  icon: string;
  systemPrompt: string;
  declarations: any[];
  handler: (name: string, args: any) => Promise<string>;
}> = {
  compliance: {
    label: "Compliance Agent",
    description: "Analyze compliance posture, framework mappings, and control effectiveness",
    icon: "🛡️",
    systemPrompt: "You are a Compliance Analysis Agent. You help users understand their compliance posture across SOC 2, ISO 27001, PCI DSS, and other frameworks. Use the available tools to fetch real compliance data. Always cite specific numbers when available. If a tool returns no data, explain what would need to be configured.",
    declarations: complianceDeclarations,
    handler: handleComplianceTool,
  },
  risk: {
    label: "Risk Analyst Agent",
    description: "Analyze vulnerabilities, risk metrics, and component security",
    icon: "⚠️",
    systemPrompt: "You are a Risk Analysis Agent. You help users understand their vulnerability landscape, risk metrics, and component security posture. Use the available tools to fetch real vulnerability and risk data. Prioritize critical and high-severity items in your analysis. Suggest remediation priorities based on data.",
    declarations: riskDeclarations,
    handler: handleRiskTool,
  },
  veg: {
    label: "VEG Governance Agent",
    description: "Analyze VEG deal register and workflow requests",
    icon: "💼",
    systemPrompt: "You are a VEG Governance Agent. You help users understand their investment deal register and governance workflow requests. Use the available tools to fetch real VEG data. Summarize financial metrics (TCV, PS, etc.) and highlight key decisions.",
    declarations: vegDeclarations,
    handler: handleVegTool,
  },
};

export type AgentType = keyof typeof AGENT_DEFINITIONS;
