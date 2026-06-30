import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { Map, ArrowLeft, Loader2, DollarSign, TrendingUp, Clock } from "lucide-react";
import { roadmapMonitoringApi } from "../api/project.api";
import { PageHeader, KpiCardGrid, ChartGrid, ChartCard, StatCard } from "../components/ui/DashboardGrid";
import { RAGBadge, milestoneToRAG, projectStatusToRAG, goLiveToRAG } from "../components/ui/RAGBadge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const STATUS_COLORS: Record<string, string> = { ON_TRACK: "#22c55e", DEVIATING: "#f59e0b", HIGH_RISK: "#ef4444" };

export default function RoadmapDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["roadmap-detail", id],
    queryFn: () => roadmapMonitoringApi.getDetail(id!).then(r => r.data.data),
    enabled: !!id,
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>;
  if (!data) return <div className="text-center py-16 text-slate-400">Roadmap not found</div>;

  const statusData = [
    { name: "On Track", value: data.projects.filter(p => p.status === "ON_TRACK").length },
    { name: "Deviating", value: data.projects.filter(p => p.status === "DEVIATING").length },
    { name: "High Risk", value: data.projects.filter(p => p.status === "HIGH_RISK").length },
  ];
  const totalBudget = data.projects.reduce((s, p) => s + p.initialBudget, 0);
  const totalConsumed = data.projects.reduce((s, p) => s + p.consumedBudget, 0);
  const utilization = totalBudget > 0 ? Math.round((totalConsumed / totalBudget) * 100) : 0;

  return (
    <div>
      <button
        onClick={() => navigate("/roadmaps")}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to roadmaps
      </button>

      <PageHeader
        title={data.name}
        description={`${data.type.charAt(0) + data.type.slice(1).toLowerCase()} roadmap · Lead: ${data.leadOwner} · Target: ${new Date(data.targetDate).toLocaleDateString()}`}
        icon={Map}
      />

      <div className="mb-4">
        <RAGBadge status={milestoneToRAG(data.milestoneStatus)} label={`Milestone: ${data.milestoneStatus.replace(/_/g, " ")}`} />
      </div>

      {/* Progress bar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm mb-6">
        <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 mb-2">
          <span className="font-medium">Overall Progress</span>
          <span className="font-bold text-slate-900 dark:text-white">{data.progress}%</span>
        </div>
        <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${data.progress}%`,
              backgroundColor: data.progress >= 80 ? "#22c55e" : data.progress >= 40 ? "#f59e0b" : "#ef4444",
            }}
          />
        </div>
      </div>

      <KpiCardGrid>
        <StatCard label="Total Projects" value={data.projects.length} icon={Map} color="text-blue-600 bg-blue-50" />
        <StatCard label="Budget Utilization" value={`${utilization}%`} icon={DollarSign} sub={`${(totalConsumed / 1000).toFixed(0)}K / ${(totalBudget / 1000).toFixed(0)}K €`} />
        <StatCard label="Avg RTD" value={data.projects.reduce((s, p) => s + p.rtdValue, 0) / (data.projects.length || 1)} icon={TrendingUp} />
        <StatCard label="Projects on Track" value={statusData[0].value} icon={Clock} color="text-green-600 bg-green-50" />
      </KpiCardGrid>

      <ChartGrid cols={2}>
        <ChartCard title="Project Status Distribution">
          {statusData.some(d => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {statusData.map((d) => (
                    <Cell key={d.name} fill={STATUS_COLORS[d.name === "On Track" ? "ON_TRACK" : d.name === "Deviating" ? "DEVIATING" : "HIGH_RISK"] || "#94a3b8"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-sm text-slate-400">No project data</div>
          )}
        </ChartCard>

        <ChartCard title="Project List">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left px-2 py-2 text-xs font-semibold text-slate-500 uppercase">Project</th>
                  <th className="text-left px-2 py-2 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="text-right px-2 py-2 text-xs font-semibold text-slate-500 uppercase">RTD</th>
                  <th className="text-right px-2 py-2 text-xs font-semibold text-slate-500 uppercase">Slippage</th>
                  <th className="text-right px-2 py-2 text-xs font-semibold text-slate-500 uppercase">Budget</th>
                  <th className="text-center px-2 py-2 text-xs font-semibold text-slate-500 uppercase">Go-Live</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {data.projects.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-2 py-2.5">
                      <p className="font-medium text-slate-900 dark:text-white">{p.name}</p>
                      <p className="text-xs text-slate-400">{p.code} · {p.manager}</p>
                    </td>
                    <td className="px-2 py-2.5">
                      <RAGBadge status={projectStatusToRAG(p.status)} label={p.status.replace(/_/g, " ")} />
                    </td>
                    <td className="px-2 py-2.5 text-right font-mono text-sm text-slate-700 dark:text-slate-300">{p.rtdValue}</td>
                    <td className="px-2 py-2.5 text-right font-mono text-sm text-slate-700 dark:text-slate-300">{p.slippageMd}d</td>
                    <td className="px-2 py-2.5 text-right font-mono text-sm text-slate-700 dark:text-slate-300">{(p.consumedBudget / 1000).toFixed(0)}K</td>
                    <td className="px-2 py-2.5 text-center">
                      <RAGBadge status={goLiveToRAG(p.goLiveReadinessState)} label={p.goLiveReadinessState} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </ChartGrid>
    </div>
  );
}
