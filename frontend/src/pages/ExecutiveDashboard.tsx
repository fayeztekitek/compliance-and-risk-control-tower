import { useState } from "react";
import {
  Building2, Bug, AlertTriangle, Calendar,
  RefreshCw, ChevronDown, SlidersHorizontal, ShieldAlert, Loader2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useExecutiveDashboardData } from "../hooks/useExecutiveDashboardData";
import { dashboardApi } from "../api/dashboard.api";
import { KpiCard } from "../components/executive/KpiCard";
import { OrganizationCard } from "../components/executive/OrganizationCard";
import { OrganizationDrilldown } from "../components/executive/OrganizationDrilldown";
import { SeverityDonut } from "../components/executive/SeverityDonut";
import { TrendLineChart } from "../components/executive/TrendLineChart";
import { TopAppsTable } from "../components/executive/TopAppsTable";
import { RiskDonut } from "../components/executive/RiskDonut";
import { LatestScansTable } from "../components/executive/LatestScansTable";
import { DashboardData, OrgDrilldownData } from "../types/nexus";

const dateRanges = ["Last 30 days", "Last 90 days", "Last 6 months", "Last 12 months", "Year to date"];

function formatNum(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
  return v.toLocaleString();
}

export default function ExecutiveDashboard() {
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [dateRangeOpen, setDateRangeOpen] = useState(false);
  const [dateRange, setDateRange] = useState("Last 30 days");

  const { dashboard, isFetching, isError } = useExecutiveDashboardData();

  const { data: drilldownData } = useQuery({
    queryKey: ["dashboard", "org-drilldown", selectedOrgId],
    queryFn: async () => {
      if (!selectedOrgId) return null;
      const { data } = await dashboardApi.orgDrilldown(selectedOrgId);
      return data.data as OrgDrilldownData;
    },
    enabled: !!selectedOrgId,
    staleTime: 30_000,
  });

  if (isFetching && !dashboard) {
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
        dateRange={dateRange}
        dateRangeOpen={dateRangeOpen}
        onToggleDateRange={() => setDateRangeOpen(!dateRangeOpen)}
        onSelectDateRange={(r) => { setDateRange(r); setDateRangeOpen(false); }}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboard.kpiCards.map((kpi, i) => (
          <KpiCard key={i} {...kpi} />
        ))}
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-500" />
            Top-Level Organizations
          </h2>
          <span className="text-xs text-slate-400">{dashboard.totalOrgs} organizations</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SeverityDonut data={dashboard.severityDistribution} />
        <TrendLineChart data={dashboard.vulnerabilityTrend} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <TopAppsTable data={dashboard.topFiveApps} />
        <RiskDonut data={dashboard.riskStatusDistribution} />
      </section>

      <LatestScansTable data={dashboard.latestScans} />

      <BottomBar dashboard={dashboard} />
    </div>
  );
}

function Header({
  totalOrgs, totalApps, dateRange, dateRangeOpen,
  onToggleDateRange, onSelectDateRange,
}: {
  totalOrgs: number; totalApps: number;
  dateRange: string; dateRangeOpen: boolean;
  onToggleDateRange: () => void;
  onSelectDateRange: (r: string) => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-900">Executive Dashboard</h1>
          <span className="text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Last updated: 5 min ago</span>
        </div>
        <p className="text-sm text-slate-500 mt-0.5">Global security posture overview</p>
      </div>
      <div className="flex items-center gap-2.5">
        <div className="relative">
          <button
            onClick={onToggleDateRange}
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>{dateRange}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
          {dateRangeOpen && (
            <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-10 py-1">
              {dateRanges.map((r) => (
                <button
                  key={r}
                  onClick={() => onSelectDateRange(r)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors ${
                    r === dateRange ? "text-indigo-600 font-medium" : "text-slate-600"
                  }`}
                >{r}</button>
              ))}
            </div>
          )}
        </div>
        <button className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
          <SlidersHorizontal className="w-4 h-4 text-slate-400" />
          <span>Filters</span>
        </button>
        <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-colors shadow-sm">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function BottomBar({ dashboard }: { dashboard: DashboardData }) {
  return (
    <div className="flex items-center justify-between text-xs text-slate-400 bg-white rounded-xl border border-slate-200 px-5 py-3 shadow-sm">
      <span className="flex items-center gap-1.5">
        <Building2 className="w-3.5 h-3.5" />
        {dashboard.totalOrgs} organizations &middot; {dashboard.totalApps} applications
      </span>
      <span className="flex items-center gap-1.5">
        <Bug className="w-3.5 h-3.5" />
        {dashboard.totalVulns.toLocaleString()} total vulnerabilities
      </span>
      <span className="flex items-center gap-1.5">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
        {dashboard.totalOpen.toLocaleString()} open
      </span>
      <span className="flex items-center gap-1.5">
        <ShieldAlert className="w-3.5 h-3.5" />
        Last updated: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </span>
    </div>
  );
}
