import { useState } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Bug, Search, ChevronRight, FileText, Shield, Layers } from "lucide-react";
import { useStoredReport, useStoredReportViolations } from "../hooks/useNexus";
import { SkeletonPage } from "../components/ui/Skeleton";
import Pagination from "../components/ui/Pagination";
import type { NexusPolicyViolation } from "../api/nexus.api";

const SEVERITY_STYLES: Record<string, string> = {
  critical: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-slate-100 text-slate-600",
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

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Open: "bg-red-100 text-red-700",
    Waived: "bg-purple-100 text-purple-700",
    Fixed: "bg-emerald-100 text-emerald-700",
    "Exempted": "bg-amber-100 text-amber-700",
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || "bg-slate-100 text-slate-600"}`}>
      {status}
    </span>
  );
}

export default function NexusReportDetail() {
  const { reportId } = useParams<{ reportId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const applicationId = searchParams.get("applicationId") || "";
  const applicationName = searchParams.get("applicationName") || "Application";

  const [severityFilter, setSeverityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const { data: report, isLoading: reportLoading } = useStoredReport(reportId || "");
  const { data: violationsData, isLoading: violationsLoading } = useStoredReportViolations(reportId || "", {
    severity: severityFilter || undefined,
    status: statusFilter || undefined,
    search: searchQuery || undefined,
    page,
    limit,
  });

  const isLoading = reportLoading || violationsLoading;
  const violations = violationsData?.data || [];
  const total = violationsData?.total || 0;
  const summary = violationsData?.summary;
  const filteredCount = violations.length;

  if (isLoading) return <SkeletonPage />;

  if (!report) {
    return (
      <div className="space-y-6">
        <nav className="flex items-center space-x-2 text-sm text-slate-500">
          <Link to="/nexus" className="hover:text-indigo-600">Nexus IQ</Link>
          <span>/</span>
          <span className="text-slate-800 font-medium">Report not found</span>
        </nav>
        <div className="text-center py-16 text-slate-500">Report not found</div>
      </div>
    );
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-slate-500">
        <Link to="/nexus" className="hover:text-indigo-600">Nexus IQ</Link>
        <span>/</span>
        {applicationId && (
          <>
            <Link to={`/nexus/app/${applicationId}`} className="hover:text-indigo-600">{applicationName}</Link>
            <span>/</span>
          </>
        )}
        <span className="text-slate-800 font-medium">Report {report.reportTitle || `#${report.scanId.slice(0, 8)}`}</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-red-100">
              <Bug className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{report.reportTitle || `Report #${report.scanId.slice(0, 8)}`}</h1>
              <p className="text-sm text-slate-500">{formatDate(report.scanDate)} &middot; {report.stage}</p>
            </div>
          </div>
        </div>
        <Link
          to={`/nexus/compare?reportA=${reportId}&reportB=`}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors"
        >
          <FileText className="w-4 h-4" />
          <span>Compare</span>
        </Link>
      </div>

      {/* Report Info */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Stage</p>
          <p className="text-lg font-semibold text-slate-800 mt-1">{report.stage}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Total Components</p>
          <p className="text-lg font-semibold text-slate-800 mt-1">{report.totalComponents}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Affected Components</p>
          <p className="text-lg font-semibold text-slate-800 mt-1">{report.affectedComponents}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Status</p>
          <p className="text-lg font-semibold text-slate-800 mt-1">{report.policyEvaluationStatus || "-"}</p>
        </div>
      </div>

      {/* Severity Summary */}
      {summary && (
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-slate-600">Violations:</span>
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-red-100 text-red-700 text-xs font-medium">{summary.critical} C</span>
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-orange-100 text-orange-700 text-xs font-medium">{summary.high} H</span>
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 text-xs font-medium">{summary.medium} M</span>
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">{summary.low} L</span>
          <span className="text-xs text-slate-400 ml-2">({summary.total} total)</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center space-x-4 flex-wrap gap-3">
          <div className="flex items-center space-x-2 flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search CVE, component, constraint..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="flex-1 border-none outline-none text-sm text-slate-700 placeholder-slate-400"
            />
          </div>
          <select
            value={severityFilter}
            onChange={(e) => { setSeverityFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          >
            <option value="">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Fixed">Fixed</option>
            <option value="Waived">Waived</option>
            <option value="Exempted">Exempted</option>
          </select>
          <span className="text-xs text-slate-400">{total} total</span>
        </div>
      </div>

      {/* Violation Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-medium text-slate-600">Severity</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Policy / Constraint</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Component</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">CVE</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Threat</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {violations.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3"><SevBadge violation={v} /></td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium text-slate-700">{v.policyName}</p>
                    {v.constraintName && <p className="text-xs text-slate-400">{v.constraintName}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium text-slate-700">{v.displayName || v.componentName || "-"}</p>
                    {v.componentFormat && <p className="text-xs text-slate-400">{v.componentFormat}{v.componentCoordinates ? `:${v.componentCoordinates}` : ""}</p>}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-indigo-600">{v.cveId || "-"}</td>
                  <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
                  <td className="px-4 py-3 text-xs font-medium text-slate-600">{v.threatLevel}</td>
                  <td className="px-4 py-3"><ChevronRight className="w-4 h-4 text-slate-300" /></td>
                </tr>
              ))}
              {filteredCount === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">No violations found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {violationsData && (
          <Pagination
            page={violationsData.page}
            limit={violationsData.limit}
            total={violationsData.total}
            onPageChange={setPage}
            onLimitChange={(l) => { setLimit(l); setPage(1); }}
          />
        )}
      </div>

      {/* Report Metadata */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="font-semibold text-slate-800 mb-3 flex items-center space-x-2">
          <Layers className="w-4 h-4 text-slate-400" />
          <span>Report Metadata</span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="text-slate-500">Scan ID:</span> <span className="text-slate-700 font-mono">{report.scanId}</span></div>
          <div><span className="text-slate-500">Date:</span> <span className="text-slate-700">{formatDate(report.scanDate)}</span></div>
          <div><span className="text-slate-500">Initiator:</span> <span className="text-slate-700">{report.initiator || "-"}</span></div>
          <div><span className="text-slate-500">Commit:</span> <span className="text-slate-700 font-mono">{report.commitHash ? report.commitHash.slice(0, 12) : "-"}</span></div>
        </div>
      </div>
    </div>
  );
}