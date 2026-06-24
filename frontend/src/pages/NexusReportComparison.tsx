import { useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, Plus, Minus, Check, AlertTriangle, RefreshCw, GitCompare } from "lucide-react";
import { useStoredReportComparison } from "../hooks/useNexus";
import { SkeletonPage } from "../components/ui/Skeleton";
import type { NexusPolicyViolation, ReportComparisonResult } from "../api/nexus.api";

const SEVERITY_STYLES: Record<string, string> = {
  critical: "text-red-600 bg-red-100",
  high: "text-orange-600 bg-orange-100",
  medium: "text-amber-600 bg-amber-100",
  low: "text-slate-600 bg-slate-100",
};

function threatLevelToSeverity(threatLevel: number): string {
  if (threatLevel >= 8) return "critical";
  if (threatLevel >= 5) return "high";
  if (threatLevel >= 3) return "medium";
  return "low";
}

function SevBadge({ violation }: { violation: NexusPolicyViolation }) {
  const sev = violation.securityIssueSeverity
    ? threatLevelToSeverity(violation.securityIssueSeverity)
    : threatLevelToSeverity(violation.threatLevel);
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${SEVERITY_STYLES[sev] || "bg-slate-100 text-slate-600"}`}>
      {sev.toUpperCase()}
    </span>
  );
}

function ViolationRow({ violation, label }: { violation: NexusPolicyViolation; label?: string }) {
  return (
    <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50">
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          {label && <span className="text-xs font-medium text-slate-400 w-16 shrink-0">{label}</span>}
          <p className="text-sm font-medium text-slate-700 truncate">{violation.policyName}</p>
        </div>
        <p className="text-xs text-slate-400 truncate">
          {violation.displayName || violation.componentName || "-"}
          {violation.componentFormat && ` (${violation.componentFormat})`}
          {violation.cveId && ` — ${violation.cveId}`}
        </p>
      </div>
      <SevBadge violation={violation} />
    </div>
  );
}

function StatusChangedRow({ from, to, index }: { from: NexusPolicyViolation; to: NexusPolicyViolation; index: number }) {
  return (
    <div className="px-5 py-3 hover:bg-slate-50">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-700 truncate">{to.policyName}</p>
          <p className="text-xs text-slate-400 truncate">
            {to.displayName || to.componentName || "-"}
            {to.cveId && ` — ${to.cveId}`}
          </p>
        </div>
        <div className="flex items-center space-x-3 shrink-0">
          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{from.status}</span>
          <ArrowLeft className="w-3 h-3 text-slate-400" />
          <span className="text-xs font-medium text-amber-600 bg-amber-100 px-2 py-0.5 rounded">{to.status}</span>
        </div>
      </div>
    </div>
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

type SectionKey = "added" | "removed" | "same" | "changed";

export default function NexusReportComparison() {
  const [searchParams] = useSearchParams();
  const reportA = searchParams.get("reportA") || "";
  const reportB = searchParams.get("reportB") || "";

  const { data: comparison, isLoading, error } = useStoredReportComparison(reportA, reportB);

  if (isLoading) return <SkeletonPage />;

  if (error || !comparison) {
    return (
      <div className="space-y-6">
        <nav className="flex items-center space-x-2 text-sm text-slate-500">
          <Link to="/nexus" className="hover:text-indigo-600">Nexus IQ</Link>
          <span>/</span>
          <span className="text-slate-800 font-medium">Compare</span>
        </nav>
        <div className="text-center py-16 text-slate-500">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
          <p>No comparison available.</p>
          {!reportB && <p className="text-xs mt-1">Pass ?reportA=ID&reportB=ID in the URL.</p>}
        </div>
      </div>
    );
  }

  const sections: { key: SectionKey; count: number; icon: React.ReactNode; color: string; bg: string; comp: React.ReactNode }[] = [
    {
      key: "added", count: comparison.summary.added.critical + comparison.summary.added.high + comparison.summary.added.medium + comparison.summary.added.low,
      icon: <Plus className="w-4 h-4" />, color: "text-red-700", bg: "bg-red-50 border-red-200",
      comp: comparison.addedViolations.map((v) => <ViolationRow key={v.id} violation={v} label="NEW" />),
    },
    {
      key: "removed", count: comparison.summary.removed.critical + comparison.summary.removed.high + comparison.summary.removed.medium + comparison.summary.removed.low,
      icon: <Minus className="w-4 h-4" />, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200",
      comp: comparison.removedViolations.map((v) => <ViolationRow key={v.id} violation={v} label="GONE" />),
    },
    {
      key: "same", count: comparison.summary.same.critical + comparison.summary.same.high + comparison.summary.same.medium + comparison.summary.same.low,
      icon: <Check className="w-4 h-4" />, color: "text-slate-600", bg: "bg-slate-50 border-slate-200",
      comp: comparison.sameViolations.map((v) => <ViolationRow key={v.id} violation={v} />),
    },
    {
      key: "changed", count: comparison.statusChangedViolations.length,
      icon: <RefreshCw className="w-4 h-4" />, color: "text-amber-700", bg: "bg-amber-50 border-amber-200",
      comp: comparison.statusChangedViolations.map((v, i) => <StatusChangedRow key={v.to.id} from={v.from} to={v.to} index={i} />),
    },
  ];

  function severitySum(s: ReportComparisonResult["summary"][SectionKey]) {
    return { C: s.critical, H: s.high, M: s.medium, L: s.low };
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-slate-500">
        <Link to="/nexus" className="hover:text-indigo-600">Nexus IQ</Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">Compare Reports</span>
      </nav>

      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link to={`/nexus/report/${reportA}`} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-indigo-100">
            <GitCompare className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Report Comparison</h1>
            <p className="text-sm text-slate-500">
              {formatDate(comparison.reportB.scanDate)} vs {formatDate(comparison.reportA.scanDate)}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        {sections.map((s) => (
          <div key={s.key} className={`rounded-xl border p-5 ${s.bg}`}>
            <div className="flex items-center justify-between">
              <p className={`text-sm font-medium ${s.color}`}>
                {s.key === "added" ? "New" : s.key === "removed" ? "Removed" : s.key === "same" ? "Unchanged" : "Status Changed"}
              </p>
              {s.icon}
            </div>
            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.count}</p>
          </div>
        ))}
      </div>

      {/* Severity Breakdown per Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-800 mb-4">Severity Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 pr-4 font-medium text-slate-500">Section</th>
                <th className="text-center py-2 px-3 font-medium text-red-600">Critical</th>
                <th className="text-center py-2 px-3 font-medium text-orange-600">High</th>
                <th className="text-center py-2 px-3 font-medium text-amber-600">Medium</th>
                <th className="text-center py-2 px-3 font-medium text-slate-600">Low</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(Object.keys(comparison.summary) as SectionKey[]).map((k) => {
                const sum = severitySum(comparison.summary[k]);
                return (
                  <tr key={k}>
                    <td className="py-2 pr-4 font-medium text-slate-700 capitalize">{k}</td>
                    <td className="text-center py-2 px-3">{sum.C}</td>
                    <td className="text-center py-2 px-3">{sum.H}</td>
                    <td className="text-center py-2 px-3">{sum.M}</td>
                    <td className="text-center py-2 px-3">{sum.L}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section Lists */}
      {sections.map((s) => {
        if (s.count === 0) return null;
        const isCollapsible = s.count > 10;
        const content = s.comp;
        return (
          <div key={s.key} className={`bg-white rounded-xl border overflow-hidden ${s.key === "added" ? "border-red-200" : s.key === "removed" ? "border-emerald-200" : s.key === "same" ? "border-slate-200" : "border-amber-200"}`}>
            <div className={`px-5 py-3 border-b ${s.key === "added" ? "bg-red-50 border-red-200" : s.key === "removed" ? "bg-emerald-50 border-emerald-200" : s.key === "same" ? "bg-slate-50 border-slate-200" : "bg-amber-50 border-amber-200"}`}>
              <h3 className={`font-semibold ${s.color}`}>
                {s.key === "added" ? "New Violations" : s.key === "removed" ? "Removed Violations" : s.key === "same" ? "Unchanged Violations" : "Status Changed Violations"} ({s.count})
              </h3>
            </div>
            <div className={isCollapsible ? "max-h-80 overflow-y-auto divide-y divide-slate-100" : "divide-y divide-slate-100"}>
              {content}
            </div>
          </div>
        );
      })}

      {/* Report Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Report A (earlier)</p>
          <p className="text-sm font-semibold text-slate-800 mt-1">{formatDate(comparison.reportA.scanDate)}</p>
          <p className="text-xs text-slate-400">{comparison.reportA.stage} &middot; {comparison.reportA.reportTitle || `#${comparison.reportA.scanId.slice(0, 8)}`}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Report B (later)</p>
          <p className="text-sm font-semibold text-slate-800 mt-1">{formatDate(comparison.reportB.scanDate)}</p>
          <p className="text-xs text-slate-400">{comparison.reportB.stage} &middot; {comparison.reportB.reportTitle || `#${comparison.reportB.scanId.slice(0, 8)}`}</p>
        </div>
      </div>
    </div>
  );
}