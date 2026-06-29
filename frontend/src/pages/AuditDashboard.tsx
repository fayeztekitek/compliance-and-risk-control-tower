import { useQuery } from "@tanstack/react-query";
import { FileCheck, AlertTriangle, CheckCircle, Clock, ListTodo, Loader2 } from "lucide-react";
import { fetchAuditDashboard } from "../api/dashboard.api";
import ExportButton from "../components/ui/ExportButton";

const SEV_BADGE: Record<string, string> = {
  critical: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  low: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
};

export default function AuditDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["audit-dashboard"],
    queryFn: fetchAuditDashboard,
    refetchInterval: 30000,
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>;

  const k = data?.kpis;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FileCheck className="w-6 h-6 text-indigo-500" /> Audit Dashboard
        </h1>
        <p className="text-sm text-slate-500 mt-1">Executive overview of audit activities, findings, and corrective actions</p>
      </div>
      <div className="mb-4 flex justify-end gap-2">
        <ExportButton data={data?.upcomingAudits || []} filename="audit-upcoming" label="Audits CSV" />
        <ExportButton data={data?.recentFindings || []} filename="audit-findings" label="Findings CSV" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Audits", value: k?.total_audits || 0, icon: FileCheck, color: "text-blue-600 bg-blue-50 dark:bg-blue-500/10", sub: `${k?.in_progress || 0} in progress` },
          { label: "Open Findings", value: k?.open_findings || 0, icon: AlertTriangle, color: "text-red-600 bg-red-50 dark:bg-red-500/10", sub: `${k?.critical_findings || 0} critical` },
          { label: "Open CAPAs", value: k?.open_capa || 0, icon: ListTodo, color: "text-amber-600 bg-amber-50 dark:bg-amber-500/10" },
          { label: "Completed CAPAs", value: k?.completed_capa || 0, icon: CheckCircle, color: "text-green-600 bg-green-50 dark:bg-green-500/10" },
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
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Upcoming Audits</h3>
          {data?.upcomingAudits && data.upcomingAudits.length > 0 ? (
            <div className="space-y-2">
              {data.upcomingAudits.map((a) => (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                  <Clock className="w-4 h-4 text-blue-500 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{a.title}</p>
                    <p className="text-xs text-slate-500">{a.scheduled_date ? new Date(a.scheduled_date).toLocaleDateString() : "Not scheduled"}</p>
                  </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${
                    a.status === "PLANNED" ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300" :
                    a.status === "IN_PROGRESS" ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300" : ""
                  }`}>{a.status.replace(/_/g, " ")}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-sm text-slate-400">No upcoming audits</div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Recent Open Findings</h3>
          {data?.recentFindings && data.recentFindings.length > 0 ? (
            <div className="space-y-2">
              {data.recentFindings.map((f) => (
                <div key={f.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{f.title}</p>
                    <p className="text-xs text-slate-500">{f.audit_title}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${SEV_BADGE[f.severity?.toLowerCase()] || ""}`}>{f.severity}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-sm text-slate-400">No open findings</div>
          )}
        </div>
      </div>
    </div>
  );
}
