import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileText, Calendar, Clock, XCircle, CheckCircle,
  Search, RefreshCw, ArrowUpDown, ArrowUp, ArrowDown,
  ChevronRight, Building2, ExternalLink,
  FileSpreadsheet, Loader2,
} from "lucide-react";
import { dashboardApi } from "../api/dashboard.api";
import { DataSourceIndicator, DataSourceType } from "../components/ui/DataSourceIndicator";
import { ReportRow } from "../types/nexus";
import { KpiCard } from "../components/executive/KpiCard";

type SortKey = keyof ReportRow;
type SortDir = "asc" | "desc";

export default function ReportsPage() {
  const { data: apiData, isLoading, isError, error } = useQuery({
    queryKey: ["dashboard-page", "reports"],
    queryFn: async () => {
      const res = await dashboardApi.dashboardPage("reports");
      return res.data.data;
    },
    staleTime: 60_000,
  });

  const dataSource: DataSourceType = (apiData?.dataSource as DataSourceType) || "DATABASE_CACHE";
  const rows: ReportRow[] = apiData?.rows ?? [];
  const kpiCards = apiData?.kpiCards ?? [];

  const [sortKey, setSortKey] = useState<SortKey>("scanDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [search, setSearch] = useState("");
  const [selectedReport, setSelectedReport] = useState<ReportRow | null>(null);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (col !== sortKey) return <ArrowUpDown className="w-3 h-3 inline ml-1 text-slate-300" />;
    return sortDir === "asc"
      ? <ArrowUp className="w-3 h-3 inline ml-1 text-indigo-600" />
      : <ArrowDown className="w-3 h-3 inline ml-1 text-indigo-600" />;
  };

  const filtered = useMemo(() => {
    let items = rows;
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(r =>
        r.reportId.toLowerCase().includes(q) ||
        r.applicationName.toLowerCase().includes(q) ||
        r.organizationName.toLowerCase().includes(q)
      );
    }
    return [...items].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "string" && typeof bv === "string") {
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
  }, [rows, search, sortKey, sortDir]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-600">
        <XCircle className="w-10 h-10 mb-2" />
        <p className="text-sm font-medium">Failed to load reports</p>
        <p className="text-xs text-red-400 mt-1">{(error as Error)?.message}</p>
      </div>
    );
  }

  if (selectedReport) {
    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedReport(null)} className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
          <ChevronRight className="w-4 h-4 rotate-180" /> Back to Reports
        </button>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">{selectedReport.reportId}</h2>
                <p className="text-sm text-slate-500">{selectedReport.applicationName} · {selectedReport.organizationName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
                <Download className="w-4 h-4" /> PDF
              </button>
              <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
                <FileSpreadsheet className="w-4 h-4" /> Excel
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500">Scan Date</p>
              <p className="text-sm font-bold text-slate-800">{new Date(selectedReport.scanDate).toLocaleDateString()}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500">Stage</p>
              <p className="text-sm font-bold text-slate-800">{selectedReport.stage}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500">Scanner</p>
              <p className="text-sm font-bold text-slate-800">v{selectedReport.scannerVersion}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500">Total Vulns</p>
              <p className="text-sm font-bold text-slate-800">{selectedReport.totalVulnerabilities}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-3">
              <p className="text-xs text-red-500">Critical</p>
              <p className="text-sm font-bold text-red-600">{selectedReport.criticalCount}</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-3">
              <p className="text-xs text-orange-500">High</p>
              <p className="text-sm font-bold text-orange-600">{selectedReport.highCount}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500">Status</p>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                selectedReport.policyEvaluationStatus === "PASS" ? "bg-green-100 text-green-700" :
                selectedReport.policyEvaluationStatus === "FAIL" ? "bg-red-100 text-red-700" :
                "bg-amber-100 text-amber-700"
              }`}>{selectedReport.policyEvaluationStatus}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Summary</h4>
              <div className="space-y-2 text-sm text-slate-600">
                <p>This report was generated for <strong>{selectedReport.applicationName}</strong> at the <strong>{selectedReport.stage}</strong> stage.</p>
                <p>Total vulnerabilities found: <strong>{selectedReport.totalVulnerabilities}</strong></p>
                <p>Critical severity: <strong className="text-red-600">{selectedReport.criticalCount}</strong></p>
                <p>High severity: <strong className="text-orange-600">{selectedReport.highCount}</strong></p>
                <p>Report age: <strong>{selectedReport.reportAge} days</strong></p>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Comparison with Previous Report</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between bg-green-50 rounded-lg px-3 py-2">
                  <span className="text-green-700">New Vulnerabilities</span>
                  <span className="font-bold text-green-700">+2</span>
                </div>
                <div className="flex justify-between bg-blue-50 rounded-lg px-3 py-2">
                  <span className="text-blue-700">Resolved</span>
                  <span className="font-bold text-blue-700">-3</span>
                </div>
                <div className="flex justify-between bg-amber-50 rounded-lg px-3 py-2">
                  <span className="text-amber-700">Recurring</span>
                  <span className="font-bold text-amber-700">1</span>
                </div>
                <div className="flex justify-between bg-slate-50 rounded-lg px-3 py-2">
                  <span className="text-slate-600">Component Changes</span>
                  <span className="font-bold text-slate-700">5</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
            <DataSourceIndicator source={dataSource} />
          </div>
          <p className="text-sm text-slate-500 mt-0.5">Historical Nexus IQ scan reports management</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 shadow-sm">
            <Download className="w-4 h-4 text-slate-400" />
            <span>Export All</span>
          </button>
          <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 shadow-sm">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpiCards.map((kpi: any, i: number) => (
          <KpiCard key={i} {...kpi} />
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700">Scan Reports</h3>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search reports..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 w-56"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <Th sortKey="reportId" label="Report ID" />
                <Th sortKey="applicationName" label="Application" />
                <Th sortKey="organizationName" label="Organization" />
                <Th sortKey="scanDate" label="Scan Date" />
                <Th sortKey="scannerVersion" label="Scanner Version" />
                <Th sortKey="stage" label="Stage" />
                <Th sortKey="totalVulnerabilities" label="Total Vulns" />
                <Th sortKey="criticalCount" label="Critical" />
                <Th sortKey="highCount" label="High" />
                <Th sortKey="reportAge" label="Report Age" />
                <Th sortKey="policyEvaluationStatus" label="Status" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((row) => (
                <tr
                  key={row.reportId}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedReport(row)}
                >
                  <td className="px-4 py-3 font-mono text-xs font-medium text-indigo-600 whitespace-nowrap">{row.reportId}</td>
                  <td className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                      {row.applicationName}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{row.organizationName}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600 whitespace-nowrap">{new Date(row.scanDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">v{row.scannerVersion}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{row.stage}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-slate-700">{row.totalVulnerabilities}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-red-600">{row.criticalCount}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-orange-600">{row.highCount}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-slate-600">{row.reportAge}d</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      row.policyEvaluationStatus === "PASS" ? "bg-green-100 text-green-700" :
                      row.policyEvaluationStatus === "FAIL" ? "bg-red-100 text-red-700" :
                      "bg-amber-100 text-amber-700"
                    }`}>{row.policyEvaluationStatus}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400">
          Showing {filtered.length} of {rows.length} reports
        </div>
      </div>
    </div>
  );

  function Th({ sortKey: sk, label }: { sortKey: SortKey; label: string }) {
    return (
      <th
        className="px-4 py-3 text-left text-xs font-medium text-slate-500 cursor-pointer hover:text-slate-700 select-none whitespace-nowrap"
        onClick={() => handleSort(sk)}
      >
        {label}
        <SortIcon col={sk} />
      </th>
    );
  }
}

function Download({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  );
}
