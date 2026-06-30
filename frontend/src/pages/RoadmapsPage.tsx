import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Map, Search, Upload, Filter, TrendingUp, DollarSign, AlertTriangle, CheckCircle, Users, Clock, ArrowRight } from "lucide-react";
import { roadmapMonitoringApi, type EnrichedRoadmap } from "../api/project.api";
import { PageHeader, ChartCard } from "../components/ui/DashboardGrid";
import { RAGBadge, milestoneToRAG, projectStatusToRAG } from "../components/ui/RAGBadge";
import { Loader2 } from "lucide-react";

const TYPE_ICONS: Record<string, React.ElementType> = {
  STRATEGIC: TrendingUp,
  REGULATORY: AlertTriangle,
  BUDGETARY: DollarSign,
};

export default function RoadmapsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");

  const { data: roadmaps, isLoading } = useQuery({
    queryKey: ["roadmaps-enriched"],
    queryFn: () => roadmapMonitoringApi.list().then(r => r.data.data),
    refetchInterval: 30000,
  });

  const filtered = (roadmaps || []).filter(r => {
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter && r.type !== typeFilter) return false;
    return true;
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>;

  return (
    <div>
      <PageHeader
        title="Roadmaps Monitoring"
        description="Product roadmap governance — releases, features, capacity and RTD tracking"
        icon={Map}
      />

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search roadmaps..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All types</option>
          <option value="STRATEGIC">Strategic</option>
          <option value="REGULATORY">Regulatory</option>
          <option value="BUDGETARY">Budgetary</option>
        </select>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
          <Upload className="w-4 h-4" />
          Import (.pptx / .pdf / .xlsx)
        </button>
      </div>

      {/* Roadmap Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((r) => (
          <RoadmapCard key={r.id} roadmap={r} onView={() => navigate(`/roadmaps/${r.id}`)} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <Map className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-lg font-medium">No roadmaps found</p>
          <p className="text-sm mt-1">Try adjusting your filters or create a new roadmap</p>
        </div>
      )}
    </div>
  );
}

function RoadmapCard({ roadmap: r, onView }: { roadmap: EnrichedRoadmap; onView: () => void }) {
  const TypeIcon = TYPE_ICONS[r.type] || TrendingUp;
  const utilization = r.totalBudget > 0 ? Math.round((r.totalConsumed / r.totalBudget) * 100) : 0;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
              <TypeIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white truncate">{r.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {r.leadOwner} &middot; {r.type.charAt(0) + r.type.slice(1).toLowerCase()}
              </p>
            </div>
          </div>
          <RAGBadge status={milestoneToRAG(r.milestoneStatus)} label={r.milestoneStatus.replace(/_/g, " ")} />
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Progress</span>
            <span className="font-medium">{r.progress}%</span>
          </div>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${r.progress}%`,
                backgroundColor: r.progress >= 80 ? "#22c55e" : r.progress >= 40 ? "#f59e0b" : "#ef4444",
              }}
            />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="text-center">
            <p className="text-xs text-slate-500 truncate">Projects</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{r.projectCount}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500 truncate">On Track</p>
            <p className="text-lg font-bold text-green-600">{r.onTrackCount}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500 truncate">Deviating</p>
            <p className="text-lg font-bold text-amber-600">{r.deviatingCount}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500 truncate">High Risk</p>
            <p className="text-lg font-bold text-red-600">{r.highRiskCount}</p>
          </div>
        </div>

        {/* KPI chips */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-50 dark:bg-slate-700/50 px-2 py-1 rounded">
            <DollarSign className="w-3 h-3" /> Budget: {utilization}%
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-50 dark:bg-slate-700/50 px-2 py-1 rounded">
            <TrendingUp className="w-3 h-3" /> RTD: {r.avgRtd}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-50 dark:bg-slate-700/50 px-2 py-1 rounded">
            <Clock className="w-3 h-3" /> {new Date(r.targetDate).toLocaleDateString()}
          </span>
        </div>

        {/* Project status badges */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {r.onTrackCount > 0 && <RAGBadge status="green" label={`${r.onTrackCount} on track`} />}
          {r.deviatingCount > 0 && <RAGBadge status="amber" label={`${r.deviatingCount} deviating`} />}
          {r.highRiskCount > 0 && <RAGBadge status="red" label={`${r.highRiskCount} high risk`} />}
        </div>
      </div>

      <div className="border-t border-slate-100 dark:border-slate-700 px-5 py-3">
        <button
          onClick={onView}
          className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
        >
          View details <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
