import { useQuery } from "@tanstack/react-query";
import { Globe, Shield, AlertTriangle, CheckCircle, Loader2, ArrowUpRight, ArrowRight } from "lucide-react";
import { fetchSaaSDashboard } from "../api/dashboard.api";
import ExportButton from "../components/ui/ExportButton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";

const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function SaaSDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["saas-dashboard"],
    queryFn: fetchSaaSDashboard,
    refetchInterval: 30000,
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>;

  const k = data?.kpis;

  const lifecycleData = data?.lifecycleDistribution?.map((l) => ({ name: l.lifecycle_stage.replace(/_/g, " "), value: l.count })) || [];
  const gdprData = data?.gdprRiskDistribution?.map((g) => ({ name: g.risk_level, value: g.count })) || [];
  const privacyData = data?.privacyDesignStatus?.map((p) => ({ name: p.status.replace(/_/g, " "), value: p.count })) || [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Globe className="w-6 h-6 text-indigo-500" /> SaaS Governance Dashboard
        </h1>
        <p className="text-sm text-slate-500 mt-1">Privacy, compliance, and lifecycle oversight for SaaS applications</p>
      </div>
      <div className="mb-4 flex justify-end gap-2">
        <ExportButton data={data?.lifecycleDistribution || []} filename="saas-lifecycle" label="Lifecycle CSV" />
        <ExportButton data={data?.gdprRiskDistribution || []} filename="saas-gdpr" label="GDPR Risk CSV" />
        <ExportButton data={data?.privacyDesignStatus || []} filename="saas-privacy" label="Privacy CSV" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Applications", value: k?.total_apps || 0, icon: Globe, color: "text-blue-600 bg-blue-50 dark:bg-blue-500/10" },
          { label: "Avg Go-Live Readiness", value: k?.avg_readiness ? `${k.avg_readiness}%` : "N/A", icon: ArrowUpRight, color: "text-green-600 bg-green-50 dark:bg-green-500/10", sub: `${k?.steering_passed || 0} steering passed` },
          { label: "GDPR High Risk", value: k?.gdpr_high || 0, icon: AlertTriangle, color: "text-red-600 bg-red-50 dark:bg-red-500/10" },
          { label: "Privacy Compliant", value: k?.privacy_compliant || 0, icon: Shield, color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10", sub: `${k?.privacy_pending || 0} pending / ${k?.privacy_non_compliant || 0} non-compliant` },
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
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Lifecycle Stage</h3>
          {lifecycleData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={lifecycleData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {lifecycleData.map((_, i) => <Cell key={i} fill={["#3b82f6", "#22c55e", "#ef4444"][i]} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-sm text-slate-400">No lifecycle data</div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">GDPR Risk Impact</h3>
          {gdprData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={gdprData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {gdprData.map((_, i) => <Cell key={i} fill={["#22c55e", "#f59e0b", "#ef4444"][i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-sm text-slate-400">No GDPR risk data</div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Privacy Design Status</h3>
          {privacyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={privacyData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {privacyData.map((_, i) => <Cell key={i} fill={["#22c55e", "#f59e0b", "#ef4444"][i % 3]} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-sm text-slate-400">No privacy status data</div>
          )}
        </div>
      </div>
    </div>
  );
}
