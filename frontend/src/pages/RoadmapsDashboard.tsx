import { useQuery } from "@tanstack/react-query";
import { Map, TrendingUp, AlertTriangle, Loader2 } from "lucide-react";
import { fetchRoadmapsDashboard } from "../api/dashboard.api";
import { PageHeader, KpiCardGrid, ChartGrid, ChartCard, StatCard } from "../components/ui/DashboardGrid";
import { RAGBadge, milestoneToRAG } from "../components/ui/RAGBadge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";

const MILESTONE_COLORS: Record<string, string> = { ON_TIME: "#22c55e", DELAYED: "#f59e0b", CRITICAL: "#ef4444" };

export default function RoadmapsDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["roadmaps-dashboard"],
    queryFn: fetchRoadmapsDashboard,
    refetchInterval: 30000,
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>;

  const k = data?.kpis;
  const milestoneData = data?.milestoneStatusDistribution?.map((m) => ({ name: m.status.replace(/_/g, " "), value: m.count })) || [];

  return (
    <div>
      <PageHeader
        title="Roadmaps Dashboard"
        description="Strategic roadmap progress and milestone tracking"
        icon={Map}
      />

      <KpiCardGrid>
        <StatCard label="Total Roadmaps" value={k?.total_roadmaps || 0} icon={Map} color="text-blue-600 bg-blue-50 dark:bg-blue-500/10" />
        <StatCard label="Avg Progress" value={k?.avg_progress ? `${k.avg_progress}%` : "N/A"} icon={TrendingUp} color="text-green-600 bg-green-50 dark:bg-green-500/10" sub={`${k?.strategic || 0} strategic / ${k?.regulatory || 0} regulatory`} />
        <StatCard label="On Time" value={k?.on_time || 0} icon={TrendingUp} color="text-green-600 bg-green-50 dark:bg-green-500/10" />
        <StatCard label="Critical" value={k?.critical || 0} icon={AlertTriangle} color="text-red-600 bg-red-50 dark:bg-red-500/10" sub={`${k?.delayed || 0} delayed`} />
      </KpiCardGrid>

      <ChartGrid cols={2}>
        <ChartCard title="Milestone Status">
          {milestoneData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={milestoneData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {milestoneData.map((m) => {
                    const key = m.name.replace(" ", "_");
                    return <Cell key={m.name} fill={MILESTONE_COLORS[key] || "#94a3b8"} />;
                  })}
                </Pie>
                <Legend formatter={(value) => <span className="text-xs text-slate-600">{value}</span>} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-sm text-slate-400">No milestone data</div>
          )}
          <div className="flex flex-wrap gap-3 mt-3">
            {data?.milestoneStatusDistribution?.map((m) => (
              <div key={m.status} className="flex items-center gap-1.5">
                <RAGBadge status={milestoneToRAG(m.status)} label={`${m.status.replace(/_/g, " ")}: ${m.count}`} />
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Roadmap Progress Distribution">
          {data?.milestoneStatusDistribution && data.milestoneStatusDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={milestoneData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {milestoneData.map((m) => {
                    const key = m.name.replace(" ", "_");
                    return <Cell key={m.name} fill={MILESTONE_COLORS[key] || "#94a3b8"} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-sm text-slate-400">No progress data</div>
          )}
        </ChartCard>
      </ChartGrid>
    </div>
  );
}
