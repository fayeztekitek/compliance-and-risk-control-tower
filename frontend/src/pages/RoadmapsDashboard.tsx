import { useQuery } from "@tanstack/react-query";
import { Map, TrendingUp, AlertTriangle, CheckCircle, DollarSign, Loader2, Clock, Target, ArrowRight } from "lucide-react";
import { fetchRoadmapsDashboard } from "../api/dashboard.api";
import ExportButton from "../components/ui/ExportButton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";

const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function RoadmapsDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["roadmaps-dashboard"],
    queryFn: fetchRoadmapsDashboard,
    refetchInterval: 30000,
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>;

  const k = data?.kpis;

  const budgetUtilization = k?.total_budget ? Math.round((k.total_consumed / k.total_budget) * 100) : 0;
  const milestoneData = data?.milestoneStatusDistribution?.map((m) => ({ name: m.status.replace(/_/g, " "), value: m.count })) || [];
  const projectStatusData = data?.projectStatusDistribution?.map((p) => ({ name: p.status.replace(/_/g, " "), value: p.count })) || [];
  const goLiveData = data?.goLiveReadiness?.map((g) => ({ name: g.state, value: g.count })) || [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Map className="w-6 h-6 text-indigo-500" /> Roadmaps & Projects Dashboard
        </h1>
        <p className="text-sm text-slate-500 mt-1">Strategic roadmap progress, project health, and budget tracking</p>
      </div>
      <div className="mb-4 flex justify-end gap-2">
        <ExportButton data={data?.milestoneStatusDistribution || []} filename="roadmaps-milestones" label="Milestones CSV" />
        <ExportButton data={data?.projectStatusDistribution || []} filename="roadmaps-projects" label="Projects CSV" />
        <ExportButton data={data?.goLiveReadiness || []} filename="roadmaps-go-live" label="Go-Live CSV" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Roadmaps", value: k?.total_roadmaps || 0, icon: Map, color: "text-blue-600 bg-blue-50 dark:bg-blue-500/10" },
          { label: "Avg Progress", value: k?.avg_progress ? `${k.avg_progress}%` : "N/A", icon: TrendingUp, color: "text-green-600 bg-green-50 dark:bg-green-500/10", sub: `${k?.strategic || 0} strategic / ${k?.regulatory || 0} regulatory` },
          { label: "Critical Milestones", value: k?.critical || 0, icon: AlertTriangle, color: "text-red-600 bg-red-50 dark:bg-red-500/10" },
          { label: "Budget Utilized", value: `${budgetUtilization}%`, icon: DollarSign, color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10", sub: `${k?.total_projects || 0} active projects` },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{s.label}</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{s.value}</p>
                  {s.sub && <p className="text-[11px] text-slate-400 mt-0.5">{s.sub}</p>}
                </div>
                <div className={`p-3 rounded-lg ${s.color}`}><Icon className="w-5 h-5" /></div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Milestone Status</h3>
          {milestoneData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={milestoneData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {milestoneData.map((_, i) => <Cell key={i} fill={["#22c55e", "#f59e0b", "#ef4444"][i]} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-sm text-slate-400">No milestone data</div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Project Health</h3>
          {projectStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={projectStatusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {projectStatusData.map((_, i) => <Cell key={i} fill={["#22c55e", "#f59e0b", "#ef4444"][i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-sm text-slate-400">No project data</div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Go-Live Readiness</h3>
          {goLiveData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={goLiveData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {goLiveData.map((_, i) => <Cell key={i} fill={["#22c55e", "#f59e0b", "#ef4444"][i]} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-sm text-slate-400">No go-live data</div>
          )}
        </div>
      </div>
    </div>
  );
}
