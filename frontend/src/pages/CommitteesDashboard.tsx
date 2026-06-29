import { useQuery } from "@tanstack/react-query";
import { Users, CalendarCheck, XCircle, ThumbsUp, ThumbsDown, Clock, Loader2 } from "lucide-react";
import { fetchCommitteesDashboard } from "../api/dashboard.api";
import ExportButton from "../components/ui/ExportButton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";

const COLORS = ["#22c55e", "#ef4444", "#f59e0b", "#3b82f6", "#8b5cf6", "#ec4899"];

export default function CommitteesDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["committees-dashboard"],
    queryFn: fetchCommitteesDashboard,
    refetchInterval: 30000,
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>;

  const k = data?.kpis;

  const committeeByType = [
    { name: "VEG", value: k?.veg_committee || 0 },
    { name: "Vuln", value: k?.vuln_committee || 0 },
    { name: "SaaS", value: k?.saas_steering || 0 },
    { name: "Exec Sec", value: k?.exec_security || 0 },
    { name: "Exec Arb", value: k?.exec_arbitration || 0 },
  ].filter((d) => d.value > 0);

  const decisionData = [
    { name: "Approved", value: k?.approved || 0 },
    { name: "Rejected", value: k?.rejected || 0 },
    { name: "Deferred", value: k?.deferred || 0 },
  ].filter((d) => d.value > 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Users className="w-6 h-6 text-indigo-500" /> Committees Dashboard
        </h1>
        <p className="text-sm text-slate-500 mt-1">Oversight of governance committees, meetings, and decisions</p>
      </div>
      <div className="mb-4 flex justify-end gap-2">
        <ExportButton data={data?.upcomingCommittees || []} filename="committees-upcoming" label="Committees CSV" />
        <ExportButton data={data?.recentDecisions || []} filename="committees-decisions" label="Decisions CSV" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Committees", value: k?.total_committees || 0, icon: Users, color: "text-blue-600 bg-blue-50 dark:bg-blue-500/10" },
          { label: "Planned", value: k?.planned || 0, icon: CalendarCheck, color: "text-green-600 bg-green-50 dark:bg-green-500/10", sub: `${k?.held || 0} held / ${k?.cancelled || 0} cancelled` },
          { label: "Total Decisions", value: k?.total_decisions || 0, icon: ThumbsUp, color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10", sub: `${k?.approved || 0} approved` },
          { label: "Rejected", value: k?.rejected || 0, icon: ThumbsDown, color: "text-red-600 bg-red-50 dark:bg-red-500/10" },
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
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Committees by Type</h3>
          {committeeByType.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={committeeByType}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {committeeByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-sm text-slate-400">No committee data available</div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Decision Outcomes</h3>
          {decisionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={decisionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {decisionData.map((_, i) => <Cell key={i} fill={["#22c55e", "#ef4444", "#f59e0b"][i]} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-sm text-slate-400">No decision data available</div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Upcoming Committees (30 days)</h3>
          {data?.upcomingCommittees && data.upcomingCommittees.length > 0 ? (
            <div className="space-y-2">
              {data.upcomingCommittees.map((c) => (
                <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                  <CalendarCheck className="w-4 h-4 text-indigo-500 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{c.name}</p>
                    <p className="text-xs text-slate-500">{c.date} &middot; {c.type.replace(/_/g, " ")}</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 capitalize">{c.status.toLowerCase()}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-sm text-slate-400">No upcoming committees</div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Recent Decisions</h3>
          {data?.recentDecisions && data.recentDecisions.length > 0 ? (
            <div className="space-y-2">
              {data.recentDecisions.map((d) => (
                <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                  <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{d.title}</p>
                    <p className="text-xs text-slate-500">{d.committee_name} &middot; {d.created_at ? new Date(d.created_at).toLocaleDateString() : ""}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${
                    d.outcome === "APPROVED" ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300" :
                    d.outcome === "REJECTED" ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300" :
                    "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                  }`}>{d.outcome.toLowerCase()}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-sm text-slate-400">No recent decisions</div>
          )}
        </div>
      </div>
    </div>
  );
}
