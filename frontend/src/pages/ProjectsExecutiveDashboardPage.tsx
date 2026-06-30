import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, Paper, Chip, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, MenuItem,
} from "@mui/material";
import { BarChart3, TrendingUp, AlertTriangle, DollarSign, Loader2 } from "lucide-react";
import { apiClient } from "../api/client";
import { PageHeader, KpiCardGrid, ChartCard, StatCard } from "../components/ui/DashboardGrid";
import AiInsightCard from "../components/ui/AiInsightCard";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell,
} from "recharts";

const RAG_COLORS: Record<string, string> = { GREEN: "#22c55e", AMBER: "#f59e0b", RED: "#ef4444" };
const HEATMAP_RAG_COLORS: Record<string, string> = { GREEN: "#dcfce7", AMBER: "#fef3c7", RED: "#fee2e2", "#N/A": "#f1f5f9" };
const RAG_FIELDS = ["planning", "quality", "scope", "governance", "security", "clientMood", "resources", "globalRisk"];
const RAG_LABELS: Record<string, string> = {
  planning: "Plan", quality: "Qual", scope: "Scope", governance: "Gov",
  security: "Sec", clientMood: "Client", resources: "Res", globalRisk: "Global",
};

interface HeatmapRow {
  id: string; name: string; code: string; status: string;
  planning: string; quality: string; scope: string; governance: string;
  security: string; clientMood: string; resources: string; globalRisk: string;
  goLive: string; budgetBurn: number; rtd: number; slippage: number; testAutomation: number;
}

interface DashboardData {
  kpis: {
    totalProjects: number; onTrack: number; deviating: number; highRisk: number;
    capacityGap: number; capacityUtilization: number;
    avgRtd: number; avgSlippageMd: number; avgTestAutomation: number;
    totalBudget: number; totalConsumed: number; utilizationPct: number;
    overrunCount: number; blockedCount: number;
  };
  ragHeatmap: HeatmapRow[];
  riskSummary: { severity: string; count: number }[];
  milestoneSummary: { status: string; count: number }[];
  snapshotTrend: { period: string; snapshot_count: number; red_flag_count: number }[];
  budgetByProject: { name: string; initialBudget: number; consumedBudget: number; status: string; burnRate: number }[];
}

