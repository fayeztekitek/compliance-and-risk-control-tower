import { useQuery } from "@tanstack/react-query";
import { Scale, Shield, AlertTriangle, CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import { fetchComplianceDashboard } from "../api/dashboard.api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import ExportButton from "../components/ui/ExportButton";

const COLORS = ["#22c55e", "#ef4444", "#f59e0b", "#3b82f6"];

export default function ComplianceDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["compliance-dashboard"],
    queryFn: fetchComplianceDashboard,
    refetchInterval: 30000,
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>;

  const k = data?.kpis;
  const chartData = data?.classificationDistribution?.map((c) => ({ name: c.classification, value: c.count })) || [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Scale className="w-6 h-6 text-indigo-500" /> Compliance Dashboard
        </h1>
        <p className="text-sm text-slate-500 mt-1">Executive overview of compliance posture, controls, and SLA breaches</p>
      </div>
      <div className="mb-4 flex justify-end gap-2">
        <ExportButton data={data?.classificationDistribution || []} filename="compliance-classification" label="Classification CSV" />
        <ExportButton data={data?.upcomingDeadlines || []} filename="compliance-deadlines" label="Deadlines CSV" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Control Pass Rate", value: `${k?.pass_rate || 0}%`, icon: CheckCircle, color: "text-green-600 bg-green-50 dark:bg-green-500/10" },
          { label: "Active Controls", value: k?.total_controls || 0, icon: Shield, color: "text-blue-600 bg-blue-50 dark:bg-blue-500/10", sub: `${k?.passed || 0} passed / ${k?.failed || 0} failed` },
          { label: "Open SLA Breaches", value: k?.open_breaches || 0, icon: AlertTriangle, color: "text-red-600 bg-red-50 dark:bg-red-500/10" },
          { label: "Untested Controls", value: k?.untested || 0, icon: Clock, color: "text-amber-600 bg-amber-50 dark:bg-amber-500/10" },
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Classification Distribution</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-sm text-slate-400">No classification data available</div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Upcoming Deadlines</h3>
          {data?.upcomingDeadlines && data.upcomingDeadlines.length > 0 ? (
            <div className="space-y-2">
              {data.upcomingDeadlines.map((d) => (
                <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                  <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{d.title}</p>
                    <p className="text-xs text-slate-500">{d.due_date ? new Date(d.due_date).toLocaleDateString() : "No due date"}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-sm text-slate-400">No upcoming deadlines</div>
          )}
        </div>
      </div>
    </div>
  );
}
