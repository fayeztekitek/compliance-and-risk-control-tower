const RAG_COLORS = {
  red: "bg-red-100 text-red-700",
  amber: "bg-amber-100 text-amber-700",
  green: "bg-green-100 text-green-700",
};

const DOT_COLORS = {
  red: "bg-red-500",
  amber: "bg-amber-500",
  green: "bg-green-500",
};

export function RAGBadge({ status, label }: { status: "red" | "amber" | "green"; label?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${RAG_COLORS[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${DOT_COLORS[status]}`} />
      {label || status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export type RAGStatus = "red" | "amber" | "green";

type StatusMap = Record<string, RAGStatus>;

const MILESTONE_MAP: StatusMap = {
  ON_TIME: "green",
  DELAYED: "amber",
  CRITICAL: "red",
};

const PROJECT_STATUS_MAP: StatusMap = {
  ON_TRACK: "green",
  DEVIATING: "amber",
  HIGH_RISK: "red",
};

const GO_LIVE_MAP: StatusMap = {
  READY: "green",
  RISKY: "amber",
  BLOCKED: "red",
};

const COMPLIANCE_MAP: StatusMap = {
  COMPLIANT: "green",
  WARNING: "amber",
  NON_COMPLIANT: "red",
  OVERDUE: "red",
};

export function milestoneToRAG(status: string): RAGStatus {
  return MILESTONE_MAP[status] || "amber";
}

export function projectStatusToRAG(status: string): RAGStatus {
  return PROJECT_STATUS_MAP[status] || "amber";
}

export function goLiveToRAG(state: string): RAGStatus {
  return GO_LIVE_MAP[state] || "amber";
}

export function complianceToRAG(status: string): RAGStatus {
  return COMPLIANCE_MAP[status] || "amber";
}
