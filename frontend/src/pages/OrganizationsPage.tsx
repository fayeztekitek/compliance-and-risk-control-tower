import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Building2, Search, RefreshCw, ArrowUpDown, ArrowUp, ArrowDown,
  TreePine, Expand, Download, Loader2,
} from "lucide-react";
import { dashboardApi } from "../api/dashboard.api";
import { DataSourceIndicator, DataSourceType } from "../components/ui/DataSourceIndicator";
import { OrganizationRow } from "../types/nexus";
import { KpiCard } from "../components/executive/KpiCard";
import { SeverityDonut } from "../components/executive/SeverityDonut";
import { RiskDonut } from "../components/executive/RiskDonut";
import { TrendLineChart } from "../components/executive/TrendLineChart";
import { TopAppsTable } from "../components/executive/TopAppsTable";

type SortKey = keyof OrganizationRow;
type SortDir = "asc" | "desc";

export default function OrganizationsPage() {
  const { data: apiData, isLoading, isError, error } = useQuery({
    queryKey: ["dashboard-page", "organizations"],
    queryFn: async () => {
      const res = await dashboardApi.dashboardPage("organizations");
      return res.data.data;
    },
    staleTime: 60_000,
  });

  const [sortKey, setSortKey] = useState<SortKey>("organizationName");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [search, setSearch] = useState("");

  const dataSource: DataSourceType = (apiData?.dataSource as DataSourceType) || "DATABASE_CACHE";
  const rows: OrganizationRow[] = apiData?.rows ?? [];
  const kpiCards = apiData?.kpiCards ?? [];

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
        r.organizationName.toLowerCase().includes(q) ||
        r.parentOrganizationName.toLowerCase().includes(q)
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

  if (isLoading) return <div className="flex items-center justify-center py-32 text-slate-400"><Loader2 className="w-8 h-8 animate-spin text-indigo-500 mr-3" /> Loading organizations...</div>;
  if (isError) return <div className="flex items-center justify-center py-32 text-red-500">Failed to load: {(error as Error)?.message}</div>;

  const severityDist = [
    { name: "Critical", value: rows.reduce((s, r) => s + r.criticalCount, 0), color: "#dc2626" },
    { name: "High", value: rows.reduce((s, r) => s + r.highCount, 0), color: "#ea580c" },
    { name: "Medium", value: rows.reduce((s, r) => s + Math.max(0, r.openCount - r.criticalCount - r.highCount), 0), color: "#d97706" },
    { name: "Low", value: 0, color: "#3b82f6" },
  ];

  const scanCoverage = [
    { name: "Scanned", value: rows.reduce((s, r) => s + r.activeApplicationCount, 0), color: "#16a34a" },
    { name: "Never Scanned", value: rows.reduce((s, r) => s + Math.max(0, r.applicationCount - r.activeApplicationCount), 0), color: "#94a3b8" },
  ];

  const trendData = [
    { month: "Jan", total: 420, critical: 12, high: 45, medium: 180, low: 183 },
    { month: "Feb", total: 380, critical: 10, high: 40, medium: 160, low: 170 },
    { month: "Mar", total: 450, critical: 14, high: 48, medium: 190, low: 198 },
    { month: "Apr", total: 410, critical: 11, high: 42, medium: 175, low: 182 },
    { month: "May", total: 390, critical: 9, high: 38, medium: 170, low: 173 },
    { month: "Jun", total: 360, critical: 8, high: 35, medium: 155, low: 162 },
  ];

  const topApps = [
    { applicationName: "Online Banking Portal", totalOpen: 47, criticalCount: 3, highCount: 8, riskScore: 70 },
    { applicationName: "Payment Processing Engine", totalOpen: 38, criticalCount: 2, highCount: 6, riskScore: 50 },
    { applicationName: "KYC Verification Service", totalOpen: 31, criticalCount: 1, highCount: 5, riskScore: 35 },
    { applicationName: "Core Banking System", totalOpen: 28, criticalCount: 2, highCount: 3, riskScore: 35 },
    { applicationName: "Fraud Detection Platform", totalOpen: 22, criticalCount: 1, highCount: 4, riskScore: 30 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">Organizations</h1>
            <DataSourceIndicator source={dataSource} />
          </div>
          <p className="text-sm text-slate-500 mt-0.5">Organization security posture overview</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 shadow-sm">
            <TreePine className="w-4 h-4 text-slate-400" />
            <span>View Organization Tree</span>
          </button>
          <button className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 shadow-sm">
            <Expand className="w-4 h-4 text-slate-400" />
            <span>Expand All</span>
          </button>
          <button className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 shadow-sm">
            <Download className="w-4 h-4 text-slate-400" />
            <span>Export</span>
          </button>
          <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 shadow-sm">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiCards.map((kpi: any, i: number) => (
          <KpiCard key={i} {...kpi} />
        ))}
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SeverityDonut data={severityDist} />
        <RiskDonut data={scanCoverage} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <TrendLineChart data={trendData} />
        <TopAppsTable data={topApps} />
      </section>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700">All Organizations</h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search organizations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 w-56"
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <Th sortKey="organizationName" label="Organization Name" />
                <Th sortKey="parentOrganizationName" label="Parent Organization" />
                <Th sortKey="subOrganizationCount" label="Sub Orgs" />
                <Th sortKey="applicationCount" label="Applications" />
                <Th sortKey="activeApplicationCount" label="Active Apps" />
                <Th sortKey="lastScanDate" label="Last Scan Date" />
                <Th sortKey="criticalCount" label="Critical" />
                <Th sortKey="highCount" label="High" />
                <Th sortKey="openCount" label="Open" />
                <Th sortKey="acceptedRisks" label="Accepted Risks" />
                <Th sortKey="securityScore" label="Score" />
                <Th sortKey="complianceStatus" label="Compliance" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((row) => (
                <tr key={row.organizationId} className="hover:bg-slate-50 transition-colors cursor-pointer">
                  <td className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-indigo-500 shrink-0" />
                      {row.organizationName}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{row.parentOrganizationName}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-slate-700">{row.subOrganizationCount}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-slate-700">{row.applicationCount}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-green-600">{row.activeApplicationCount}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-slate-600 whitespace-nowrap">
                    {row.lastScanDate ? new Date(row.lastScanDate).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-red-600">{row.criticalCount}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-orange-600">{row.highCount}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-slate-700">{row.openCount}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-purple-600">{row.acceptedRisks}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      row.securityScore >= 80 ? "bg-green-100 text-green-700" :
                      row.securityScore >= 50 ? "bg-amber-100 text-amber-700" :
                      "bg-red-100 text-red-700"
                    }`}>{row.securityScore}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      row.complianceStatus === "COMPLIANT" ? "bg-green-100 text-green-700" :
                      row.complianceStatus === "IN_PROGRESS" ? "bg-amber-100 text-amber-700" :
                      "bg-red-100 text-red-700"
                    }`}>{row.complianceStatus.replace("_", " ")}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400">
          Showing {filtered.length} of {rows.length} organizations
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
