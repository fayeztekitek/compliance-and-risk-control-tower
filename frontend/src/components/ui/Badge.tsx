const DECISION_COLORS: Record<string, string> = {
  "GO FINAL": "bg-green-100 text-green-700",
  "GO INITIAL": "bg-blue-100 text-blue-700",
  "GO without Committee": "bg-teal-100 text-teal-700",
  "BID": "bg-yellow-100 text-yellow-700",
  "Differed": "bg-orange-100 text-orange-700",
  "No GO": "bg-red-100 text-red-700",
  "NO GO": "bg-red-100 text-red-700",
  "Postponed": "bg-purple-100 text-purple-700",
  "BACKLOG": "bg-gray-100 text-gray-700",
  "WITHDRAWN": "bg-pink-100 text-pink-700",
  "CANCELLED": "bg-rose-100 text-rose-700",
};

const SALES_COLORS: Record<string, string> = {
  Won: "bg-green-100 text-green-700",
  Lost: "bg-red-100 text-red-700",
  Open: "bg-blue-100 text-blue-700",
  Canceled: "bg-gray-100 text-gray-700",
  Committed: "bg-indigo-100 text-indigo-700",
};

const STATUS_BADGES: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  SUBMITTED: "bg-blue-100 text-blue-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  CONTRACT_SIGNATURE: "bg-purple-100 text-purple-700",
};

const TYPE_BADGES: Record<string, string> = {
  RFI: "bg-cyan-100 text-cyan-700",
  RFP: "bg-indigo-100 text-indigo-700",
  NEW_CLIENT_REQUEST: "bg-emerald-100 text-emerald-700",
  BD_REQUEST: "bg-amber-100 text-amber-700",
  ACC_CODE_CREATION: "bg-rose-100 text-rose-700",
  BID_COMMITTEE_OVERSIGHT: "bg-violet-100 text-violet-700",
};

const DEPT_SIGNOFF_COLORS: Record<string, string> = {
  PENDING: "bg-slate-100 text-slate-600",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

export function DecisionBadge({ decision }: { decision: string }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${DECISION_COLORS[decision] || "bg-slate-100 text-slate-700"}`}>
      {decision}
    </span>
  );
}

export function SalesBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-xs text-slate-400">—</span>;
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${SALES_COLORS[status] || "bg-slate-100 text-slate-700"}`}>
      {status}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGES[status] || "bg-slate-100 text-slate-700"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function TypeBadge({ type }: { type: string }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_BADGES[type] || "bg-slate-100 text-slate-700"}`}>
      {type.replace(/_/g, " ")}
    </span>
  );
}

export function DeptSignoffBadge({ state }: { state: string }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${DEPT_SIGNOFF_COLORS[state] || "bg-slate-100 text-slate-700"}`}>
      {state}
    </span>
  );
}
