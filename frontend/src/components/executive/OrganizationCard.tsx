import { Building2, ChevronRight, ShieldAlert } from "lucide-react";

export interface OrgCardProps {
  id: string;
  name: string;
  subOrganizationCount: number;
  applicationCount: number;
  totalOpenVulnerabilities: number;
  criticalCount: number;
  highCount: number;
  selected: boolean;
  onClick: () => void;
}

export function OrganizationCard({
  id, name, subOrganizationCount, applicationCount,
  totalOpenVulnerabilities, criticalCount, highCount,
  selected, onClick,
}: OrgCardProps) {
  const riskLevel = criticalCount > 0 ? "red" : highCount > 5 ? "orange" : "green";
  const borderColor = selected
    ? "border-indigo-500 ring-2 ring-indigo-200"
    : riskLevel === "red" ? "border-red-200"
    : riskLevel === "orange" ? "border-orange-200"
    : "border-slate-200";
  const badgeColor = riskLevel === "red" ? "bg-red-500"
    : riskLevel === "orange" ? "bg-orange-400"
    : "bg-green-500";

  return (
    <button
      onClick={onClick}
      className={`bg-white rounded-xl border-2 p-5 text-left w-full shadow-sm hover:shadow-md transition-all ${borderColor}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{name}</p>
            <p className="text-[11px] text-slate-400 font-mono truncate">{id}</p>
          </div>
        </div>
        <ChevronRight className={`w-4 h-4 mt-2 shrink-0 transition-colors ${selected ? "text-indigo-500" : "text-slate-300"}`} />
      </div>
      <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-slate-100">
        <div>
          <p className="text-[11px] text-slate-500 font-medium">Sub-Orgs</p>
          <p className="text-base font-bold text-slate-800">{subOrganizationCount}</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-500 font-medium">Applications</p>
          <p className="text-base font-bold text-slate-800">{applicationCount}</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-500 font-medium">Open Vulns</p>
          <p className="text-base font-bold text-slate-800">{totalOpenVulnerabilities}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 mt-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-xs font-medium text-red-600">{criticalCount}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-orange-400" />
          <span className="text-xs font-medium text-orange-600">{highCount}</span>
        </div>
        <div className="flex items-center gap-1 ml-auto text-xs font-medium text-indigo-600">
          View details <ChevronRight className="w-3 h-3" />
        </div>
      </div>
      <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-slate-100">
        <span className={`w-2 h-2 rounded-full ${badgeColor}`} />
        <span className="text-[11px] font-medium text-slate-500">
          {riskLevel === "red" ? "Critical risk" : riskLevel === "orange" ? "Elevated risk" : "Healthy"}
        </span>
      </div>
    </button>
  );
}
