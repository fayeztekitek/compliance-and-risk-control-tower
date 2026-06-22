import { ArrowLeft, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useReportComparison, useAppTrend } from "../hooks/useNexus";
import { SkeletonPage } from "../components/ui/Skeleton";

interface Props {
  applicationId: string;
  onBack: () => void;
}

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: "text-red-600 bg-red-100",
  HIGH: "text-orange-600 bg-orange-100",
  MEDIUM: "text-amber-600 bg-amber-100",
  LOW: "text-slate-600 bg-slate-100",
};

export default function NexusReportComparison({ applicationId, onBack }: Props) {
  const { data: comparison, isLoading, error } = useReportComparison(applicationId);
  const { data: trend } = useAppTrend(applicationId, 6);

  if (isLoading) return <SkeletonPage />;

  if (error || !comparison) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-2xl font-bold text-slate-800">Report Comparison</h1>
        </div>
        <div className="text-center py-16 text-slate-500">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
          <p>No comparison available. Need at least two reports.</p>
        </div>
      </div>
    );
  }

  const DeltaIcon = comparison.riskEvolution.delta > 0 ? TrendingUp : comparison.riskEvolution.delta < 0 ? TrendingDown : Minus;
  const deltaColor = comparison.riskEvolution.delta > 0 ? "text-red-600" : comparison.riskEvolution.delta < 0 ? "text-emerald-600" : "text-slate-600";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Report Comparison</h1>
          <p className="text-sm text-slate-500">{comparison.previousReportDate} → {comparison.latestReportDate}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-emerald-700">New Vulnerabilities</p>
            <AlertTriangle className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-bold text-emerald-700 mt-1">{comparison.newCount}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-red-700">Fixed Vulnerabilities</p>
            <CheckCircle className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-3xl font-bold text-red-700 mt-1">{comparison.fixedCount}</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-amber-700">Recurring</p>
            <RefreshCw className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-amber-700 mt-1">{comparison.recurringCount}</p>
        </div>
      </div>

      {/* Risk Evolution */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-800 mb-4">Risk Evolution</h3>
        <div className="flex items-center space-x-8">
          <div>
            <p className="text-sm text-slate-500">Previous</p>
            <p className="text-xl font-bold text-slate-700">{comparison.riskEvolution.previousTotalRisk}</p>
          </div>
          <div className="flex items-center space-x-2">
            <DeltaIcon className={`w-5 h-5 ${deltaColor}`} />
            <span className={`text-lg font-bold ${deltaColor}`}>
              {comparison.riskEvolution.delta > 0 ? "+" : ""}{comparison.riskEvolution.delta}
            </span>
          </div>
          <div>
            <p className="text-sm text-slate-500">Latest</p>
            <p className="text-xl font-bold text-slate-700">{comparison.riskEvolution.latestTotalRisk}</p>
          </div>
        </div>
      </div>

      {/* Severity Shift */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-800 mb-3">Severity Shift</h3>
        <div className="flex space-x-6">
          {Object.entries(comparison.severityShift || {}).map(([severity, shift]) => (
            <div key={severity} className="text-center">
              <p className={`text-xs font-medium ${SEVERITY_COLORS[severity]?.split(" ")[0] || "text-slate-600"}`}>{severity}</p>
              <p className={`text-lg font-bold ${(shift as number) > 0 ? "text-red-600" : (shift as number) < 0 ? "text-emerald-600" : "text-slate-400"}`}>
                {(shift as number) > 0 ? "+" : ""}{shift as number}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* New Vulnerabilities List */}
      {comparison.newVulnerabilities.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 bg-emerald-50 border-b border-emerald-200">
            <h3 className="font-semibold text-emerald-700">New Vulnerabilities ({comparison.newCount})</h3>
          </div>
          <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
            {comparison.newVulnerabilities.map((vuln: any) => (
              <div key={vuln.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">{vuln.cveId || vuln.title}</p>
                  <p className="text-xs text-slate-400">{vuln.componentName}@{vuln.componentVersion}</p>
                </div>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${SEVERITY_COLORS[vuln.unifiedSeverity] || ""}`}>{vuln.unifiedSeverity}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fixed Vulnerabilities List */}
      {comparison.fixedVulnerabilities.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 bg-red-50 border-b border-red-200">
            <h3 className="font-semibold text-red-700">Fixed Vulnerabilities ({comparison.fixedCount})</h3>
          </div>
          <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
            {comparison.fixedVulnerabilities.map((vuln: any) => (
              <div key={vuln.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">{vuln.cveId || vuln.title}</p>
                  <p className="text-xs text-slate-400">{vuln.componentName}@{vuln.componentVersion}</p>
                </div>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${SEVERITY_COLORS[vuln.unifiedSeverity] || ""}`}>{vuln.unifiedSeverity}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recurring Vulnerabilities List */}
      {comparison.recurringVulnerabilities.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 bg-amber-50 border-b border-amber-200">
            <h3 className="font-semibold text-amber-700">Recurring ({comparison.recurringCount})</h3>
          </div>
          <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
            {comparison.recurringVulnerabilities.map((vuln: any) => (
              <div key={vuln.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">{vuln.cveId || vuln.title}</p>
                  <p className="text-xs text-slate-400">{vuln.componentName}@{vuln.componentVersion}</p>
                </div>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${SEVERITY_COLORS[vuln.unifiedSeverity] || ""}`}>{vuln.unifiedSeverity}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trend Charts */}
      {trend && trend.dataPoints && trend.dataPoints.length > 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Risk Score Trajectory */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-4">Risk Score Trajectory</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend.dataPoints}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="reportDate" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="riskScore" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} name="Risk Score" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {trend.riskProjection && (
              <div className={`mt-3 flex items-center space-x-2 text-sm ${trend.riskProjection.direction === "worsening" ? "text-red-600" : trend.riskProjection.direction === "improving" ? "text-emerald-600" : "text-slate-500"}`}>
                {trend.riskProjection.direction === "worsening" ? <TrendingUp className="w-4 h-4" /> : trend.riskProjection.direction === "improving" ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                <span>Projected by {trend.riskProjection.projectedDate}: {trend.riskProjection.projectedRisk}</span>
              </div>
            )}
          </div>

          {/* Severity Distribution Over Time */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-4">Severity Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trend.dataPoints}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="reportDate" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="severityBreakdown.CRITICAL" stackId="sev" fill="#dc2626" name="Critical" />
                  <Bar dataKey="severityBreakdown.HIGH" stackId="sev" fill="#ea580c" name="High" />
                  <Bar dataKey="severityBreakdown.MEDIUM" stackId="sev" fill="#ca8a04" name="Medium" />
                  <Bar dataKey="severityBreakdown.LOW" stackId="sev" fill="#64748b" name="Low" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Velocity Insight */}
      {trend && trend.velocity && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-3">Vulnerability Velocity</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-slate-500">New / Week</p>
              <p className="text-xl font-bold text-emerald-600">{trend.velocity.newPerWeek}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Fixed / Week</p>
              <p className="text-xl font-bold text-red-600">{trend.velocity.fixedPerWeek}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Net Velocity</p>
              <p className={`text-xl font-bold ${trend.velocity.netVelocity > 0 ? "text-red-600" : "text-emerald-600"}`}>
                {trend.velocity.netVelocity > 0 ? "+" : ""}{trend.velocity.netVelocity}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
