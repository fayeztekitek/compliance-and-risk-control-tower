import { useQuery } from "@tanstack/react-query";
import { Loader2, Briefcase, TrendingUp, AlertTriangle, DollarSign, CheckCircle } from "lucide-react";
import { fetchProjectsDashboard } from "../api/dashboard.api";
import { PageHeader, KpiCardGrid, ChartGrid, ChartCard } from "../components/ui/DashboardGrid";
import { StatCard } from "../components/ui/DashboardGrid";
import { RAGBadge, projectStatusToRAG, goLiveToRAG } from "../components/ui/RAGBadge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const STATUS_COLORS: Record<string, string> = { ON_TRACK: "#22c55e", DEVIATING: "#f59e0b", HIGH_RISK: "#ef4444" };
const GO_LIVE_COLORS: Record<string, string> = { READY: "#22c55e", RISKY: "#f59e0b", BLOCKED: "#ef4444" };

export default function ProjectsDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["projects-dashboard"],
    queryFn: fetchProjectsDashboard,
    refetchInterval: 30000,
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>;

  const k = data?.kpis;

  return (
    <div>
      <PageHeader
        title="Projects Dashboard"
        description="Project health, budget tracking, and go-live readiness"
        icon={Briefcase}
      />

      <KpiCardGrid>
        <StatCard label="Total Projects" value={k?.total_projects || 0} icon={Briefcase} color="text-blue-600 bg-blue-50 dark:bg-blue-500/10" />
        <StatCard label="On Track" value={k?.on_track || 0} icon={CheckCircle} color="text-green-600 bg-green-50 dark:bg-green-500/10" />
        <StatCard label="Deviating" value={k?.deviating || 0} icon={TrendingUp} color="text-amber-600 bg-amber-50 dark:bg-amber-500/10" />
        <StatCard label="High Risk" value={k?.high_risk || 0} icon={AlertTriangle} color="text-red-600 bg-red-50 dark:bg-red-500/10" sub={`Avg slippage: ${k?.avg_slippage_md || 0} days`} />
      </KpiCardGrid>

      <KpiCardGrid>
        <StatCard label="Avg RTD" value={k?.avg_rtd || 0} icon={TrendingUp} sub={`Deviation: ${k?.avg_rtd_deviation || 0}%`} />
        <StatCard label="Budget Utilized" value={`${k?.utilization_pct || 0}%`} icon={DollarSign} sub={`${(k?.total_consumed || 0).toLocaleString()} / ${(k?.total_budget || 0).toLocaleString()} €`} />
        <StatCard label="Avg Test Automation" value={`${k?.avg_test_automation || 0}%`} icon={CheckCircle} />
        <StatCard label="Avg Slippage" value={`${k?.avg_slippage_md || 0} days`} icon={AlertTriangle} color="text-orange-600 bg-orange-50 dark:bg-orange-500/10" />
      </KpiCardGrid>

      <ChartGrid cols={2}>
        <ChartCard title="Project Health">
          {data?.statusDistribution && data.statusDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.statusDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {data.statusDistribution.map((e) => (
                    <Cell key={e.status} fill={STATUS_COLORS[e.status] || "#94a3b8"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-sm text-slate-400">No project data</div>
          )}
          <div className="flex flex-wrap gap-3 mt-3">
            {data?.statusDistribution.map((s) => (
              <div key={s.status} className="flex items-center gap-1.5">
                <RAGBadge status={projectStatusToRAG(s.status)} label={`${s.status.replace(/_/g, " ")}: ${s.count}`} />
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Go-Live Readiness">
          {data?.goLiveReadiness && data.goLiveReadiness.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={data.goLiveReadiness} dataKey="count" nameKey="state" cx="50%" cy="50%" outerRadius={80} label>
                  {data.goLiveReadiness.map((e) => (
                    <Cell key={e.state} fill={GO_LIVE_COLORS[e.state] || "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend formatter={(value) => <span className="text-xs text-slate-600">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-sm text-slate-400">No readiness data</div>
          )}
          <div className="flex flex-wrap gap-3 mt-3">
            {data?.goLiveReadiness.map((g) => (
              <div key={g.state} className="flex items-center gap-1.5">
                <RAGBadge status={goLiveToRAG(g.state)} label={`${g.state}: ${g.count}`} />
              </div>
            ))}
          </div>
        </ChartCard>
      </ChartGrid>
    </div>
  );
}
