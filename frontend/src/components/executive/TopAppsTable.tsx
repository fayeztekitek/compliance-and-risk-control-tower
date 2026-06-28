import { ShieldAlert } from "lucide-react";
import { TopRiskyAppItem } from "../../types/nexus";

interface Props {
  data: TopRiskyAppItem[];
}

export function TopAppsTable({ data }: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">Top 5 Applications by Open Vulnerabilities</h3>
      <div className="space-y-2">
        {data.map((app, i) => (
          <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
            <span className="text-xs font-bold text-slate-400 w-5 text-center shrink-0">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700 truncate">{app.applicationName}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {app.criticalCount > 0 && (
                  <span className="text-xs font-medium text-red-600 flex items-center gap-0.5">
                    <ShieldAlert className="w-3 h-3" />{app.criticalCount} critical
                  </span>
                )}
                {app.highCount > 0 && (
                  <span className="text-xs font-medium text-orange-600">{app.highCount} high</span>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-lg font-bold text-slate-800">{app.totalOpen}</p>
              <p className="text-[11px] text-slate-400">open</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
