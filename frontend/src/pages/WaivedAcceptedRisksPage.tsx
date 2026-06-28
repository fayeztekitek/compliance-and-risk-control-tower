import { useState, useMemo } from "react";
import {
  Shield, CheckSquare, AlertTriangle, Clock, XCircle,
  Search, RefreshCw, ArrowUpDown, ArrowUp, ArrowDown,
  ChevronRight, User, Building2, FileText, Calendar,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "../api/dashboard.api";
import { DataSourceIndicator, DataSourceType } from "../components/ui/DataSourceIndicator";
import { WaivedAcceptedRiskRow } from "../types/nexus";
import { KpiCard } from "../components/executive/KpiCard";

type SortKey = keyof WaivedAcceptedRiskRow;
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

function TypeBadge({ type }: { type: string }) {
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
    type === "WAIVED" ? "bg-purple-100 text-purple-700" : "bg-indigo-100 text-indigo-700"
  }`}>{type.replace(/_/g, " ")}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-700",
    EXPIRING_SOON: "bg-amber-100 text-amber-700",
    EXPIRED: "bg-red-100 text-red-700",
    REJECTED: "bg-slate-100 text-slate-500",
  };
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${styles[status] || ""}`}>{status.replace(/_/g, " ")}</span>;
}

export default function WaivedAcceptedRisksPage() {
  const [sortKey, setSortKey] = useState<SortKey>("approvalDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [selectedRisk, setSelectedRisk] = useState<WaivedAcceptedRiskRow | null>(null);

  const { data: apiData, isLoading, isError, error } = useQuery({
    queryKey: ["dashboard-page", "waived-accepted"],
    queryFn: async () => {
      const res = await dashboardApi.dashboardPage("waived-accepted");
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
      items = items.filter((r: WaivedAcceptedRiskRow) =>
        r.riskId.toLowerCase().includes(q) ||
        r.applicationName.toLowerCase().includes(q) ||
        r.vulnerability.toLowerCase().includes(q) ||
        r.justification.toLowerCase().includes(q)
      );
    }
    if (typeFilter !== "ALL") {
      items = items.filter((r: WaivedAcceptedRiskRow) => r.type === typeFilter);
    }
    return [...items].sort((a: any, b: any) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "string" && typeof bv === "string") {
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
  }, [rows, search, sortKey, sortDir, typeFilter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-slate-500">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading waived / accepted risks...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="bg-red-50 border border-red-200 rounded-lg px-6 py-4 text-sm text-red-700">
          Failed to load waived / accepted risks: {(error as Error)?.message ?? "Unknown error"}
        </div>
      </div>
    );
  }

  if (selectedRisk) {
    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedRisk(null)} className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
          <ChevronRight className="w-4 h-4 rotate-180" /> Back to Waived / Accepted Risks
        </button>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">{selectedRisk.riskId}</h2>
                <p className="text-sm text-slate-500">{selectedRisk.applicationName} · {selectedRisk.organizationName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TypeBadge type={selectedRisk.type} />
              <StatusBadge status={selectedRisk.currentStatus} />
            </div>
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
              <p className="text-xs text-slate-500">Requested By</p>
              <p className="text-sm font-semibold text-slate-700 flex items-center gap-1"><User className="w-3 h-3" />{selectedRisk.requestedBy}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500">Approved By</p>
              <p className="text-sm font-semibold text-slate-700 flex items-center gap-1"><User className="w-3 h-3" />{selectedRisk.approvedBy}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Justification</h4>
              <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">{selectedRisk.justification}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Timeline</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between bg-slate-50 rounded-lg px-3 py-2">
                  <span className="text-slate-600">Approval Date</span>
                  <span className="font-medium text-slate-700">{new Date(selectedRisk.approvalDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between bg-slate-50 rounded-lg px-3 py-2">
                  <span className="text-slate-600">Expiry Date</span>
                  <span className={`font-medium ${
                    selectedRisk.currentStatus === "EXPIRED" ? "text-red-600" :
                    selectedRisk.currentStatus === "EXPIRING_SOON" ? "text-amber-600" :
                    "text-slate-700"
                  }`}>{new Date(selectedRisk.expiryDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-700">Approval Workflow</h4>
            <div className="flex items-center gap-2">
              {["Requested", "Security Review", "Compliance Review", "Approval", "Monitoring"].map((step, i) => {
                const statusOrder = ["REJECTED", "EXPIRED", "EXPIRING_SOON", "ACTIVE"];
                const isActive = selectedRisk.currentStatus !== "REJECTED";
                const isCurrent = step === "Approval" && isActive || step === "Monitoring" && selectedRisk.currentStatus === "ACTIVE";
                return (
                  <div key={step} className="flex items-center gap-2">
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                      isCurrent ? "bg-indigo-100 text-indigo-700 ring-2 ring-indigo-200" :
                      isActive ? "bg-green-100 text-green-700" :
                      "bg-slate-100 text-slate-400"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-current" : "bg-slate-300"}`} />
                      {step}
                    </div>
                    {i < 4 && <ChevronRight className="w-3 h-3 text-slate-300" />}
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
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">Waived / Accepted Risks</h1>
            <DataSourceIndicator source={dataSource} />
          </div>
          <p className="text-sm text-slate-500 mt-0.5">Governance decisions and risk acceptance management</p>
        </div>
        <div className="flex items-center gap-2">
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
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-wrap gap-3">
          <h3 className="text-sm font-semibold text-slate-700">Governance Decisions</h3>
          <div className="flex items-center gap-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value="ALL">All Types</option>
              <option value="WAIVED">Waived</option>
              <option value="ACCEPTED">Accepted</option>
            </select>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search..."
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
                <Th sortKey="organizationName" label="Organization" />
                <Th sortKey="vulnerability" label="Vulnerability" />
                <Th sortKey="severity" label="Severity" />
                <Th sortKey="type" label="Type" />
                <Th sortKey="justification" label="Justification" />
                <Th sortKey="requestedBy" label="Requested By" />
                <Th sortKey="approvedBy" label="Approved By" />
                <Th sortKey="approvalDate" label="Approval Date" />
                <Th sortKey="expiryDate" label="Expiry Date" />
                <Th sortKey="currentStatus" label="Status" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((row: WaivedAcceptedRiskRow) => (
                <tr
                  key={row.riskId}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedRisk(row)}
                >
                  <td className="px-4 py-3 font-mono text-xs font-medium text-indigo-600 whitespace-nowrap">{row.riskId}</td>
                  <td className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">{row.applicationName}</td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{row.organizationName}</td>
                  <td className="px-4 py-3 text-xs text-slate-600 max-w-[150px] truncate">{row.vulnerability}</td>
                  <td className="px-4 py-3"><SeverityBadge severity={row.severity} /></td>
                  <td className="px-4 py-3"><TypeBadge type={row.type} /></td>
                  <td className="px-4 py-3 text-xs text-slate-600 max-w-[200px] truncate">{row.justification}</td>
                  <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{row.requestedBy}</td>
                  <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{row.approvedBy}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600 whitespace-nowrap">{new Date(row.approvalDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">
                    <span className={`${
                      row.currentStatus === "EXPIRED" ? "text-red-600" :
                      row.currentStatus === "EXPIRING_SOON" ? "text-amber-600" :
                      "text-slate-600"
                    }`}>{new Date(row.expiryDate).toLocaleDateString()}</span>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={row.currentStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400">
          Showing {filtered.length} of {rows.length} decisions
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
