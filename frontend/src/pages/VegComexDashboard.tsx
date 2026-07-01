import { useState, useMemo } from "react";
import { Filter, RefreshCw, Download, Loader2 } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useVegDashboardData } from "../hooks/useVegDashboardData";
import { useVegDashboardFilterStore } from "../store/vegDashboardFilter.store";
import VegKpiCards from "../components/veg/VegKpiCards";
import VegDecisionTable from "../components/veg/VegDecisionTable";
import VegFinancialCharts from "../components/veg/VegFinancialCharts";
import VegWorkloadCharts from "../components/veg/VegWorkloadCharts";
import VegGovernanceQuality from "../components/veg/VegGovernanceQuality";
import VegRiskAlertView from "../components/veg/VegRiskAlertView";
import VegFilterPanel from "../components/veg/VegFilterPanel";

function activeFilterCount(filters: Record<string, any>) {
  return Object.values(filters).filter(v => v !== undefined && v !== null && v !== "" && !(typeof v === "number" && isNaN(v))).length;
}

export default function VegComexDashboard() {
  const [filterOpen, setFilterOpen] = useState(false);

  const { filters } = useVegDashboardFilterStore();
  const filterCount = useMemo(() => activeFilterCount(filters), [filters]);
  const hasFilters = filterCount > 0;

  const { dashboard, isFetching, isError, refetch } = useVegDashboardData(
    hasFilters ? filters : undefined
  );

  const chronosAlignmentData = useMemo(() => {
    if (!dashboard?.dealRows) return [];
    const counts: Record<string, number> = {};
    for (const row of dashboard.dealRows) {
      const key = row.chronos_alignment || "Missing Chronos";
      counts[key] = (counts[key] || 0) + 1;
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [dashboard?.dealRows]);

  const dossierCompletenessData = useMemo(() => {
    if (!dashboard?.dealRows) return [];
    const counts: Record<string, number> = {};
    for (const row of dashboard.dealRows) {
      const key = row.dossier_completeness || "Incomplete";
      counts[key] = (counts[key] || 0) + 1;
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [dashboard?.dealRows]);

  const PIE_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">VEG Governance — COMEX Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Opportunity governance, decisions, financials & workload overview</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterOpen(true)}
            className="relative flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filters
            {filterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {filterCount}
              </span>
            )}
          </button>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
            {isFetching ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Loading */}
      {isFetching && !dashboard && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <span className="ml-3 text-slate-500">Loading dashboard data...</span>
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 font-medium">Failed to load dashboard data</p>
          <button onClick={() => refetch()} className="mt-2 text-sm text-indigo-600 hover:underline">Retry</button>
        </div>
      )}

      {/* Dashboard content */}
      {dashboard && (
        <>
          {/* KPI Cards */}
          <VegKpiCards kpis={dashboard.kpis} />

          {/* Chart sections */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <VegDecisionTable rows={dashboard.dealRows} />
            </div>
            <div className="space-y-4">
              <VegGovernanceQuality quality={dashboard.governanceQuality} total={dashboard.kpis.total_veg} />
              <VegRiskAlertView distribution={dashboard.riskDistribution} total={parseInt(dashboard.kpis.total_veg)} />
            </div>
          </div>

          <VegFinancialCharts
            tcvByClient={dashboard.tcvByClient}
            tcvByRegion={dashboard.tcvByRegion}
            tcvByBusinessLine={dashboard.tcvByBusinessLine}
            tcvByProduct={dashboard.tcvByProduct}
            topClients={dashboard.topClients}
            topOpportunities={dashboard.topOpportunities}
            kpis={dashboard.kpis}
            decisions={dashboard.decisions}
          />

          <VegWorkloadCharts
            workloadByProduct={dashboard.workloadByProduct}
            workloadByOwner={dashboard.workloadByOwner}
            workloadByRegion={dashboard.workloadByRegion}
          />

          {/* Chronos Alignment & Dossier Completeness */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <h4 className="text-sm font-semibold text-slate-900 mb-3">Chronos Alignment Status</h4>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={chronosAlignmentData} cx="50%" cy="50%" innerRadius={50} outerRadius={100} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {chronosAlignmentData.map((_, i) => (<Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <h4 className="text-sm font-semibold text-slate-900 mb-3">Dossiers Completeness</h4>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={dossierCompletenessData} cx="50%" cy="50%" innerRadius={50} outerRadius={100} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {dossierCompletenessData.map((_, i) => (<Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Footer stats */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm text-center text-sm text-slate-400">
            {dashboard.kpis.total_veg} opportunities · {dashboard.kpis.total_tcv}K€ total TCV · {dashboard.tcvByClient.length} clients · {dashboard.tcvByRegion.length} regions · {dashboard.tcvByBusinessLine.length} business lines
          </div>
        </>
      )}

      {/* Filter Panel */}
      <VegFilterPanel open={filterOpen} onClose={() => setFilterOpen(false)} />
    </div>
  );
}
