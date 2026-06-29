import { useQuery } from "@tanstack/react-query";
import { Shield, AlertTriangle, Bug, Skull, Loader2 } from "lucide-react";
import { fetchRiskDashboard } from "../api/dashboard.api";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import ExportButton from "../components/ui/ExportButton";

const SEV_COLORS: Record<string, string> = { critical: "#ef4444", high: "#f97316", medium: "#f59e0b", low: "#3b82f6" };

export default function RiskDashboard() {
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
          <AlertOctagon className="w-6 h-6 text-indigo-500" /> Risk Dashboard
        </h1>
        <p className="text-sm text-slate-500 mt-1">KRI monitoring, vulnerability severity, and waiver expiration tracking</p>
      </div>
      <div className="mb-4 flex justify-end gap-2">
        <ExportButton data={data?.severityDistribution || []} filename="risk-severity" label="Severity CSV" />
        <ExportButton data={data?.waiversExpiringSoon || []} filename="risk-waivers" label="Waivers CSV" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Vulnerabilities", value: k?.total_vulnerabilities || 0, icon: Bug, color: "text-slate-600 bg-slate-50 dark:bg-slate-700" },
          { label: "Open Critical", value: k?.open_critical || 0, icon: AlertTriangle, color: "text-red-600 bg-red-50 dark:bg-red-500/10" },
          { label: "Open High", value: k?.high || 0, icon: AlertTriangle, color: "text-orange-600 bg-orange-50 dark:bg-orange-500/10" },
          { label: "Open SLA Breaches", value: k?.open_sla_breaches || 0, icon: Clock, color: "text-amber-600 bg-amber-50 dark:bg-amber-500/10" },
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
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-sm text-slate-400">No vulnerability data available</div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Waivers Expiring Soon (14 days)</h3>
          {data?.waiversExpiringSoon && data.waiversExpiringSoon.length > 0 ? (
            <div className="space-y-2">
              {data.waiversExpiringSoon.map((w) => (
                <div key={w.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                  <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{w.rationale || w.vulnerability_id}</p>
                    <p className="text-xs text-slate-500">Expires {new Date(w.expiry_date).toLocaleDateString()}</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0">
                    {Math.ceil((new Date(w.expiry_date).getTime() - Date.now()) / 86400000)}d
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-sm text-slate-400">No waivers expiring soon</div>
          )}
        </div>
      </div>
    </div>
  );
}
