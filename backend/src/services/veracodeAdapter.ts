export interface VeracodeFindingInput {
  sourceId: string;
  title: string;
  severity: string;
  cweId?: string;
  description?: string;
  targetProduct: string;
  sourceTable: string;
}

const SEVERITY_LEVELS: Record<number, string> = {
  0: "LOW",
  1: "MEDIUM",
  2: "HIGH",
  3: "HIGH",
  4: "HIGH",
  5: "CRITICAL",
};

export function mapVeracodeSeverity(level: number): string {
  return SEVERITY_LEVELS[level] || "MEDIUM";
}

export function mapVeracodeFlaw(flaw: { issueId: string; categoryName: string; severity: number; cveId?: string; description?: string; moduleName?: string; modulePath?: string; exploitLevel: number }, appName: string): VeracodeFindingInput {
  const desc = flaw.description || `${flaw.categoryName} (exploit: ${flaw.exploitLevel}, module: ${flaw.moduleName || "unknown"})`;
  return {
    sourceId: flaw.issueId,
    title: flaw.categoryName,
    severity: mapVeracodeSeverity(flaw.severity),
    cweId: flaw.cveId,
    description: desc,
    targetProduct: appName,
    sourceTable: "veracode",
  };
}
