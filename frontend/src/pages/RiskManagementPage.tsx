import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle, Clock, AlertOctagon, CheckSquare,
  CheckCircle, TrendingDown, Search, RefreshCw,
  ArrowUpDown, ArrowUp, ArrowDown, ChevronRight,
  User, Calendar, Flag,
} from "lucide-react";
import { dashboardApi } from "../api/dashboard.api";
import { DataSourceIndicator, DataSourceType } from "../components/ui/DataSourceIndicator";
import { RiskItem } from "../types/nexus";
import { KpiCard } from "../components/executive/KpiCard";

type SortKey = keyof RiskItem;
type SortDir = "asc" | "desc";

interface RiskManagementPageData {
  kpiCards: Array<{ icon: string; title: string; value: number; delta: number; deltaLabel: string; deltaDirection: "up" | "down" | "flat" }>;
  rows: RiskItem[];
}

function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    CRITICAL: "bg-red-100 text-red-700",
    HIGH: "bg-orange-100 text-orange-700",
    MEDIUM: "bg-amber-100 text-amber-700",
    LOW: "bg-blue-100 text-blue-700",
  };
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${styles[severity] || ""}`}>{severity}</span>;
}

function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    HIGH: "bg-red-100 text-red-700",
    MEDIUM: "bg-amber-100 text-amber-700",
    LOW: "bg-green-100 text-green-700",
  };
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${styles[priority] || ""}`}>{priority}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    OPEN: "bg-red-100 text-red-700",
    IN_PROGRESS: "bg-blue-100 text-blue-700",
    VALIDATED: "bg-purple-100 text-purple-700",
    CLOSED: "bg-green-100 text-green-700",
  };
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${styles[status] || ""}`}>{status.replace(/_/g, " ")}</span>;
}

export default function RiskManagementPage() {
  const [dataSource] = useState<DataSourceType>("DATABASE_CACHE");
  const { data, isLoading, isError, error } = useQuery<RiskManagementPageData>({
    queryKey: ["risk-management"],
    queryFn: async () => {
      const res = await dashboardApi.dashboardPage("risk-management");
      return res.data.data;
    },
  });
  const [sortKey, setSortKey] = useState<SortKey>("priority");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedRisk, setSelectedRisk] = useState<RiskItem | null>(null);

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
    let items = data?.rows ?? [];
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(r =>
        r.riskId.toLowerCase().includes(q) ||
        r.applicationName.toLowerCase().includes(q) ||
        r.vulnerability.toLowerCase().includes(q) ||
        r.owner.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "ALL") {
      items = items.filter(r => r.currentStatus === statusFilter);
    }
    const severityOrder: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    return [...items].sort((a, b) => {
      if (sortKey === "severity") {
        const av = severityOrder[a.severity] || 0;
        const bv = severityOrder[b.severity] || 0;
        return sortDir === "asc" ? av - bv : bv - av;
      }
      if (sortKey === "priority") {
        const po: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
        return sortDir === "asc" ? (po[a.priority] || 0) - (po[b.priority] || 0) : (po[b.priority] || 0) - (po[a.priority] || 0);
      }
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "string" && typeof bv === "string") {
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
  }, [data?.rows, search, sortKey, sortDir, statusFilter]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Risk Management</h1>
            <p className="text-sm text-slate-500 mt-0.5">Track remediation activities and risk posture</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-12 shadow-sm flex items-center justify-center">
          <div className="flex items-center gap-3 text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading risk data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Risk Management</h1>
            <p className="text-sm text-slate-500 mt-0.5">Track remediation activities and risk posture</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-red-200 p-12 shadow-sm flex items-center justify-center">
          <div className="text-center">
            <AlertOctagon className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-red-700">Failed to load risk data</p>
            <p className="text-xs text-red-500 mt-1">{(error as Error)?.message || "An unexpected error occurred"}</p>
          </div>
        </div>
      </div>
    );
  }

  if (selectedRisk) {
    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedRisk(null)} className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
          <ChevronRight className="w-4 h-4 rotate-180" /> Back to Risk Management
        </button>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">{selectedRisk.riskId}</h2>
                <p className="text-sm text-slate-500">{selectedRisk.applicationName} · {selectedRisk.organizationName}</p>
              </div>
            </div>
            <StatusBadge status={selectedRisk.currentStatus} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500">Vulnerability</p>
              <p className="text-sm font-semibold text-slate-700">{selectedRisk.vulnerability}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500">Severity</p>
              <SeverityBadge severity={selectedRisk.severity} />
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500">Owner</p>
              <p className="text-sm font-semibold text-slate-700 flex items-center gap-1"><User className="w-3 h-3" />{selectedRisk.owner}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500">Due Date</p>
              <p className="text-sm font-semibold text-slate-700">{new Date(selectedRisk.dueDate).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-slate-700">Workflow</h4>
            <div className="flex items-center gap-2">
              {["OPEN", "IN_PROGRESS", "VALIDATED", "CLOSED"].map((step, i) => {
                const idx = ["OPEN", "IN_PROGRESS", "VALIDATED", "CLOSED"].indexOf(selectedRisk.currentStatus);
                const isActive = i <= idx;
                const isCurrent = i === idx;
                return (
                  <div key={step} className="flex items-center gap-2">
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                      isCurrent ? "bg-indigo-100 text-indigo-700 ring-2 ring-indigo-200" :
                      isActive ? "bg-green-100 text-green-700" :
                      "bg-slate-100 text-slate-400"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-current" : "bg-slate-300"}`} />
                      {step.replace(/_/g, " ")}
                    </div>
                    {i < 3 && <ChevronRight className="w-3 h-3 text-slate-300" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Risk Management</h1>
            <p className="text-sm text-slate-500 mt-0.5">Track remediation activities and risk posture</p>
          </div>
          <DataSourceIndicator source={dataSource} />
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 shadow-sm">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {data?.kpiCards.map((kpi, i) => (
          <KpiCard key={i} {...kpi} />
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-wrap gap-3">
          <h3 className="text-sm font-semibold text-slate-700">All Risks</h3>
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="VALIDATED">Validated</option>
              <option value="CLOSED">Closed</option>
            </select>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search risks..."
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
                <Th sortKey="riskId" label="Risk ID" />
                <Th sortKey="applicationName" label="Application" />
                <Th sortKey="vulnerability" label="Vulnerability" />
                <Th sortKey="severity" label="Severity" />
                <Th sortKey="owner" label="Owner" />
                <Th sortKey="dueDate" label="Due Date" />
                <Th sortKey="currentStatus" label="Status" />
                <Th sortKey="sla" label="SLA" />
                <Th sortKey="priority" label="Priority" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((row) => (
                <tr
                  key={row.riskId}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedRisk(row)}
                >
                  <td className="px-4 py-3 font-mono text-xs font-medium text-indigo-600 whitespace-nowrap">{row.riskId}</td>
                  <td className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">{row.applicationName}</td>
                  <td className="px-4 py-3 text-xs text-slate-600 max-w-[200px] truncate">{row.vulnerability}</td>
                  <td className="px-4 py-3"><SeverityBadge severity={row.severity} /></td>
                  <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{row.owner}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600 whitespace-nowrap">{new Date(row.dueDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3"><StatusBadge status={row.currentStatus} /></td>
                  <td className="px-4 py-3 text-xs text-slate-600">{row.sla}</td>
                  <td className="px-4 py-3"><PriorityBadge priority={row.priority} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400">
          Showing {filtered.length} of {data?.rows.length ?? 0} risks
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
