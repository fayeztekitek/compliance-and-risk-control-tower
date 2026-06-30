import { complianceDeclarations, handleComplianceTool } from "./complianceTools.js";
import { riskDeclarations, handleRiskTool } from "./riskTools.js";
import { vegDeclarations, handleVegTool } from "./vegTools.js";
import { executiveDeclarations, handleExecutiveTool } from "./executiveTools.js";
import { securityDeclarations, handleSecurityTool } from "./securityTools.js";
import { auditDeclarations, handleAuditTool } from "./auditTools.js";
import { roadmapDeclarations, handleRoadmapTool } from "./roadmapTools.js";
import { privacyDeclarations, handlePrivacyTool } from "./privacyTools.js";
import { reportingDeclarations, handleReportingTool } from "./reportingTools.js";

export const AGENT_DEFINITIONS: Record<string, {
  label: string;
  description: string;
  icon: string;
  systemPrompt: string;
  declarations: any[];
  handler: (name: string, args: any) => Promise<string>;
  cronSchedule?: string;
}> = {
  executive: {
    label: "Executive Agent",
    description: "Executive KPIs, org risk heatmap, top risky applications",
    icon: "📊",
    systemPrompt: "You are the Executive Agent for Control Tower. You provide strategic insights from executive dashboards: KPIs, risk trends, organizational health, and top-level metrics. Use the available tools to fetch real data. Be concise and focus on actionable executive summaries. Always cite specific numbers when available.",
    declarations: executiveDeclarations,
    handler: handleExecutiveTool,
    cronSchedule: "0 7 * * 1",
  },
  compliance: {
    label: "Compliance Agent",
    description: "Compliance posture, framework mappings, control effectiveness",
    icon: "🛡️",
    systemPrompt: "You are a Compliance Analysis Agent. You help users understand their compliance posture across SOC 2, ISO 27001, PCI DSS, and other frameworks. Use the available tools to fetch real compliance data. Always cite specific numbers when available.",
    declarations: complianceDeclarations,
    handler: handleComplianceTool,
    cronSchedule: "0 8 * * 1",
  },
  risk: {
    label: "Risk Analyst Agent",
    description: "Vulnerability landscape, risk metrics, component security",
    icon: "⚠️",
    systemPrompt: "You are a Risk Analysis Agent. You help users understand their vulnerability landscape, risk metrics, and component security posture. Use the available tools to fetch real vulnerability and risk data. Prioritize critical and high-severity items. Suggest remediation priorities.",
    declarations: riskDeclarations,
    handler: handleRiskTool,
    cronSchedule: "0 6 * * *",
  },
  security: {
    label: "Security Agent",
    description: "Vulnerability summary, scanner breakdown, component vulnerabilities",
    icon: "🔒",
    systemPrompt: "You are a Security Agent for Control Tower. You analyze vulnerabilities from all scanners. Use the available tools to fetch real vulnerability data. Prioritize by severity and provide actionable remediation guidance.",
    declarations: securityDeclarations,
    handler: handleSecurityTool,
    cronSchedule: "0 6 * * *",
  },
  audit: {
    label: "Audit Agent",
    description: "Audit findings, CAPA tracking, compliance audits",
    icon: "📋",
    systemPrompt: "You are an Audit Agent for Control Tower. You help with audit planning, finding analysis, and CAPA tracking. Use the available tools to fetch real audit data. Reference specific findings and corrective actions.",
    declarations: auditDeclarations,
    handler: handleAuditTool,
    cronSchedule: "0 9 * * 1",
  },
  roadmap: {
    label: "Roadmap Agent",
    description: "Project roadmaps, milestones, at-risk projects",
    icon: "🗺️",
    systemPrompt: "You are a Roadmap Agent for Control Tower. You help with project roadmaps, milestone tracking, and at-risk project identification. Use the available tools to fetch real roadmap data. Flag items that need attention.",
    declarations: roadmapDeclarations,
    handler: handleRoadmapTool,
    cronSchedule: "0 7 * * 1",
  },
  veg: {
    label: "VEG Governance Agent",
    description: "Deal register, workflow requests, investment decisions",
    icon: "💼",
    systemPrompt: "You are a VEG Governance Agent. You help users understand their investment deal register and governance workflow requests. Use the available tools to fetch real VEG data. Summarize financial metrics (TCV, PS) and highlight key decisions.",
    declarations: vegDeclarations,
    handler: handleVegTool,
    cronSchedule: "0 10 * * 1",
  },
  privacy: {
    label: "Privacy Agent",
    description: "Privacy assessments, GDPR risk, data protection",
    icon: "🔐",
    systemPrompt: "You are a Privacy Agent for Control Tower. You help with GDPR compliance, privacy assessments, and data protection. Use the available tools to fetch real privacy data. Reference specific regulations and assessment statuses.",
    declarations: privacyDeclarations,
    handler: handlePrivacyTool,
    cronSchedule: "0 11 * * 1",
  },
  reporting: {
    label: "Reporting Agent",
    description: "Generate reports, export data, summarize findings",
    icon: "📄",
    systemPrompt: "You are a Reporting Agent for Control Tower. You help generate reports and export data across all domains. Use the available tools to fetch summary data. Guide users to the right reports and export options.",
    declarations: reportingDeclarations,
    handler: handleReportingTool,
    cronSchedule: "0 12 * * 1",
  },
};

export type AgentType = keyof typeof AGENT_DEFINITIONS;
