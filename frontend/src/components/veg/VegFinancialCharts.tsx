import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from "recharts";
import type { VegDashboardDimension, VegDashboardTopClient, VegDashboardTopOpportunity, VegDashboardKpis } from "../../api/veg.api";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16", "#14b8a6", "#f97316"];

function fmtK(v: number) { return v >= 1000 ? (v/1000).toFixed(1)+"M" : new Intl.NumberFormat("en-US").format(Math.round(v))+"K"; }

function TcvBarChart({ data, title, dataKey = "tcv" }: { data: VegDashboardDimension[]; title: string; dataKey?: string }) {
  const sorted = [...data].sort((a, b) => parseFloat(b[dataKey as keyof typeof b] as string) - parseFloat(a[dataKey as keyof typeof a] as string)).slice(0, 15);
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <h4 className="text-sm font-semibold text-slate-900 mb-3">{title}</h4>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={sorted} layout="vertical" margin={{ left: 20, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis type="number" tickFormatter={(v) => fmtK(v)} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="label" tick={{ fontSize: 10 }} width={100} />
          <Tooltip formatter={(v: number) => fmtK(v)} />
          <Bar dataKey={dataKey} fill="#6366f1" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function RevenueStackedBar({ data }: { data: VegDashboardDimension[] }) {
  const sorted = [...data].sort((a, b) => parseFloat(b.tcv) - parseFloat(a.tcv)).slice(0, 12);
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <h4 className="text-sm font-semibold text-slate-900 mb-3">SaaS vs IP+Maintenance vs PS by Client</h4>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={sorted} layout="vertical" margin={{ left: 20, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis type="number" tickFormatter={(v) => fmtK(v)} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="label" tick={{ fontSize: 10 }} width={100} />
          <Tooltip formatter={(v: number) => fmtK(v)} />
          <Legend />
          <Bar dataKey="saas" name="SaaS" stackId="a" fill="#8b5cf6" radius={[0, 0, 0, 0]} />
          <Bar dataKey="ip_maintenance" name="IP+Maintenance" stackId="a" fill="#06b6d4" />
          <Bar dataKey="ps" name="PS" stackId="a" fill="#f59e0b" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function TopClientsChart({ data }: { data: VegDashboardTopClient[] }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <h4 className="text-sm font-semibold text-slate-900 mb-3">Top 10 Clients by TCV</h4>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data.slice(0, 10)} layout="vertical" margin={{ left: 20, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis type="number" tickFormatter={(v) => fmtK(v)} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="client" tick={{ fontSize: 10 }} width={120} />
          <Tooltip formatter={(v: number) => fmtK(v)} />
          <Bar dataKey="total_tcv" fill="#10b981" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function TopOpportunitiesChart({ data }: { data: VegDashboardTopOpportunity[] }) {
  const chartData = data.slice(0, 10).map(d => ({ label: `${d.client} (${d.veg_id})`.slice(0, 30), tcv: parseFloat(d.tcv) }));
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <h4 className="text-sm font-semibold text-slate-900 mb-3">Top 10 Opportunities by TCV</h4>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis type="number" tickFormatter={(v) => fmtK(v)} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="label" tick={{ fontSize: 10 }} width={140} />
          <Tooltip formatter={(v: number) => fmtK(v)} />
          <Bar dataKey="tcv" fill="#f59e0b" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function TcvPieChart({ data, title }: { data: VegDashboardDimension[]; title: string }) {
  const chartData = data.filter(d => parseFloat(d.tcv) > 0);
  const OTHER_LIMIT = 8;
  const top = chartData.slice(0, OTHER_LIMIT);
  const rest = chartData.slice(OTHER_LIMIT);
  if (rest.length > 0) {
    top.push({ label: "Others", tcv: rest.reduce((s, r) => s + parseFloat(r.tcv), 0).toString(), ps: "0", saas: "0", ip_maintenance: "0", count: "0" });
  }
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <h4 className="text-sm font-semibold text-slate-900 mb-3">{title}</h4>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie data={top} cx="50%" cy="50%" innerRadius={50} outerRadius={100} dataKey="tcv" nameKey="label" label={({ label, percent }) => `${label} ${(percent * 100).toFixed(0)}%`}>
            {top.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
          </Pie>
          <Tooltip formatter={(v: number) => fmtK(v)} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function DecisionPieChart({ decisions }: { decisions: { decision: string; count: string; total_tcv: string }[] }) {
  const data = decisions.filter(d => parseInt(d.count) > 0);
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <h4 className="text-sm font-semibold text-slate-900 mb-3">Decision Distribution</h4>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={100} dataKey="count" nameKey="decision" label={({ decision, percent }) => `${decision} ${(percent * 100).toFixed(0)}%`}>
            {data.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function RevenuePie({ kpis }: { kpis: VegDashboardKpis }) {
  const data = [
    { name: "PS", value: parseFloat(kpis.total_ps) },
    { name: "IP+Maintenance", value: parseFloat(kpis.total_ip_maintenance) },
    { name: "SaaS", value: parseFloat(kpis.total_saas) },
    { name: "TCV (excl.)", value: Math.max(0, parseFloat(kpis.total_tcv) - parseFloat(kpis.total_ps) - parseFloat(kpis.total_ip_maintenance) - parseFloat(kpis.total_saas)) },
  ].filter(d => d.value > 0);
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <h4 className="text-sm font-semibold text-slate-900 mb-3">Revenue Breakdown</h4>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
            {data.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
          </Pie>
          <Tooltip formatter={(v: number) => fmtK(v)} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

interface Props {
  tcvByClient: VegDashboardDimension[];
  tcvByRegion: VegDashboardDimension[];
  tcvByBusinessLine: VegDashboardDimension[];
  tcvByProduct: VegDashboardDimension[];
  topClients: VegDashboardTopClient[];
  topOpportunities: VegDashboardTopOpportunity[];
  kpis: VegDashboardKpis;
  decisions: { decision: string; count: string; total_tcv: string }[];
}

export default function VegFinancialCharts({ tcvByClient, tcvByRegion, tcvByBusinessLine, tcvByProduct, topClients, topOpportunities, kpis, decisions }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <TcvBarChart data={tcvByClient} title="TCV by Client" />
      <TcvPieChart data={tcvByRegion} title="TCV by Region" />
      <TcvBarChart data={tcvByBusinessLine} title="TCV by Business Line" />
      <TcvBarChart data={tcvByProduct} title="TCV by Product" />
      <RevenueStackedBar data={tcvByClient} />
      <RevenuePie kpis={kpis} />
      <DecisionPieChart decisions={decisions} />
      <TopClientsChart data={topClients} />
      <TopOpportunitiesChart data={topOpportunities} />
    </div>
  );
}
