import {
  Building2, Layers, FileText, Clock, CheckCircle, XCircle,
  AlertTriangle, Bug, Shield, TrendingUp, TrendingDown,
  Activity, Loader2, BarChart3, PieChart,
} from "lucide-react";
import { useExecutiveDashboard } from "../hooks/useDashboard";

function formatPct(v: number | undefined | null): string {
  if (v == null) return "—";
  return `${v.toFixed(1)}%`;
}

function formatNum(v: number | undefined | null): string {
  if (v == null) return "—";
  return v.toLocaleString();
}

function TrendBadge({ dir }: { dir: string }) {
  const isUp = dir === "improving";
  const isDown = dir === "worsening";
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
      isUp ? "bg-emerald-100 text-emerald-700" :
      isDown ? "bg-red-100 text-red-700" :
      "bg-slate-100 text-slate-500"
    }`}>
      {isUp ? <TrendingUp className="w-3 h-3" /> : isDown ? <TrendingDown className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
      {dir}
    </span>
  );
}

export default function ExecutiveDashboard() {
  const { data, isFetching } = useExecutiveDashboard();

  if (isFetching && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
        <p className="text-sm text-slate-400">Loading executive dashboard...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500">
        <AlertTriangle className="w-12 h-12 text-amber-400 mb-4" />
        <p className="text-lg font-medium">No KPI data available.</p>
        <p className="text-sm mt-1">Run a synchronization first to populate KPIs.</p>
      </div>
    );
  }

  const { snapshot, kpis, trends, lastUpdated } = data;
  const s = snapshot;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Executive Dashboard</h2>
          <p className="text-sm text-slate-500 mt-1">
            Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleString() : "never"}
            {isFetching && <Loader2 className="w-3 h-3 animate-spin ml-2 inline" />}
          </p>
        </div>
        {s?.trendDirection && <TrendBadge dir={s.trendDirection} />}
      </div>

      {/* ═══ 1. Inventory KPIs ═══ */}
      <div>
        <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" /> Inventory
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <KpiCard icon={<Building2 className="w-5 h-5 text-emerald-600" />} bg="bg-emerald-100" label="Organizations" value={formatNum(s?.totalOrganizations)} />
          <KpiCard icon={<Layers className="w-5 h-5 text-blue-600" />} bg="bg-blue-100" label="Applications" value={formatNum(s?.totalApplications)} />
          <KpiCard icon={<CheckCircle className="w-5 h-5 text-green-600" />} bg="bg-green-100" label="Active (<6mo)" value={formatNum(s?.activeApplications)} />
          <KpiCard icon={<Clock className="w-5 h-5 text-amber-600" />} bg="bg-amber-100" label="Inactive (>6mo)" value={formatNum(s?.inactiveApplications)} />
          <KpiCard icon={<XCircle className="w-5 h-5 text-red-600" />} bg="bg-red-100" label="Never Scanned" value={formatNum(s?.neverScanned)} />
          <KpiCard icon={<Activity className="w-5 h-5 text-violet-600" />} bg="bg-violet-100" label="Coverage Rate" value={formatPct(s?.scanCoverageRate)} />
          <KpiCard icon={<FileText className="w-5 h-5 text-slate-600" />} bg="bg-slate-100" label="Avg Scan Age" value={s?.averageScanAgeDays != null ? `${s.averageScanAgeDays.toFixed(1)}d` : "—"} />
        </div>
      </div>

      {/* ═══ 2. Security Posture KPIs ═══ */}
      <div>
        <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4" /> Security Posture
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <KpiCard icon={<Bug className="w-5 h-5 text-red-600" />} bg="bg-red-100" label="Open Critical" value={formatNum(s?.openCritical)} />
          <KpiCard icon={<Bug className="w-5 h-5 text-orange-600" />} bg="bg-orange-100" label="Open High" value={formatNum(s?.openHigh)} />
          <KpiCard icon={<Bug className="w-5 h-5 text-amber-600" />} bg="bg-amber-100" label="Open Medium" value={formatNum(s?.openMedium)} />
          <KpiCard icon={<Bug className="w-5 h-5 text-slate-600" />} bg="bg-slate-100" label="Open Low" value={formatNum(s?.openLow)} />
          <KpiCard icon={<AlertTriangle className="w-5 h-5 text-red-600" />} bg="bg-red-100" label="Total Open" value={formatNum(s?.totalOpenVulnerabilities)} />
          <KpiCard icon={<Activity className="w-5 h-5 text-violet-600" />} bg="bg-violet-100" label="Distinct Vulns" value={formatNum(s?.distinctVulnerabilities)} />
          <KpiCard icon={<Layers className="w-5 h-5 text-indigo-600" />} bg="bg-indigo-100" label="Occurrences" value={formatNum(s?.occurrences)} />
          <KpiCard icon={<Shield className="w-5 h-5 text-slate-600" />} bg="bg-slate-100" label="Risk Score" value={s?.averageRiskScore != null ? s.averageRiskScore.toFixed(1) : "—"} />
        </div>
      </div>

      {/* Apps with Critical/High */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <KpiCard icon={<Bug className="w-5 h-5 text-red-600" />} bg="bg-red-100" label="Apps with Critical Vulns" value={formatNum(s?.appsWithCriticalVulns)} />
        <KpiCard icon={<Bug className="w-5 h-5 text-orange-600" />} bg="bg-orange-100" label="Apps with High Vulns" value={formatNum(s?.appsWithHighVulns)} />
      </div>

      {/* ═══ 3. Remediation KPIs ═══ */}
      <div>
        <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4" /> Remediation
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <KpiCard icon={<CheckCircle className="w-5 h-5 text-green-600" />} bg="bg-green-100" label="Mitigated" value={formatNum(s?.mitigatedVulnerabilities)} />
          <KpiCard icon={<Shield className="w-5 h-5 text-blue-600" />} bg="bg-blue-100" label="Accepted Risks" value={formatNum(s?.acceptedRisks)} />
          <KpiCard icon={<XCircle className="w-5 h-5 text-slate-600" />} bg="bg-slate-100" label="False Positives" value={formatNum(s?.falsePositives)} />
          <KpiCard icon={<TrendingUp className="w-5 h-5 text-amber-600" />} bg="bg-amber-100" label="New (30d)" value={formatNum(s?.newVulnerabilities30d)} />
          <KpiCard icon={<TrendingDown className="w-5 h-5 text-green-600" />} bg="bg-green-100" label="Fixed (30d)" value={formatNum(s?.fixedVulnerabilities30d)} />
          <KpiCard icon={<Activity className="w-5 h-5 text-red-600" />} bg="bg-red-100" label="Recurring" value={formatNum(s?.recurringVulnerabilities)} />
          <KpiCard icon={<Clock className="w-5 h-5 text-violet-600" />} bg="bg-violet-100" label="MTTR" value={s?.mttrDays != null ? `${s.mttrDays.toFixed(1)}d` : "—"} />
        </div>
      </div>

      {/* Avg Time to Close + Closed This Month */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <KpiCard icon={<Clock className="w-5 h-5 text-indigo-600" />} bg="bg-indigo-100" label="Avg Time to Close" value={s?.avgTimeToCloseDays != null ? `${s.avgTimeToCloseDays.toFixed(1)}d` : "—"} />
        <KpiCard icon={<CheckCircle className="w-5 h-5 text-green-600" />} bg="bg-green-100" label="Closed This Month" value={formatNum(s?.closedThisMonth)} />
        <KpiCard icon={<FileText className="w-5 h-5 text-slate-600" />} bg="bg-slate-100" label="Closed Last Month" value="—" />
      </div>

      {/* ═══ 4. Governance & Compliance KPIs ═══ */}
      <div>
        <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4" /> Governance & Compliance
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <KpiCard icon={<AlertTriangle className="w-5 h-5 text-red-600" />} bg="bg-red-100" label="Apps Out of SLA" value={formatNum(s?.applicationsOutOfSla)} />
          <KpiCard icon={<Clock className="w-5 h-5 text-amber-600" />} bg="bg-amber-100" label="Risks Expiring Soon" value={formatNum(s?.acceptedRisksExpiringSoon)} />
          <KpiCard icon={<XCircle className="w-5 h-5 text-red-600" />} bg="bg-red-100" label="Expired Risks" value={formatNum(s?.expiredAcceptedRisks)} />
          <KpiCard icon={<XCircle className="w-5 h-5 text-amber-600" />} bg="bg-amber-100" label="No Recent Scan" value={formatNum(s?.applicationsWithoutRecentScan)} />
          <KpiCard icon={<AlertTriangle className="w-5 h-5 text-red-600" />} bg="bg-red-100" label="Critical No Scan" value={formatNum(s?.criticalAppsWithoutScan)} />
          <KpiCard icon={<CheckCircle className="w-5 h-5 text-green-600" />} bg="bg-green-100" label="Compliance Rate" value={formatPct(s?.complianceRate)} />
          <KpiCard icon={<CheckCircle className="w-5 h-5 text-blue-600" />} bg="bg-blue-100" label="SLA Compliance" value={formatPct(s?.slaComplianceRate)} />
        </div>
      </div>

      {/* ═══ 5. Product Risk Distribution ═══ */}
      <div>
        <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-2">
          <PieChart className="w-4 h-4" /> Product Risk Distribution
        </h3>
        <div className="grid grid-cols-3 gap-3 max-w-md">
          <KpiCard icon={<AlertTriangle className="w-5 h-5 text-red-600" />} bg="bg-red-100" label="Red" value={formatNum(s?.productsRedCount)} />
          <KpiCard icon={<AlertTriangle className="w-5 h-5 text-orange-600" />} bg="bg-orange-100" label="Orange" value={formatNum(s?.productsOrangeCount)} />
          <KpiCard icon={<CheckCircle className="w-5 h-5 text-green-600" />} bg="bg-green-100" label="Green" value={formatNum(s?.productsGreenCount)} />
        </div>
      </div>

      {/* ═══ 6. Trend Chart (placeholder) ═══ */}
      {trends?.securityTrends && trends.securityTrends.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <Activity className="w-5 h-5" /> Security Trends (Last 12 Months)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Month</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-slate-500">Risk Score</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-slate-500">Total</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-slate-500">Critical</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-slate-500">High</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-slate-500">Distinct</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-slate-500">Occurrences</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trends.securityTrends.map((t: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-3 py-2 text-slate-700">{t.date}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs">{t.riskScore?.toFixed(1)}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs">{t.total}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs text-red-600">{t.critical}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs text-orange-600">{t.high}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs">{t.distinctVulns}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs">{t.occurrences}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-xs text-slate-400 text-right">
        Snapshot: {s?.snapshotDate || "N/A"} · Products: {s?.productsRedCount || 0}R / {s?.productsOrangeCount || 0}O / {s?.productsGreenCount || 0}G
      </div>
    </div>
  );
}

function KpiCard({ icon, bg, label, value }: { icon: React.ReactNode; bg: string; label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3">
      <div className="flex items-center gap-2.5">
        <div className={`p-2 rounded-lg ${bg} shrink-0`}>{icon}</div>
        <div className="min-w-0">
          <p className="text-xs text-slate-500 font-medium truncate">{label}</p>
          <p className="text-base font-bold text-slate-800">{value}</p>
        </div>
      </div>
    </div>
  );
}
