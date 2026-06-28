import { useState, useMemo } from "react";
import {
  AppWindow, EyeOff, Activity, PauseCircle,
  AlertTriangle, Clock, TrendingUp, Search,
  RefreshCw, ArrowUpDown, ArrowUp, ArrowDown,
  ChevronRight, User, Building2, ExternalLink,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "../api/dashboard.api";
import { DataSourceIndicator, DataSourceType } from "../components/ui/DataSourceIndicator";
import { AppRow } from "../types/nexus";
import { KpiCard } from "../components/executive/KpiCard";

type SortKey = keyof AppRow;
type SortDir = "asc" | "desc";

function RiskBadge({ score }: { score: number }) {
  if (score >= 50) return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">High</span>;
  if (score >= 20) return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Medium</span>;
  if (score > 0) return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Low</span>;
  return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">None</span>;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-700",
    INACTIVE: "bg-amber-100 text-amber-700",
    NEVER_SCANNED: "bg-slate-100 text-slate-500",
  };
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${styles[status] || "bg-slate-100 text-slate-500"}`}>{status.replace(/_/g, " ")}</span>;
}

export default function ApplicationsPage() {
  const [sortKey, setSortKey] = useState<SortKey>("applicationName");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [search, setSearch] = useState("");
  const [selectedApp, setSelectedApp] = useState<AppRow | null>(null);

  const { data: apiData, isLoading, isError, error } = useQuery({
    queryKey: ["dashboard-page", "applications"],
    queryFn: async () => {
      const res = await dashboardApi.dashboardPage("applications");
      return res.data.data;
    },
    staleTime: 60_000,
  });

  const rows = apiData?.rows ?? [];
  const kpiCards = apiData?.kpiCards ?? [];
  const dataSource: DataSourceType = apiData?.dataSource ?? "DATABASE_CACHE";

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
        <div className="flex items-center gap-2 text-slate-500">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading applications...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="bg-red-50 border border-red-200 rounded-lg px-6 py-4 text-sm text-red-700">
          Failed to load applications: {(error as Error)?.message ?? "Unknown error"}
        </div>
      </div>
    );
  }

  if (selectedApp) {
    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedApp(null)} className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
          <ChevronRight className="w-4 h-4 rotate-180" /> Back to Applications
        </button>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                <AppWindow className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">{selectedApp.applicationName}</h2>
                <p className="text-sm text-slate-500 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" /> {selectedApp.organizationName}
                </p>
              </div>
            </div>
            <StatusBadge status={selectedApp.status} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500">Business Criticality</p>
              <p className="text-base font-bold text-slate-800">{selectedApp.businessCriticality}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500">Business Owner</p>
              <p className="text-sm font-semibold text-slate-700 flex items-center gap-1"><User className="w-3 h-3" />{selectedApp.businessOwner}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500">Technical Owner</p>
              <p className="text-sm font-semibold text-slate-700 flex items-center gap-1"><User className="w-3 h-3" />{selectedApp.technicalOwner}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500">Last Scan</p>
              <p className="text-sm font-semibold text-slate-700">{selectedApp.lastScanDate ? new Date(selectedApp.lastScanDate).toLocaleDateString() : "Never"}</p>
            </div>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            <SeverityPill label="Critical" value={selectedApp.openCritical} bg="bg-red-500" />
            <SeverityPill label="High" value={selectedApp.openHigh} bg="bg-orange-500" />
            <SeverityPill label="Medium" value={selectedApp.openMedium} bg="bg-amber-500" />
            <SeverityPill label="Low" value={selectedApp.openLow} bg="bg-blue-500" />
            <SeverityPill label="Waived" value={selectedApp.waivedCount} bg="bg-purple-500" />
            <SeverityPill label="Accepted" value={selectedApp.acceptedRisks} bg="bg-indigo-500" />
            <div className="bg-slate-100 rounded-lg p-2 text-center">
              <p className="text-sm font-bold text-slate-700">{selectedApp.scanReportCount}</p>
              <p className="text-[10px] text-slate-500">Reports</p>
            </div>
            <div className="bg-slate-100 rounded-lg p-2 text-center">
              <RiskBadge score={selectedApp.riskScore} />
              <p className="text-[10px] text-slate-500 mt-1">Risk Score: {selectedApp.riskScore}</p>
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
            <h1 className="text-2xl font-bold text-slate-900">Applications</h1>
            <DataSourceIndicator source={dataSource} />
          </div>
          <p className="text-sm text-slate-500 mt-0.5">Complete application security posture visibility</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 shadow-sm">
            <Download className="w-4 h-4 text-slate-400" />
            <span>Export</span>
          </button>
          <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 shadow-sm">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {kpiCards.map((kpi: any, i: number) => (
          <KpiCard key={i} {...kpi} />
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700">All Applications</h3>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search applications..."
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
                <Th sortKey="applicationName" label="Application" />
                <Th sortKey="organizationName" label="Organization" />
                <Th sortKey="businessOwner" label="Business Owner" />
                <Th sortKey="technicalOwner" label="Technical Owner" />
                <Th sortKey="lastScanDate" label="Last Scan" />
                <Th sortKey="scanReportCount" label="Reports" />
                <Th sortKey="openCritical" label="Crit" />
                <Th sortKey="openHigh" label="High" />
                <Th sortKey="openMedium" label="Med" />
                <Th sortKey="openLow" label="Low" />
                <Th sortKey="waivedCount" label="Waived" />
                <Th sortKey="acceptedRisks" label="Accepted" />
                <Th sortKey="riskScore" label="Risk Score" />
                <Th sortKey="status" label="Status" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((row) => (
                <tr
                  key={row.applicationId}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedApp(row)}
                >
                  <td className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <AppWindow className="w-4 h-4 text-indigo-500 shrink-0" />
                      {row.applicationName}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{row.organizationName}</td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap text-xs">{row.businessOwner}</td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap text-xs">{row.technicalOwner}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-slate-600 whitespace-nowrap">
                    {row.lastScanDate ? new Date(row.lastScanDate).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-slate-700">{row.scanReportCount}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-red-600">{row.openCritical}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-orange-600">{row.openHigh}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-amber-600">{row.openMedium}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-blue-500">{row.openLow}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-purple-600">{row.waivedCount}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-indigo-600">{row.acceptedRisks}</td>
                  <td className="px-4 py-3 text-right"><RiskBadge score={row.riskScore} /></td>
                  <td className="px-4 py-3 text-right"><StatusBadge status={row.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400">
          Showing {filtered.length} of {rows.length} applications
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

function SeverityPill({ label, value, bg }: { label: string; value: number; bg: string }) {
  return (
    <div className={`${bg} rounded-lg p-2 text-center`}>
      <p className="text-sm font-bold text-white">{value}</p>
      <p className="text-[10px] text-white/80 font-medium">{label}</p>
    </div>
  );
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
