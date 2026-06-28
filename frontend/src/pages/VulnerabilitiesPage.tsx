import { useState, useMemo } from "react";
import {
  Bug, Layers, AlertTriangle, AlertCircle,
  Zap, Clock, Search, RefreshCw, Filter,
  ArrowUpDown, ArrowUp, ArrowDown, ChevronRight,
  ShieldAlert, ExternalLink, CheckCircle, XCircle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "../api/dashboard.api";
import { DataSourceIndicator, DataSourceType } from "../components/ui/DataSourceIndicator";
import { VulnerabilityRow } from "../types/nexus";
import { KpiCard } from "../components/executive/KpiCard";

type SortKey = keyof VulnerabilityRow;
type SortDir = "asc" | "desc";

function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    CRITICAL: "bg-red-100 text-red-700",
    HIGH: "bg-orange-100 text-orange-700",
    MEDIUM: "bg-amber-100 text-amber-700",
    LOW: "bg-blue-100 text-blue-700",
  };
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${styles[severity] || ""}`}>{severity}</span>;
}

export default function VulnerabilitiesPage() {
  const [sortKey, setSortKey] = useState<SortKey>("cve");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [selectedVuln, setSelectedVuln] = useState<VulnerabilityRow | null>(null);

  const { data: apiData, isLoading, isError, error } = useQuery({
    queryKey: ["dashboard-page", "vulnerabilities"],
    queryFn: async () => {
      const res = await dashboardApi.dashboardPage("vulnerabilities");
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
        r.cve.toLowerCase().includes(q) ||
        r.sonatypeId.toLowerCase().includes(q) ||
        r.components.toLowerCase().includes(q)
      );
    }
    if (severityFilter !== "ALL") {
      items = items.filter(r => r.severity === severityFilter);
    }
    return [...items].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "string" && typeof bv === "string") {
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
  }, [rows, search, sortKey, sortDir, severityFilter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-slate-500">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading vulnerabilities...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="bg-red-50 border border-red-200 rounded-lg px-6 py-4 text-sm text-red-700">
          Failed to load vulnerabilities: {(error as Error)?.message ?? "Unknown error"}
        </div>
      </div>
    );
  }

  if (selectedVuln) {
    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedVuln(null)} className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
          <ChevronRight className="w-4 h-4 rotate-180" /> Back to Vulnerabilities
        </button>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">{selectedVuln.cve}</h2>
                <p className="text-sm text-slate-500">{selectedVuln.sonatypeId}</p>
              </div>
            </div>
            <SeverityBadge severity={selectedVuln.severity} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500">CVSS Score</p>
              <p className="text-xl font-bold text-slate-800">{selectedVuln.cvssScore}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500">Applications Impacted</p>
              <p className="text-xl font-bold text-slate-800">{selectedVuln.applicationsImpacted}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500">Total Occurrences</p>
              <p className="text-xl font-bold text-slate-800">{selectedVuln.occurrences.toLocaleString()}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500">Fix Available</p>
              <p className="text-xl font-bold text-slate-800">{selectedVuln.fixAvailable ? <CheckCircle className="w-5 h-5 text-green-500 inline" /> : <XCircle className="w-5 h-5 text-red-500 inline" />}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Description</h4>
              <p className="text-sm text-slate-600">{selectedVuln.cve} - {selectedVuln.components} component</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Details</h4>
              <div className="space-y-1 text-sm text-slate-600">
                <p>Affected Component: <span className="font-medium">{selectedVuln.components}</span></p>
                <p>First Seen: <span className="font-medium">{new Date(selectedVuln.firstSeen).toLocaleDateString()}</span></p>
                <p>Last Seen: <span className="font-medium">{new Date(selectedVuln.lastSeen).toLocaleDateString()}</span></p>
                <p>Exploitability: <span className="font-medium">{selectedVuln.exploitability}</span></p>
                <p>Policy: <span className="font-medium">{selectedVuln.policy}</span></p>
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
            <h1 className="text-2xl font-bold text-slate-900">Vulnerabilities</h1>
            <DataSourceIndicator source={dataSource} />
          </div>
          <p className="text-sm text-slate-500 mt-0.5">Central repository of all distinct vulnerabilities</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 shadow-sm">
            <Filter className="w-4 h-4 text-slate-400" />
            <span>Filters</span>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {kpiCards.map((kpi, i) => (
          <KpiCard key={i} {...kpi} />
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-wrap gap-3">
          <h3 className="text-sm font-semibold text-slate-700">All Vulnerabilities</h3>
          <div className="flex items-center gap-3">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search CVE, Sonatype ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 w-64"
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <Th sortKey="cve" label="CVE" />
                <Th sortKey="sonatypeId" label="Sonatype ID" />
                <Th sortKey="severity" label="Severity" />
                <Th sortKey="cvssScore" label="CVSS" />
                <Th sortKey="applicationsImpacted" label="Apps Impacted" />
                <Th sortKey="occurrences" label="Occurrences" />
                <Th sortKey="components" label="Components" />
                <Th sortKey="firstSeen" label="First Seen" />
                <Th sortKey="lastSeen" label="Last Seen" />
                <Th sortKey="exploitability" label="Exploitability" />
                <Th sortKey="status" label="Status" />
                <Th sortKey="fixAvailable" label="Fix Available" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((row) => (
                <tr
                  key={row.vulnId}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedVuln(row)}
                >
                  <td className="px-4 py-3 font-mono text-xs font-medium text-indigo-600 whitespace-nowrap">{row.cve}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">{row.sonatypeId}</td>
                  <td className="px-4 py-3"><SeverityBadge severity={row.severity} /></td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-slate-700">{row.cvssScore}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-slate-700">{row.applicationsImpacted}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-slate-700">{row.occurrences.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-slate-600 max-w-[160px] truncate">{row.components}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-slate-600 whitespace-nowrap">{new Date(row.firstSeen).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-slate-600 whitespace-nowrap">{new Date(row.lastSeen).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{row.exploitability}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      row.status === "OPEN" ? "bg-red-100 text-red-700" :
                      row.status === "FIXED" ? "bg-green-100 text-green-700" :
                      "bg-amber-100 text-amber-700"
                    }`}>{row.status.replace(/_/g, " ")}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.fixAvailable
                      ? <CheckCircle className="w-4 h-4 text-green-500 inline" />
                      : <XCircle className="w-4 h-4 text-red-400 inline" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400">
          Showing {filtered.length} of {rows.length} vulnerabilities
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
