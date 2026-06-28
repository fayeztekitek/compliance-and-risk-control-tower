import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendPoint } from "../../types/nexus";

interface Props {
  data: TrendPoint[];
}

export function TrendLineChart({ data }: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-700 mb-2">Vulnerability Trend Over Time</h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
              labelStyle={{ fontWeight: 600, marginBottom: 4 }}
            />
            <Legend
              formatter={(value) => <span className="text-xs text-slate-600">{value}</span>}
              iconType="circle"
              iconSize={8}
            />
            <Line type="monotone" dataKey="critical" stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }} name="Critical" />
            <Line type="monotone" dataKey="high" stroke="#ea580c" strokeWidth={2} dot={{ r: 3 }} name="High" />
            <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} name="Total" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
