export interface FortifyFindingInput {
  sourceId: string;
  title: string;
  severity: string;
  cweId?: string;
  description?: string;
  fileName?: string;
  lineNumber?: number;
  targetProduct: string;
  sourceTable: string;
}

const PRIORITY_MAP: Record<number, string> = {
  1: "CRITICAL",
  2: "HIGH",
  3: "MEDIUM",
  4: "LOW",
  5: "LOW",
};

export function mapFortifySeverity(priority: number): string {
  return PRIORITY_MAP[priority] || "MEDIUM";
}

export function mapFortifyVulnerability(vuln: { id: string; category: string; priority: number; cweId?: string; fileName?: string; lineNumber?: number; kingdom?: string }, targetProduct: string): FortifyFindingInput {
  const desc = [vuln.kingdom, vuln.category].filter(Boolean).join(": ") || "Fortify finding";
  return {
    sourceId: vuln.id,
    title: desc,
    severity: mapFortifySeverity(vuln.priority),
    cweId: vuln.cweId,
    description: desc,
    fileName: vuln.fileName,
    lineNumber: vuln.lineNumber,
    targetProduct,
    sourceTable: "fortify",
  };
}
