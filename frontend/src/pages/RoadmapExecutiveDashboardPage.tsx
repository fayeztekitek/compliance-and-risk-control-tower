import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp, AlertTriangle, DollarSign, Clock, Loader2, Brain } from "lucide-react";
import { fetchRoadmapExecutiveDashboard } from "../api/dashboard.api";
import { PageHeader, KpiCardGrid, ChartGrid, ChartCard, StatCard } from "../components/ui/DashboardGrid";
import AiInsightCard from "../components/ui/AiInsightCard";
import RAGBadge, { milestoneToRAG, projectToRAG } from "../components/ui/RAGBadge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, Legend, LineChart, Line,
} from "recharts";

const TYPE_COLORS: Record<string, string> = { STRATEGIC: "#6366f1", BUDGETARY: "#22c55e", REGULATORY: "#f59e0b" };
const STATUS_COLORS: Record<string, string> = { ON_TRACK: "#22c55e", DEVIATING: "#f59e0b", HIGH_RISK: "#ef4444" };
const TREND_COLORS: Record<string, string> = { avg_rtd: "#6366f1", avg_deviation: "#f59e0b" };

const formatCurrency = (v: number) => v >= 1e6 ? `$${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `$${(v / 1e3).toFixed(1)}K` : `$${v}`;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-medium text-slate-900 dark:text-white mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-slate-600 dark:text-slate-400">{p.name}:</span>
          <span className="font-medium text-slate-900 dark:text-white">{typeof p.value === "number" ? p.value.toFixed(1) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function RoadmapExecutiveDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["roadmap-executive-dashboard"],
    queryFn: fetchRoadmapExecutiveDashboard,
    refetchInterval: 30000,
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>;

  const k = data?.kpis;
  const milestoneData = data?.milestoneStatusDistribution?.map(m => ({ ...m, name: m.name.replace(/_/g, " ") })) || [];
  const typeData = data?.typeDistribution || [];
  const trendData = data?.snapshotTrend || [];

  return (
    <div>
      <PageHeader
        title="Roadmap Executive Dashboard"
        description="Executive KPIs for roadmap portfolio health, capacity, and release progress"
        icon={BarChart3}
      />

      {/* KPI Cards */}
      <KpiCardGrid>
        <StatCard label="Total Roadmaps" value={k?.totalRoadmaps || 0} icon={BarChart3} color="text-blue-600 bg-blue-50 dark:bg-blue-500/10" />
        <StatCard label="Avg Progress" value={k?.avgProgress ? `${k.avgProgress}%` : "N/A"} icon={TrendingUp} color="text-green-600 bg-green-50 dark:bg-green-500/10" />
        <StatCard label="Total Projects" value={k?.totalProjects || 0} icon={BarChart3} color="text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10" sub={`${k?.onTrack || 0} on track`} />
        <StatCard label="Avg RTD" value={k?.avgRtd?.toFixed(1) || "0"} icon={TrendingUp} color="text-purple-600 bg-purple-50 dark:bg-purple-500/10" sub={`deviation ${k?.avgRtdDeviation?.toFixed(1) || "0"}`} />
        <StatCard label="Capacity Gap" value={k?.capacityGap || 0} icon={AlertTriangle} color="text-red-600 bg-red-50 dark:bg-red-500/10" sub={`${k?.capacityUtilization || 0}% utilized`} />
        <StatCard label="Budget Burn" value={k?.burnRate ? `${k.burnRate}%` : "N/A"} icon={DollarSign} color="text-amber-600 bg-amber-50 dark:bg-amber-500/10" sub={formatCurrency(k?.totalConsumed || 0)} />
        <StatCard label="Overrun Projects" value={k?.overrunCount || 0} icon={AlertTriangle} color="text-red-600 bg-red-50 dark:bg-red-500/10" sub={formatCurrency(k?.totalOverrun || 0)} />
        <StatCard label="Delayed/At Risk" value={(k?.deviating || 0) + (k?.highRisk || 0)} icon={Clock} color="text-orange-600 bg-orange-50 dark:bg-orange-500/10" sub={`${k?.deviating || 0} deviating / ${k?.highRisk || 0} high risk`} />
      </KpiCardGrid>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
        {/* RTD Evolution */}
        <ChartCard title="RTD Evolution (monthly)">
          {trendData.length > 1 ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="avg_rtd" stroke={TREND_COLORS.avg_rtd} name="Avg RTD" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="avg_deviation" stroke={TREND_COLORS.avg_deviation} name="Avg Deviation" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-sm text-slate-400">Not enough snapshot history for RTD trend. Create monthly snapshots first.</div>
          )}
        </ChartCard>

        {/* Capacity Gap */}
        <ChartCard title="Capacity Gap">
          {k ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={[
                { name: "On Track", value: k.onTrack || 0 },
                { name: "Deviating", value: k.deviating || 0 },
                { name: "High Risk", value: k.highRisk || 0 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {[
                    { name: "On Track", fill: "#22c55e" },
                    { name: "Deviating", fill: "#f59e0b" },
                    { name: "High Risk", fill: "#ef4444" },
                  ].map(e => <Cell key={e.name} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-sm text-slate-400">No capacity data</div>
          )}
        </ChartCard>

        {/* Priority Mix (Roadmap Type) */}
        <ChartCard title="Priority Mix (Roadmap Type)">
          {typeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={typeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {typeData.map(e => <Cell key={e.name} fill={TYPE_COLORS[e.name] || "#94a3b8"} />)}
                </Pie>
                <Legend formatter={(value) => <span className="text-xs text-slate-600">{value}</span>} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-sm text-slate-400">No type data</div>
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
        {/* Milestone Status */}
        <ChartCard title="Release Progress (Milestone Status)">
          {milestoneData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={milestoneData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {milestoneData.map(m => <Cell key={m.name} fill={STATUS_COLORS[m.name.replace(" ", "_")] || "#94a3b8"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-sm text-slate-400">No milestone data</div>
          )}
        </ChartCard>

        {/* RTD by Roadmap */}
        <ChartCard title="RTD by Roadmap">
          {data?.rtdByRoadmap && data.rtdByRoadmap.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.rtdByRoadmap} layout="vertical" margin={{ left: 100 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="roadmap_name" tick={{ fontSize: 10 }} width={90} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="avg_rtd" name="Avg RTD" radius={[0, 4, 4, 0]} fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-sm text-slate-400">No per-roadmap RTD data</div>
          )}
        </ChartCard>
      </div>

      {/* RAG Badges summary */}
      <div className="flex flex-wrap gap-2 mb-4">
        {data?.rtdByRoadmap?.map(r => (
          <div key={r.roadmap_name} className="flex items-center gap-1.5 text-xs">
            <RAGBadge status={milestoneToRAG(r.milestone_status)} label={`${r.roadmap_name}: ${r.project_count} projects`} />
          </div>
        ))}
      </div>

      {/* AI Insights Placeholder */}
      <AiInsightCard
        severity="info"
        title="AI Portfolio Insights"
        message="AI-powered trend detection and capacity forecasting will be available here. Currently showing raw KPIs from current roadmap and project data."
        confidence={0}
        actionable
        onDismiss={() => {}}
      />
    </div>
  );
}