const formatCurrency = (v: number) => v >= 1e6 ? `$${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `$${(v / 1e3).toFixed(1)}K` : `$${v}`;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-medium text-slate-900 dark:text-white mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-slate-600 dark:text-slate-400">{p.name}:</span>
          <span className="font-medium text-slate-900 dark:text-white">{typeof p.value === "number" ? p.value.toFixed(1) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function ProjectsExecutiveDashboardPage() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["projects-executive-dashboard"],
    queryFn: async () => {
      const r = await apiClient.get<{ data: DashboardData }>("/api/projects/executive-dashboard");
      return r.data.data;
    },
    refetchInterval: 30000,
  });

  const [filterStatus, setFilterStatus] = useState("ALL");
  const [search, setSearch] = useState("");

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>;

  const k = data?.kpis;
  const heatmap = (data?.ragHeatmap || []).filter(r => {
    if (filterStatus !== "ALL" && r.status !== filterStatus) return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase()) && !r.code.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const riskData = data?.riskSummary?.map(r => ({ name: r.severity, value: r.count })) || [];
  const milestoneData = data?.milestoneSummary?.map(m => ({ name: m.status, value: m.count })) || [];
  const trendData = data?.snapshotTrend || [];

  return (
    <div>
      <PageHeader
        title="Projects Executive Dashboard"
        description="Executive snapshot of project portfolio with RAG heatmap, risk/milestone summaries, and trends"
        icon={BarChart3}
      />

      {/* KPI Cards */}
      <KpiCardGrid>
        <StatCard label="Total Projects" value={k?.totalProjects || 0} icon={BarChart3} color="text-blue-600 bg-blue-50 dark:bg-blue-500/10" />
        <StatCard label="On Track" value={k?.onTrack || 0} icon={TrendingUp} color="text-green-600 bg-green-50 dark:bg-green-500/10" sub={`${k?.capacityUtilization || 0}% utilization`} />
        <StatCard label="Capacity Gap" value={k?.capacityGap || 0} icon={AlertTriangle} color="text-red-600 bg-red-50 dark:bg-red-500/10" sub={`${k?.deviating || 0} dev / ${k?.highRisk || 0} high`} />
        <StatCard label="Avg RTD" value={k?.avgRtd?.toFixed(1) || "0"} icon={TrendingUp} color="text-purple-600 bg-purple-50 dark:bg-purple-500/10" sub={`slip ${k?.avgSlippageMd?.toFixed(0) || 0}d`} />
        <StatCard label="Budget" value={formatCurrency(k?.totalBudget || 0)} icon={DollarSign} color="text-amber-600 bg-amber-50 dark:bg-amber-500/10" sub={`${k?.utilizationPct || 0}% burned`} />
        <StatCard label="Overrun" value={k?.overrunCount || 0} icon={AlertTriangle} color="text-red-600 bg-red-50 dark:bg-red-500/10" sub={`${k?.blockedCount || 0} blocked`} />
        <StatCard label="Avg Test Auto" value={`${k?.avgTestAutomation?.toFixed(0) || 0}%`} icon={TrendingUp} color="text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10" />
        <StatCard label="Total Consumed" value={formatCurrency(k?.totalConsumed || 0)} icon={DollarSign} color="text-sky-600 bg-sky-50 dark:bg-sky-500/10" />
      </KpiCardGrid>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
        {/* Red Flag Trend */}
        <ChartCard title="Red Flag Trend (snapshots)">
          {trendData.length > 1 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="red_flag_count" stroke="#ef4444" name="Red Flags" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-40 text-sm text-slate-400">Not enough snapshot data</div>
          )}
        </ChartCard>

        {/* Risk Summary */}
        <ChartCard title="Open Risks by Severity">
          {riskData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={riskData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {riskData.map(e => <Cell key={e.name} fill={RAG_COLORS[e.name] || "#94a3b8"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-40 text-sm text-slate-400">No risk data</div>
          )}
        </ChartCard>

        {/* Milestone Summary */}
        <ChartCard title="Milestones by Status">
          {milestoneData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={milestoneData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {milestoneData.map(e => (
                    <Cell key={e.name} fill={e.name === "COMPLETED" ? "#22c55e" : e.name === "IN_PROGRESS" ? "#6366f1" : "#94a3b8"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-40 text-sm text-slate-400">No milestone data</div>
          )}
        </ChartCard>
      </div>

      {/* RAG Heatmap */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">RAG Heatmap — Project Status Overview</Typography>
          <Box display="flex" gap={2}>
            <TextField select size="small" label="Status" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} sx={{ minWidth: 120 }}>
              <MenuItem value="ALL">All</MenuItem>
              <MenuItem value="ON_TRACK">On Track</MenuItem>
              <MenuItem value="DEVIATING">Deviating</MenuItem>
              <MenuItem value="HIGH_RISK">High Risk</MenuItem>
            </TextField>
            <TextField size="small" label="Search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Name or code" sx={{ minWidth: 180 }} />
          </Box>
        </Box>

        <TableContainer>
          <Table size="small" sx={{ "& td, & th": { px: 0.5, py: 0.3, fontSize: "0.75rem" } }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, minWidth: 140 }}>Project</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                {RAG_FIELDS.map(f => <TableCell key={f} align="center" sx={{ fontWeight: 600, minWidth: 44 }}>{RAG_LABELS[f]}</TableCell>)}
                <TableCell sx={{ fontWeight: 600 }}>Go-Live</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Burn</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>RTD</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {heatmap.map(r => (
                <TableRow key={r.id} hover sx={{ cursor: "pointer" }} onClick={() => navigate(`/projects/${r.id}`)}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>{r.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{r.code}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={r.status.replace(/_/g, " ")}
                      color={r.status === "ON_TRACK" ? "success" : r.status === "DEVIATING" ? "warning" : "error"} />
                  </TableCell>
                  {RAG_FIELDS.map(f => {
                    const val = (r as any)[f] || "#N/A";
                    return (
                      <TableCell key={f} align="center" sx={{ bgcolor: HEATMAP_RAG_COLORS[val] || "#f1f5f9", fontWeight: 600, fontSize: "0.7rem" }}>
                        {val === "#N/A" ? "—" : val}
                      </TableCell>
                    );
                  })}
                  <TableCell>
                    <Chip size="small" label={r.goLive}
                      color={r.goLive === "READY" ? "success" : r.goLive === "RISKY" ? "warning" : "error"} variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" fontWeight={r.budgetBurn > 100 ? 700 : 400} color={r.budgetBurn > 100 ? "error" : "inherit"}>
                      {r.budgetBurn}%
                    </Typography>
                  </TableCell>
                  <TableCell>{r.rtd.toFixed(1)}</TableCell>
                </TableRow>
              ))}
              {!heatmap.length && (
                <TableRow><TableCell colSpan={13} align="center">No projects match filters.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* AI Insights Placeholder */}
      <AiInsightCard
        severity="info"
        title="Portfolio Risk Insights"
        message={`${k?.totalProjects || 0} projects tracked. ${k?.capacityGap || 0} are off-track (${k?.capacityUtilization || 0}% on-track rate). ${k?.overrunCount || 0} projects over budget. AI-powered anomaly detection and forecast coming soon.`}
        confidence={0}
        actionable
        onDismiss={() => {}}
      />
    </div>
  );
}
