import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar, Legend,
} from "recharts";

const COLORS = ["#6366f1", "#22c55e", "#ef4444", "#f59e0b", "#3b82f6", "#8b5cf6", "#14b8a6", "#f97316"];

interface MonthlyTrend { month: string; tcv: string; count: string; }
interface YoyData { year: string; tcv: string; count: string; won_tcv: string; }
interface DecisionItem { decision: string; count: string; total_tcv: string; }
interface RegionItem { region: string; count: string; total_tcv: string; }

export function TcvTrendChart({ data }: { data: MonthlyTrend[] }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">TCV Trend (Monthly)</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data.map(d => ({ ...d, tcv: parseFloat(d.tcv) }))}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
          <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
          <Tooltip />
          <Line type="monotone" dataKey="tcv" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DecisionPieChart({ data }: { data: DecisionItem[] }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Decision Distribution</h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie data={data.map(d => ({ ...d, count: parseInt(d.count) }))} dataKey="count" nameKey="decision" cx="50%" cy="50%" outerRadius={90} label={({ decision, percent }) => `${decision} ${(percent * 100).toFixed(0)}%`}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RegionalHeatmap({ data }: { data: RegionItem[] }) {
  const maxCount = Math.max(...data.map(d => parseInt(d.count)), 1);
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Regional Activity</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {data.map(r => {
          const intensity = parseInt(r.count) / maxCount;
          const bg = intensity > 0.7 ? "bg-indigo-600 text-white" : intensity > 0.4 ? "bg-indigo-300" : "bg-indigo-100";
          return (
            <div key={r.region} className={`rounded-lg p-3 text-center ${bg}`}>
              <p className="text-xs font-medium truncate">{r.region}</p>
              <p className="text-lg font-bold">{r.count}</p>
              <p className="text-xs opacity-75">{parseFloat(r.total_tcv).toLocaleString()} TCV</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function YoyBarChart({ data }: { data: YoyData[] }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Year-over-Year Comparison</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data.map(d => ({ ...d, tcv: parseFloat(d.tcv), won_tcv: parseFloat(d.won_tcv) }))}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="year" tick={{ fontSize: 11 }} stroke="#94a3b8" />
          <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
          <Tooltip />
          <Legend />
          <Bar dataKey="tcv" fill="#6366f1" name="Total TCV" radius={[4, 4, 0, 0]} />
          <Bar dataKey="won_tcv" fill="#22c55e" name="Won TCV" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
