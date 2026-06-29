import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { VegDashboardWorkload } from "../../api/veg.api";

function WorkloadBar({ data, title, labelKey = "label" }: { data: VegDashboardWorkload[]; title: string; labelKey?: string }) {
  const sorted = [...data].sort((a, b) => (parseFloat(b.wl_ps_md) + parseFloat(b.wl_investment_md)) - (parseFloat(a.wl_ps_md) + parseFloat(a.wl_investment_md))).slice(0, 15);
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <h4 className="text-sm font-semibold text-slate-900 mb-3">{title}</h4>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={sorted} layout="vertical" margin={{ left: 20, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey={labelKey} tick={{ fontSize: 10 }} width={100} />
          <Tooltip />
          <Legend />
          <Bar dataKey="wl_ps_md" name="WL PS MD" stackId="a" fill="#6366f1" />
          <Bar dataKey="wl_investment_md" name="WL Investment MD" stackId="a" fill="#f59e0b" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChronosComparison({ data }: { data: VegDashboardWorkload[] }) {
  const sorted = [...data].sort((a, b) => (parseFloat(b.wl_ps_md) + parseFloat(b.wl_investment_md)) - (parseFloat(a.wl_ps_md) + parseFloat(a.wl_investment_md))).slice(0, 12);
  const chartData = sorted.map(d => ({
    label: d.label,
    "VEG Total MD": Math.round(parseFloat(d.wl_ps_md) + parseFloat(d.wl_investment_md)),
    "Chronos WL MD": Math.round(parseFloat(d.chronos_wl_md)),
  }));
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <h4 className="text-sm font-semibold text-slate-900 mb-3">Chronos WL MD vs VEG Workload</h4>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="label" tick={{ fontSize: 10 }} width={100} />
          <Tooltip />
          <Legend />
          <Bar dataKey="VEG Total MD" fill="#6366f1" radius={[0, 4, 4, 0]} />
          <Bar dataKey="Chronos WL MD" fill="#10b981" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface Props {
  workloadByProduct: VegDashboardWorkload[];
  workloadByOwner: VegDashboardWorkload[];
  workloadByRegion: VegDashboardWorkload[];
}

export default function VegWorkloadCharts({ workloadByProduct, workloadByOwner, workloadByRegion }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <WorkloadBar data={workloadByProduct} title="WL PS VEG MD by Product" />
      <WorkloadBar data={workloadByOwner} title="Workload by Business Owner" labelKey="label" />
      <WorkloadBar data={workloadByRegion} title="Workload by Region" />
      <ChronosComparison data={workloadByProduct} />
    </div>
  );
}
