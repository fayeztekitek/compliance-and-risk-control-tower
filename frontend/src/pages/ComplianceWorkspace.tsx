import { useState } from "react";
import { useFrameworkSummaries, useSlaBreaches, useClassifications, useDetectBreaches } from "../hooks/useCompliance";
import { SkeletonTable } from "../components/ui/Skeleton";

const FRAMEWORK_COLORS: Record<string, string> = {
  GDPR: "bg-purple-100 text-purple-800 border-purple-200",
  DORA: "bg-blue-100 text-blue-800 border-blue-200",
  SOX: "bg-green-100 text-green-800 border-green-200",
  PCI_DSS: "bg-red-100 text-red-800 border-red-200",
  ISO_27001: "bg-amber-100 text-amber-800 border-amber-200",
  NIST_800_53: "bg-cyan-100 text-cyan-800 border-cyan-200",
};
const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: "bg-red-50 text-red-700",
  HIGH: "bg-orange-50 text-orange-700",
  MEDIUM: "bg-yellow-50 text-yellow-700",
  LOW: "bg-blue-50 text-blue-700",
};

const statusBadge = (status: string) => {
  const colors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-800",
    BREACHED: "bg-red-100 text-red-800",
    REMEDIATED: "bg-slate-100 text-slate-600",
  };
  return `px-2 py-0.5 rounded text-xs font-medium ${colors[status] || "bg-slate-100 text-slate-600"}`;
};

export default function ComplianceWorkspace() {
  const [tab, setTab] = useState<"matrix" | "breaches" | "classifications">("matrix");
  const [filterFramework, setFilterFramework] = useState("");

  const { data: frameworks, isLoading: fwLoading } = useFrameworkSummaries();
  const { data: breaches, isLoading: brLoading } = useSlaBreaches();
  const { data: classifications, isLoading: clLoading } = useClassifications(filterFramework ? { framework: filterFramework } : undefined);
  const detectBreaches = useDetectBreaches();

  if (fwLoading) return <SkeletonTable />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Compliance Dashboard</h1>
        <button onClick={() => detectBreaches.mutate()} className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors">
          Detect SLA Breaches
        </button>
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit" role="tablist">
        {(["matrix", "breaches", "classifications"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} role="tab" aria-selected={tab === t}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-800"}`}>
            {t === "matrix" ? "Compliance Matrix" : t === "breaches" ? `SLA Breaches (${breaches?.length || 0})` : "Classifications"}
          </button>
        ))}
      </div>

      {tab === "matrix" && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Framework</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Total</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Active</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Breached</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Remediated</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(frameworks || []).map(fw => {
                const pct = fw.total_findings > 0 ? Math.round((fw.remediated / fw.total_findings) * 100) : 100;
                return (
                  <tr key={fw.framework} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => { setFilterFramework(fw.framework); setTab("classifications"); }}>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${FRAMEWORK_COLORS[fw.framework] || "bg-slate-100 text-slate-600"}`}>
                        {fw.framework}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-slate-800">{fw.total_findings}</td>
                    <td className="px-4 py-3 text-center text-sm text-green-600 font-medium">{fw.active}</td>
                    <td className="px-4 py-3 text-center text-sm text-red-600 font-medium">{fw.breached}</td>
                    <td className="px-4 py-3 text-center text-sm text-slate-600">{fw.remediated}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex items-center gap-2">
                        <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                            style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-slate-500">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === "breaches" && (
        <>
          {brLoading ? <SkeletonTable /> : !breaches?.length ? (
            <div className="text-center py-12 text-slate-500">No SLA breaches detected.</div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Framework</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Control</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Severity</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">SLA Deadline</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Days Overdue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {breaches.map(b => (
                    <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${FRAMEWORK_COLORS[b.framework] || ""}`}>{b.framework}</span>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-slate-600">{b.control_id}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${SEVERITY_COLORS[b.severity] || ""}`}>{b.severity}</span></td>
                      <td className="px-4 py-3 text-sm text-slate-600">{new Date(b.sla_deadline).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">{Math.round(b.days_overdue)}d overdue</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === "classifications" && (
        <>
          <div className="flex gap-3">
            <select value={filterFramework} onChange={e => setFilterFramework(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
              <option value="">All Frameworks</option>
              {(frameworks || []).map(fw => <option key={fw.framework} value={fw.framework}>{fw.framework}</option>)}
            </select>
          </div>
          {clLoading ? <SkeletonTable /> : !classifications?.length ? (
            <div className="text-center py-12 text-slate-500">No classifications found.</div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Framework</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Control</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Requirement</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">SLA Deadline</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classifications.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${FRAMEWORK_COLORS[c.framework] || ""}`}>{c.framework}</span>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-slate-600">{c.control_id || "—"}</td>
                      <td className="px-4 py-3 text-sm text-slate-800 max-w-xs truncate">{c.requirement || "—"}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{c.sla_deadline ? new Date(c.sla_deadline).toLocaleDateString() : "—"}</td>
                      <td className="px-4 py-3"><span className={statusBadge(c.status)}>{c.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
