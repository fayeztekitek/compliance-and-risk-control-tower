import { useState, useMemo } from "react";
import {
  Building2, Bug, AlertTriangle, Calendar,
  RefreshCw, ChevronDown, SlidersHorizontal, ShieldAlert, Loader2, Filter,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useExecutiveDashboardData } from "../hooks/useExecutiveDashboardData";
import { useDashboardFilterStore } from "../store/dashboardFilter.store";
import { dashboardApi } from "../api/dashboard.api";
import { KpiCard } from "../components/executive/KpiCard";
import { ScanningHealthCard } from "../components/executive/ScanningHealthCard";
import { OrganizationCard } from "../components/executive/OrganizationCard";
import { OrganizationDrilldown } from "../components/executive/OrganizationDrilldown";
import { SeverityDonut } from "../components/executive/SeverityDonut";
import { TrendLineChart } from "../components/executive/TrendLineChart";
import { TopAppsTable } from "../components/executive/TopAppsTable";
import { RiskDonut } from "../components/executive/RiskDonut";
import { LatestScansTable } from "../components/executive/LatestScansTable";
import FilterPanel from "../components/executive/FilterPanel";
import { DashboardData, OrgDrilldownData } from "../types/nexus";

function formatNum(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
  return v.toLocaleString();
}

export default function ExecutiveDashboard() {
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const { filters, getQueryParams, resetFilters, setMultipleFilters } = useDashboardFilterStore();
  const filterParams = useMemo(() => getQueryParams(), [filters]);

  const { dashboard, isFetching, isError, refetchAll } = useExecutiveDashboardData(
    Object.keys(filterParams).length > 0 ? filterParams : undefined
  );

  const { data: drilldownData, isFetching: drilldownLoading } = useQuery({
    queryKey: ["dashboard", "org-drilldown", selectedOrgId, filterParams],
    queryFn: async () => {
      if (!selectedOrgId) return null;
      const { data } = await dashboardApi.orgDrilldown(selectedOrgId, filterParams);
      return data.data as OrgDrilldownData;
    },
    enabled: !!selectedOrgId,
    staleTime: 30_000,
  });

  const handleRefresh = () => {
    setLastUpdated(new Date().toISOString());
    refetchAll();
  };

  const activeFilterCount = useMemo(() => {
    return Object.keys(filterParams).length;
  }, [filterParams]);

  if (isFetching && !dashboard.totalOrgs) {
    return (
      <div className="flex items-center justify-center py-32 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mr-3" /> Loading dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header
        totalOrgs={dashboard.totalOrgs}
        totalApps={dashboard.totalApps}
        activeFilterCount={activeFilterCount}
        onOpenFilters={() => setFilterPanelOpen(true)}
        onRefresh={handleRefresh}
        lastUpdated={lastUpdated}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {dashboard.kpiCards.map((kpi, i) => (
          <KpiCard key={i} {...kpi} />
        ))}
      </div>

      {dashboard.scanHealthCard && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <ScanningHealthCard data={dashboard.scanHealthCard} />
        </div>
      )}

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-500" />
            Top-Level Organizations
          </h2>
          <span className="text-xs text-slate-400">{dashboard.totalOrgs} organizations</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {dashboard.topLevelOrganizations.map((org) => (
            <OrganizationCard
              key={org.id}
              {...org}
              selected={selectedOrgId === org.id}
              onClick={() => setSelectedOrgId(selectedOrgId === org.id ? null : org.id)}
            />
          ))}
        </div>
      </section>

      {drilldownData && (
        <OrganizationDrilldown
          data={drilldownData}
          onClose={() => setSelectedOrgId(null)}
        />
      )}
      {drilldownLoading && selectedOrgId && (
        <div className="flex items-center justify-center py-8 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-500 mr-2" /> Loading drilldown...
        </div>
      )}

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SeverityDonut data={dashboard.severityDistribution} />
        <TrendLineChart data={dashboard.vulnerabilityTrend} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <TopAppsTable data={dashboard.topFiveApps} />
        <RiskDonut data={dashboard.riskStatusDistribution} />
      </section>

      <LatestScansTable data={dashboard.latestScans} />

      <BottomBar dashboard={dashboard} lastUpdated={lastUpdated} />

      <FilterPanel open={filterPanelOpen} onClose={() => setFilterPanelOpen(false)} />
    </div>
  );
}

function Header({
  totalOrgs, totalApps, activeFilterCount,
  onOpenFilters, onRefresh, lastUpdated,
}: {
  totalOrgs: number; totalApps: number;
  activeFilterCount: number;
  onOpenFilters: () => void;
  onRefresh: () => void;
  lastUpdated: string | null;
}) {
  const ago = lastUpdated
    ? `${Math.round((Date.now() - new Date(lastUpdated).getTime()) / 60000)} min ago`
    : "—";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-900">Executive Dashboard</h1>
          <span className="text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            Last updated: {ago}
          </span>
        </div>
        <p className="text-sm text-slate-500 mt-0.5">Global security posture overview</p>
      </div>
      <div className="flex items-center gap-2.5">
        <button
          onClick={onOpenFilters}
          className={`flex items-center gap-2 px-3.5 py-2 border rounded-lg text-sm transition-colors shadow-sm ${
            activeFilterCount > 0
              ? "bg-indigo-50 border-indigo-300 text-indigo-700 hover:bg-indigo-100"
              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Filter className="w-4 h-4" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>
        <button
          onClick={onRefresh}
          className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-colors shadow-sm"
          title="Refresh dashboard data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function BottomBar({ dashboard, lastUpdated }: { dashboard: DashboardData; lastUpdated: string | null }) {
  const timeStr = lastUpdated
    ? new Date(lastUpdated).toLocaleDateString() + " " + new Date(lastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400 bg-white rounded-xl border border-slate-200 px-5 py-3 shadow-sm">
      <span className="flex items-center gap-1.5">
        <Building2 className="w-3.5 h-3.5 shrink-0" />
        {dashboard.totalOrgs} orgs &middot; {dashboard.totalApps} apps
      </span>
      <span className="flex items-center gap-1.5">
        <Bug className="w-3.5 h-3.5 shrink-0" />
        {dashboard.totalVulns.toLocaleString()} total
      </span>
      <span className="flex items-center gap-1.5">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        {dashboard.totalOpen.toLocaleString()} open
      </span>
      <span className="flex items-center gap-1.5">
        <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
        Updated: {timeStr}
      </span>
    </div>
  );
}
