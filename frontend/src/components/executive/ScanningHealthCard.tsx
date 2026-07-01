import { ScanHealthCardData } from "../../types/nexus";
import { Clock, FileText, Activity, TrendingUp, Shield } from "lucide-react";

const statusColors: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  fresh: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", label: "Fresh" },
  aging: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", label: "Aging" },
  stale: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500", label: "Stale" },
};

interface Props {
  data: ScanHealthCardData;
}

export function ScanningHealthCard({ data }: Props) {
  const colors = statusColors[data.status] || statusColors.stale;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50">
            <Activity className="w-4 h-4 text-indigo-500" />
          </div>
          <span className="text-[11px] font-semibold text-slate-500 tracking-wide uppercase">
            Scanning Health
          </span>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${colors.bg} ${colors.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
          {colors.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <MetricRow icon={Clock} label="Latest Scan" value={data.latestScanAge} />
        <MetricRow icon={FileText} label="Total Reports" value={data.totalReports} />
        <MetricRow icon={TrendingUp} label="Avg Frequency" value={data.avgFrequency} />
        <MetricRow icon={Shield} label="Coverage" value={`${data.coverageRate}%`} />
      </div>

      {data.trendPct !== 0 && (
        <div className={`text-[11px] flex items-center gap-1 ${data.trendPct > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
          <TrendingUp className="w-3 h-3" />
          <span>{data.trendPct > 0 ? '+' : ''}{data.trendPct}% vs last month</span>
        </div>
      )}
    </div>
  );
}

function MetricRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="w-3 h-3 text-slate-400 shrink-0" />
      <span className="text-slate-500 text-[11px]">{label}</span>
      <span className="ml-auto font-semibold text-slate-800 text-xs">{value}</span>
    </div>
  );
}
