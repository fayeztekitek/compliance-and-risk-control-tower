import { useState } from "react";
import { ArrowLeft, AlertTriangle, Bug, ChevronRight, FileText, Search } from "lucide-react";
import { useFindings } from "../hooks/useNexus";
import { SkeletonPage } from "../components/ui/Skeleton";
import NexusVulnerabilityDetail from "./NexusVulnerabilityDetail";
import NexusReportComparison from "./NexusReportComparison";

interface Props {
  reportId: string;
  applicationId: string;
  applicationName?: string;
  onBack: () => void;
  onBackToApp?: () => void;
  onBackToOverview?: () => void;
}

type ReportView = "list" | "vulnerability" | "comparison";

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: "text-red-600 bg-red-100",
  HIGH: "text-orange-600 bg-orange-100",
  MEDIUM: "text-amber-600 bg-amber-100",
  LOW: "text-slate-600 bg-slate-100",
};

export default function NexusReportDetail({ reportId, applicationId, applicationName, onBack, onBackToApp, onBackToOverview }: Props) {
  const [reportView, setReportView] = useState<ReportView>("list");
  const [selectedVulnId, setSelectedVulnId] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const { data: findingsData, isLoading } = useFindings({ scanId: reportId, limit: 200 });

  if (reportView === "vulnerability" && selectedVulnId) {
    return (
      <NexusVulnerabilityDetail
        findingId={selectedVulnId}
        reportId={reportId}
        onBack={() => { setReportView("list"); setSelectedVulnId(null); }}
        onBackToReport={() => { setReportView("list"); setSelectedVulnId(null); }}
        onBackToApp={onBackToApp}
        onBackToOverview={onBackToOverview}
      />
    );
  }

  if (reportView === "comparison") {
    return (
      <NexusReportComparison
        applicationId={applicationId}
        onBack={() => setReportView("list")}
      />
    );
  }

  if (isLoading) return <SkeletonPage />;

  const allVulns = findingsData?.data || [];
  const filteredVulns = allVulns.filter((v: any) => {
    if (severityFilter && v.unifiedSeverity !== severityFilter) return false;
    if (statusFilter && v.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (v.cveId?.toLowerCase() || "").includes(q) ||
             (v.componentName?.toLowerCase() || "").includes(q) ||
             (v.title?.toLowerCase() || "").includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-slate-500">
        {onBackToOverview && <><button onClick={onBackToOverview} className="hover:text-indigo-600">Nexus IQ</button><span>/</span></>}
        {onBackToApp && <><button onClick={onBackToApp} className="hover:text-indigo-600">{applicationName || "Application"}</button><span>/</span></>}
        <span className="text-slate-800 font-medium">Report</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-red-100">
              <Bug className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Report #{reportId.slice(0, 8)}</h1>
              <p className="text-sm text-slate-500">{allVulns.length} vulnerabilities</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setReportView("comparison")}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors"
        >
          <FileText className="w-4 h-4" />
          <span>Compare</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center space-x-4 flex-wrap gap-3">
          <div className="flex items-center space-x-2 flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search CVE, component, title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 border-none outline-none text-sm text-slate-700 placeholder-slate-400"
            />
          </div>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="FIXED">Fixed</option>
            <option value="WAIVED">Waived</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="FALSE_POSITIVE">False Positive</option>
          </select>
          <span className="text-xs text-slate-400">{filteredVulns.length} of {allVulns.length}</span>
        </div>
      </div>

      {/* Vuln Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-medium text-slate-600">CVE / ID</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Severity</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Component</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Risk</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Fix Available</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVulns.map((vuln: any) => (
                <tr
                  key={vuln.id}
                  onClick={() => { setSelectedVulnId(vuln.id); setReportView("vulnerability"); }}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs font-medium text-indigo-600">{vuln.cveId || vuln.id.slice(0, 8)}</span>
                    <p className="text-xs text-slate-400 truncate max-w-[200px]">{vuln.title}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${SEVERITY_COLORS[vuln.unifiedSeverity] || "text-slate-600 bg-slate-100"}`}>
                      {vuln.unifiedSeverity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {vuln.componentName ? `${vuln.componentName}@${vuln.componentVersion || "?"}` : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      vuln.status === "OPEN" ? "bg-red-100 text-red-700" :
                      vuln.status === "FIXED" ? "bg-emerald-100 text-emerald-700" :
                      vuln.status === "WAIVED" ? "bg-purple-100 text-purple-700" :
                      vuln.status === "ACCEPTED" ? "bg-amber-100 text-amber-700" :
                      "bg-slate-100 text-slate-600"
                    }`}>{vuln.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs font-medium">{vuln.riskScore ?? "-"}</td>
                  <td className="px-4 py-3 text-xs">
                    {vuln.fixAvailable ? (
                      <span className="text-emerald-600 font-medium">Yes</span>
                    ) : (
                      <span className="text-slate-400">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </td>
                </tr>
              ))}
              {filteredVulns.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">No vulnerabilities found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
