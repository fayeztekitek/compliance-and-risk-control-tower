import { useQuery } from "@tanstack/react-query";
import { ShieldAlert, Bug, ShieldQuestion, FileText, AlertTriangle, Loader2 } from "lucide-react";
import { fetchRiskDashboard } from "../api/dashboard.api";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const SEV_COLORS: Record<string, string> = { critical: "#ef4444", high: "#f97316", medium: "#f59e0b", low: "#3b82f6" };

export default function SecurityDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["risk-dashboard"],
    queryFn: fetchRiskDashboard,
    refetchInterval: 30000,
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>;

  const k = data?.kpis;
  const pieData = data?.severityDistribution?.map((s) => ({ name: s.severity, value: s.count })) || [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-indigo-500" /> Security Dashboard
        </h1>
        <p className="text-sm text-slate-500 mt-1">Executive overview of security posture, vulnerabilities, and risk acceptances</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Vulnerabilities", value: k?.total_vulnerabilities || 0, icon: Bug, color: "text-slate-600 bg-slate-50 dark:bg-slate-700" },
          { label: "Open Critical", value: k?.open_critical || 0, icon: AlertTriangle, color: "text-red-600 bg-red-50 dark:bg-red-500/10" },
          { label: "Open SLA Breaches", value: k?.open_sla_breaches || 0, icon: ShieldQuestion, color: "text-amber-600 bg-amber-50 dark:bg-amber-500/10" },
          { label: "Reports Available", value: "24", icon: FileText, color: "text-blue-600 bg-blue-50 dark:bg-blue-500/10" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{s.label}</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{s.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${s.color}`}><Icon className="w-5 h-5" /></div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Vulnerability by Severity</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((e) => <Cell key={e.name} fill={SEV_COLORS[e.name.toLowerCase()] || "#94a3b8"} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-sm text-slate-400">No vulnerability data available</div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Recent Alerts</h3>
          <div className="space-y-3">
            {[
              { title: "SLA Breach Detected", desc: `${k?.open_sla_breaches || 0} vulnerabilities exceeded SLA`, type: "error" },
              { title: "Active Vulnerabilities", desc: `${k?.open_vulns || 0} open vulnerabilities require attention`, type: "warning" },
              { title: "Critical Risk Level", desc: `${k?.open_critical || 0} critical vulnerabilities are unresolved`, type: "error" },
            ].map((a) => (
              <div key={a.title} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${a.type === "error" ? "bg-red-500" : "bg-amber-500"}`} />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{a.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
