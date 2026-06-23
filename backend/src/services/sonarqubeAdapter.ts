export interface SonarqubeWebhookPayload {
  project: { key: string; name: string };
  qualityGate: { status: string; conditions: Array<{ metric: string; status: string; value: string }> };
  issues?: Array<{
    key: string;
    rule: string;
    severity: string;
    type: string;
    component: string;
    line?: number;
    message: string;
    resolution?: string;
    status: string;
  }>;
  analysedAt: string;
  changedAt?: string;
}

export interface SonarqubeFindingInput {
  sourceId: string;
  title: string;
  severity: string;
  description?: string;
  targetProduct: string;
  sourceTable: string;
  cweId?: string;
}

const SEVERITY_MAP: Record<string, string> = {
  BLOCKER: "CRITICAL",
  CRITICAL: "HIGH",
  MAJOR: "MEDIUM",
  MINOR: "LOW",
  INFO: "LOW",
};

export function mapSonarqubeSeverity(severity: string): string {
  return SEVERITY_MAP[severity] || "MEDIUM";
}

export function mapSonarqubeIssue(issue: { key: string; severity: string; message: string; rule: string; line?: number; type: string }, projectName: string): SonarqubeFindingInput {
  const ruleShort = issue.rule.split(":")[1] || issue.rule;
  const desc = `${issue.type}: ${issue.message} (${ruleShort}${issue.line ? `:${issue.line}` : ""})`;
  return {
    sourceId: issue.key,
    title: desc,
    severity: mapSonarqubeSeverity(issue.severity),
    description: desc,
    targetProduct: projectName,
    sourceTable: "sonarqube",
  };
}

export function processSonarqubeWebhook(payload: SonarqubeWebhookPayload): SonarqubeFindingInput[] {
  if (!payload.issues) return [];
  return payload.issues
    .filter(i => i.status !== "RESOLVED")
    .map(i => mapSonarqubeIssue(i, payload.project.name));
}
