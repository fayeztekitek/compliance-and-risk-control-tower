import { Plus, Briefcase, DollarSign, CheckCircle, XCircle, BarChart3, Users, Globe } from "lucide-react";
import { DecisionBadge } from "../ui/Badge";
import { fmtNum, fmtK } from "../../utils/veg";
import { TcvTrendChart, DecisionPieChart, RegionalHeatmap, YoyBarChart } from "../charts/VegDealCharts";
import { SkeletonTable } from "../ui/Skeleton";
import type { VegDealStats } from "../../types/veg";

interface Props {
  stats: VegDealStats | undefined;
  statsLoading: boolean;
  monthlyTrend: any;
  yoyData: any;
  onViewList: () => void;
  onCreate: () => void;
}

export default function VegDashboardView({ stats, statsLoading, monthlyTrend, yoyData, onViewList, onCreate }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">VEG Governance</h2>
          <p className="text-sm text-slate-500 mt-1">VEG Committee Deal Register — {stats?.aggregates.total_deals || "..."} deals, {(stats ? fmtK(parseFloat(stats.aggregates.total_tcv)) : "...")} TCV</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onViewList} className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50">View All Deals</button>
          <button onClick={onCreate} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
            <Plus className="w-4 h-4" /> New Deal
          </button>
        </div>
      </div>

      {statsLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-5"><SkeletonTable rows={3} /></div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Briefcase, label: "Total Deals", value: fmtNum(parseInt(stats.aggregates.total_deals)), color: "text-indigo-500" },
              { icon: DollarSign, label: "Total TCV", value: fmtK(parseFloat(stats.aggregates.total_tcv)), sub: `Avg: ${fmtK(parseFloat(stats.aggregates.avg_tcv))}`, color: "text-green-500" },
              { icon: CheckCircle, label: "Won", value: fmtNum(parseInt(stats.aggregates.won_deals)), color: "text-green-500" },
              { icon: XCircle, label: "Lost / Open", value: `${fmtNum(parseInt(stats.aggregates.lost_deals))} / ${fmtNum(parseInt(stats.aggregates.open_deals))}`, color: "text-red-500" },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-5">
                  <div className="flex items-center gap-3 mb-2"><Icon className={`w-5 h-5 ${s.color}`} /><h3 className="text-sm font-medium text-slate-600">{s.label}</h3></div>
                  <p className="text-3xl font-bold text-slate-800">{s.value}</p>
                  {s.sub && <p className="text-xs text-slate-400 mt-1">{s.sub}</p>}
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Decisions</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {(stats.decisions ?? []).map(d => (
                  <div key={d.decision} className="flex items-center justify-between text-sm">
                    <span><DecisionBadge decision={d.decision} /></span>
                    <span className="text-slate-600 font-medium">{fmtNum(parseInt(d.count))}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2"><Users className="w-4 h-4" /> Business Lines</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {(stats.businessLines ?? []).map(b => (
                  <div key={b.business_line} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">{b.business_line}</span>
                    <span className="text-slate-600 font-medium">{fmtNum(parseInt(b.count))}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2"><Globe className="w-4 h-4" /> Regions</h3>
              <div className="space-y-2">{(stats.regions ?? []).map(r => (
                <div key={r.region} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{r.region}</span>
                  <span className="text-slate-600 font-medium">{fmtNum(parseInt(r.count))}</span>
                </div>
              ))}</div>
            </div>
          </div>

          {(monthlyTrend || yoyData) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {monthlyTrend && <TcvTrendChart data={monthlyTrend} />}
              {yoyData && <YoyBarChart data={yoyData} />}
              {stats?.decisions && <DecisionPieChart data={stats.decisions} />}
              {stats?.regions && <RegionalHeatmap data={stats.regions} />}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Top Clients</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {(stats.topClients ?? []).map(c => (
                  <div key={c.client} className="flex items-center justify-between text-sm py-1 border-b border-slate-50">
                    <span className="text-slate-700">{c.client}</span>
                    <span className="text-slate-500 text-xs">{fmtNum(parseInt(c.count))} deals / {fmtK(parseFloat(c.total_tcv))}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Top Business Owners</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {(stats.topOwners ?? []).map(o => (
                  <div key={o.business_owner} className="flex items-center justify-between text-sm py-1 border-b border-slate-50">
                    <span className="text-slate-700">{o.business_owner}</span>
                    <span className="text-slate-500 text-xs">{fmtNum(parseInt(o.count))} deals / {fmtK(parseFloat(o.total_tcv))}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
