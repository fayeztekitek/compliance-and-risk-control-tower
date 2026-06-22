import { useState } from "react";
import {
  Shield, AlertTriangle, CheckCircle, Bug, Clock,
  TrendingUp, DollarSign, Users, FileText, Download,
  BarChart3, Activity, Target, Zap, Bell,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid,
} from "recharts";
import {
  useExecutiveDashboard, useDashboardTrends,
  useMttr, useSlaBreach, useDistinctVsOccurrences, useCompliancePosture,
} from "../hooks/useDashboard";
import { useUIStore } from "../store/ui.store";
import { exportApi } from "../api/export.api";
import { SkeletonPage } from "../components/ui/Skeleton";

const KPI_CARDS = [
  { key: "totalVulnerabilities", label: "Total Vulns", icon: Bug, color: "text-slate-600 bg-slate-100" },
  { key: "criticalVulnerabilities", label: "Critical", icon: AlertTriangle, color: "text-red-600 bg-red-100" },
  { key: "highVulnerabilities", label: "High", icon: AlertTriangle, color: "text-orange-600 bg-orange-100" },
  { key: "openVulnerabilities", label: "Open", icon: Activity, color: "text-amber-600 bg-amber-100" },
  { key: "slaOverdueVulnerabilities", label: "SLA Overdue", icon: Clock, color: "text-rose-600 bg-rose-100" },
  { key: "falsePositives", label: "False Positives", icon: CheckCircle, color: "text-gray-600 bg-gray-100" },
  { key: "fixedVulnerabilities", label: "Fixed", icon: CheckCircle, color: "text-green-600 bg-green-100" },
  { key: "waivedVulnerabilities", label: "Waived", icon: Shield, color: "text-indigo-600 bg-indigo-100" },
  { key: "activeWaivers", label: "Active Waivers", icon: FileText, color: "text-purple-600 bg-purple-100" },
  { key: "totalProjects", label: "Total Projects", icon: Users, color: "text-blue-600 bg-blue-100" },
  { key: "deviatingProjects", label: "Deviating", icon: TrendingUp, color: "text-amber-600 bg-amber-100" },
  { key: "budgetOverrunProjects", label: "Budget Overruns", icon: DollarSign, color: "text-red-600 bg-red-100" },
  { key: "globalRiskScore", label: "Risk Score", icon: Target, color: "text-rose-600 bg-rose-100", suffix: "%" },
  { key: "complianceScore", label: "Compliance", icon: Shield, color: "text-emerald-600 bg-emerald-100", suffix: "%" },
  { key: "productsRed", label: "Red Products", icon: Zap, color: "text-red-600 bg-red-100" },
  { key: "productsGreen", label: "Green Products", icon: CheckCircle, color: "text-green-600 bg-green-100" },
];

