import { Briefcase, CheckCircle, ThumbsUp, XCircle, DollarSign, Users, Cloud, Cpu, Clock, AlertTriangle, FileSearch, GitBranch, Copy, FileQuestion } from "lucide-react";
import type { VegDashboardKpis } from "../../api/veg.api";

function fmt(n: string | number) {
  const v = typeof n === "string" ? parseFloat(n) : n;
  if (isNaN(v)) return "0";
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
  if (v >= 1_000) return (v / 1_000).toFixed(1) + "K";
  return new Intl.NumberFormat("en-US").format(Math.round(v));
}

function fmtNum(n: string | number) {
  const v = typeof n === "string" ? parseFloat(n) : n;
  if (isNaN(v)) return "0";
  return new Intl.NumberFormat("en-US").format(Math.round(v));
}

interface KpiCardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
  suffix?: string;
}

function KpiCard({ label, value, icon: Icon, color, suffix }: KpiCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}{suffix && <span className="text-sm font-normal text-slate-400 ml-1">{suffix}</span>}</p>
        </div>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function VegKpiCards({ kpis }: { kpis: VegDashboardKpis }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
      <KpiCard label="Total VEG" value={fmtNum(kpis.total_veg)} icon={Briefcase} color="bg-indigo-500" />
      <KpiCard label="GO FINAL" value={fmtNum(kpis.go_final)} icon={CheckCircle} color="bg-green-500" />
      <KpiCard label="GO INITIAL" value={fmtNum(kpis.go_initial)} icon={ThumbsUp} color="bg-blue-500" />
      <KpiCard label="BID" value={fmtNum(kpis.bid)} icon={CheckCircle} color="bg-yellow-500" />
      <KpiCard label="NO GO" value={fmtNum(kpis.no_go)} icon={XCircle} color="bg-red-500" />
      <KpiCard label="TCV K€" value={fmt(kpis.total_tcv)} icon={DollarSign} color="bg-emerald-500" suffix="K€" />
      <KpiCard label="PS K€" value={fmt(kpis.total_ps)} icon={Users} color="bg-cyan-500" suffix="K€" />
      <KpiCard label="SaaS K€" value={fmt(kpis.total_saas)} icon={Cloud} color="bg-purple-500" suffix="K€" />
      <KpiCard label="IP+Maintenance K€" value={fmt(kpis.total_ip_maintenance)} icon={Cpu} color="bg-teal-500" suffix="K€" />
      <KpiCard label="WL PS MD" value={fmtNum(kpis.total_wl_ps_md)} icon={Clock} color="bg-orange-500" suffix="MD" />
      <KpiCard label="WL Investment MD" value={fmtNum(kpis.total_wl_investment_md)} icon={Clock} color="bg-rose-500" suffix="MD" />
      <KpiCard label="Missing CRM" value={fmtNum(kpis.missing_crm)} icon={FileSearch} color="bg-amber-500" />
      <KpiCard label="Missing Chronos" value={fmtNum(kpis.missing_chronos)} icon={GitBranch} color="bg-red-600" />
      <KpiCard label="Duplicates" value={fmtNum(kpis.duplicate_count)} icon={Copy} color="bg-pink-500" />
      <KpiCard label="CRM Delta" value={fmtNum(kpis.delta_crm_count)} icon={AlertTriangle} color="bg-orange-600" />
      <KpiCard label="Incomplete" value={fmtNum(kpis.incomplete_dossier)} icon={FileQuestion} color="bg-slate-500" />
    </div>
  );
}
