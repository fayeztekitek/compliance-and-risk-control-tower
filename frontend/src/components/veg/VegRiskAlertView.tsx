import { ShieldAlert, Shield, ShieldCheck } from "lucide-react";
import type { VegDashboardRiskLevel } from "../../api/veg.api";

const RISK_CONFIG: Record<string, { color: string; bg: string; icon: React.ElementType; label: string }> = {
  High: { color: "text-red-700", bg: "bg-red-50 border-red-200", icon: ShieldAlert, label: "High Risk" },
  Medium: { color: "text-orange-700", bg: "bg-orange-50 border-orange-200", icon: Shield, label: "Medium Risk" },
  Low: { color: "text-green-700", bg: "bg-green-50 border-green-200", icon: ShieldCheck, label: "Low Risk" },
};

export default function VegRiskAlertView({ distribution, total }: { distribution: VegDashboardRiskLevel[]; total: number }) {
  const high = distribution.find(d => d.risk_level === "High");
  const medium = distribution.find(d => d.risk_level === "Medium");
  const low = distribution.find(d => d.risk_level === "Low");

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <h3 className="font-semibold text-slate-900 mb-3">Risk & Alert Distribution</h3>
      <div className="grid grid-cols-3 gap-3">
        {(["High", "Medium", "Low"] as const).map(level => {
          const cfg = RISK_CONFIG[level];
          const Icon = cfg.icon;
          const count = distribution.find(d => d.risk_level === level)?.count;
          const pct = count ? (parseInt(count) / total * 100).toFixed(0) : "0";
          return (
            <div key={level} className={`rounded-lg border p-4 ${cfg.bg}`}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-5 h-5 ${cfg.color}`} />
                <span className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</span>
              </div>
              <p className={`text-2xl font-bold ${cfg.color}`}>{count || "0"}</p>
              <p className="text-xs text-slate-500 mt-0.5">{pct}% of total</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