const KRI_STATUS = {
  OK: "bg-green-100 text-green-700",
  WARNING: "bg-amber-100 text-amber-700",
  BREACHED: "bg-red-100 text-red-700",
};

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function ExecutiveDashboard() {
  const { data: dash, isLoading, error } = useExecutiveDashboard();
  const { data: trends } = useDashboardTrends();
  const { data: mttr } = useMttr();
  const { data: sla } = useSlaBreach();
  const { data: distinctOcc } = useDistinctVsOccurrences();
  const { data: compliance } = useCompliancePosture();
  const addToast = useUIStore((s) => s.addToast);
  const [chartView, setChartView] = useState<"risk" | "vulns">("risk");

  async function handleExport(format: "csv" | "pdf") {
    try {
      const fn = format === "csv" ? exportApi.csv : exportApi.pdf;
      const res = await fn("kpis");
      downloadBlob(res.data as Blob, `dashboard-kpis-${Date.now()}.${format}`);
      addToast({ type: "success", message: `Exported as ${format.toUpperCase()}` });
    } catch {
      addToast({ type: "error", message: `Failed to export as ${format.toUpperCase()}` });
    }
  }

  if (isLoading) return <SkeletonPage />;
  if (error || !dash) {
    return (
      <div className="text-center py-16 text-slate-500">
        <p className="text-lg font-medium">Unable to load dashboard data.</p>
        <p className="text-sm mt-1">Ensure the backend and database are running.</p>
      </div>
    );
  }

  const { kpis, kris, heatmap, recentAlerts, lastUpdated } = dash;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Executive Dashboard</h2>
          <p className="text-sm text-slate-500 mt-1">
            Last updated: {new Date(lastUpdated).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport("csv")}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50"
          >
            <Download className="w-4 h-4" /> CSV
          </button>
          <button
            onClick={() => handleExport("pdf")}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50"
          >
            <Download className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {KPI_CARDS.map(({ key, label, icon: Icon, color, suffix }) => (
          <div key={key} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">{label}</p>
                <p className="text-lg font-bold text-slate-800">
                  {Number((kpis as any)[key])?.toLocaleString() ?? "—"}
                  {suffix}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced KPI Row (MTTR, SLA, Distinct/Occurrence) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-indigo-500" />
            <p className="text-xs font-medium text-slate-500">MTTR (days)</p>
          </div>
          <p className="text-xl font-bold text-slate-800">{mttr?.overall ?? "—"}</p>
          <p className="text-xs text-slate-400 mt-1">
            Critical: {mttr?.bySeverity?.CRITICAL ?? "—"}d &middot; High: {mttr?.bySeverity?.HIGH ?? "—"}d
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <p className="text-xs font-medium text-slate-500">SLA Breach Rate</p>
          </div>
          <p className={`text-xl font-bold ${(sla?.breachRate ?? 0) > 20 ? "text-red-600" : (sla?.breachRate ?? 0) > 10 ? "text-amber-600" : "text-emerald-600"}`}>
            {sla ? `${sla.breachRate}%` : "—"}
          </p>
          <p className="text-xs text-slate-400 mt-1">{sla?.breached ?? 0} / {sla?.total ?? 0} overdue</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-blue-500" />
            <p className="text-xs font-medium text-slate-500">Distinct vs Occurrences</p>
          </div>
          <p className="text-xl font-bold text-slate-800">
            {distinctOcc?.distinctFindings?.toLocaleString() ?? "—"}
            <span className="text-sm font-normal text-slate-400"> / {distinctOcc?.totalOccurrences?.toLocaleString() ?? "—"}</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Ratio: {distinctOcc && distinctOcc.totalOccurrences > 0
              ? (distinctOcc.distinctFindings / distinctOcc.totalOccurrences * 100).toFixed(1)
              : "—"}%
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Shield className={`w-4 h-4 ${compliance?.grade === "GREEN" ? "text-emerald-500" : compliance?.grade === "AMBER" ? "text-amber-500" : "text-red-500"}`} />
            <p className="text-xs font-medium text-slate-500">Compliance Posture</p>
          </div>
          <p className={`text-xl font-bold ${compliance?.grade === "GREEN" ? "text-emerald-600" : compliance?.grade === "AMBER" ? "text-amber-600" : "text-red-600"}`}>
            {compliance?.grade ?? "—"}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Fix rate: {compliance?.fixedRate ?? 0}% &middot; Score: {compliance?.complianceScore ?? 0}
          </p>
        </div>
      </div>

      {/* KRI Thresholds */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" /> Key Risk Indicators (KRIs)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {kris.map((kri) => (
            <div key={kri.id} className="p-4 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">{kri.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${KRI_STATUS[kri.status]}`}>
                  {kri.status}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-slate-800">
                  {kri.unit === "EUR" ? `€${kri.value.toLocaleString()}` : kri.value}
                </span>
                <span className="text-sm text-slate-500">
                  / {kri.unit === "EUR" ? `€${kri.threshold.toLocaleString()}` : kri.threshold} {kri.unit}
                </span>
              </div>
              <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    kri.status === "BREACHED" ? "bg-red-500" : kri.status === "WARNING" ? "bg-amber-500" : "bg-green-500"
                  }`}
                  style={{ width: `${Math.min((kri.value / kri.threshold) * 100, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5x5 Heatmap */}
      {heatmap && heatmap.cells.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" /> 5x5 Risk Heatmap
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left text-slate-500 text-xs font-medium">Severity \ Age</th>
                  {heatmap.ageRanges.map((age) => (
                    <th key={age} className="px-3 py-2 text-center text-slate-500 text-xs font-medium">{age}d</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmap.severityLevels.map((sev, si) => (
                  <tr key={sev}>
                    <td className="px-3 py-2 text-xs font-medium text-slate-600">{sev}</td>
                    {heatmap.ageRanges.map((_, ai) => {
                      const cell = heatmap.cells.find((c) => c.x === si && c.y === ai);
                      const count = cell?.count ?? 0;
                      const intensity = Math.min(count / 5, 1);
                      const bg = count === 0
                        ? "bg-slate-50"
                        : `rgba(239, 68, 68, ${intensity})`;
                      return (
                        <td
                          key={`${si}-${ai}`}
                          className="px-3 py-2 text-center text-xs font-medium border border-slate-100"
                          style={{ backgroundColor: bg }}
                        >
                          {count || "—"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Trends Chart */}
      {trends && trends.securityTrends.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" /> Monthly Trends
            </h3>
            <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
              <button
                onClick={() => setChartView("risk")}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${chartView === "risk" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"}`}
              >
                Risk Score
              </button>
              <button
                onClick={() => setChartView("vulns")}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${chartView === "vulns" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"}`}
              >
                Vulnerabilities
              </button>
            </div>
          </div>
          <div className="h-64">
            {chartView === "risk" ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends.securityTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="riskScore" stroke="#ef4444" name="Risk Score" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends.securityTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="critical" fill="#ef4444" name="Critical" stackId="a" />
                  <Bar dataKey="high" fill="#f97316" name="High" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* Project Trends */}
      {trends && trends.projectTrends.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" /> Project Trends
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends.projectTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="total" fill="#3b82f6" name="Total Projects" />
                <Bar dataKey="deviating" fill="#f59e0b" name="Deviating" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent Alerts */}
      {recentAlerts.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5" /> Recent Alerts
          </h3>
          <div className="space-y-2">
            {recentAlerts.map((alert, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <p className="text-sm text-amber-800">
                  {(alert as any).message || JSON.stringify(alert)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
