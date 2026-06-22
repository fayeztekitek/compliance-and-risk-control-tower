import { useState } from "react";
import { ArrowLeft, Radar, AlertTriangle, Shield, Clock, ChevronRight, FileText, TrendingUp, Bug, Layers } from "lucide-react";
import { useProducts, useApplications, useLatestReport, useReports, useFindings, useDistinctCount, useTotalOccurrences } from "../hooks/useNexus";
import { SkeletonPage } from "../components/ui/Skeleton";
import NexusReportDetail from "./NexusReportDetail";

interface Props {
  applicationId: string;
  onBack: () => void;
}

type AppView = "detail" | "report" | "comparison";

export default function NexusApplicationDetail({ applicationId, onBack }: Props) {
  const [appView, setAppView] = useState<AppView>("detail");
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const { data: products } = useProducts();
  const { data: applications } = useApplications();
  const { data: latestReport } = useLatestReport(applicationId);
  const { data: reports } = useReports(applicationId);
  const { data: findings } = useFindings({ applicationId, limit: 100 });
  const { data: distinctCount } = useDistinctCount(applicationId);
  const { data: totalOccurrences } = useTotalOccurrences(applicationId);

  const app = applications?.find((a: any) => a.id === applicationId);
  const product = products?.find((p: any) => p.id === applicationId);

  if (appView === "report" && selectedReportId) {
    return (
      <NexusReportDetail
        reportId={selectedReportId}
        applicationId={applicationId}
        onBack={() => { setAppView("detail"); setSelectedReportId(null); }}
      />
    );
  }

  if (!products || !applications) return <SkeletonPage />;

  const vulns = findings?.data || [];
  const openVulns = vulns.filter((v: any) => v.status === "OPEN");
  const criticalVulns = vulns.filter((v: any) => v.unifiedSeverity === "CRITICAL");
  const highVulns = vulns.filter((v: any) => v.unifiedSeverity === "HIGH");
  const fixedVulns = vulns.filter((v: any) => v.status === "FIXED");

  const totalRisk = vulns.reduce((s: number, v: any) => s + (v.riskScore || 0), 0);
  const riskGrade = totalRisk >= 70 ? "RED" : totalRisk >= 40 ? "ORANGE" : "GREEN";
  const riskColor = riskGrade === "RED" ? "text-red-600" : riskGrade === "ORANGE" ? "text-amber-600" : "text-emerald-600";
  const riskBg = riskGrade === "RED" ? "bg-red-50 border-red-200" : riskGrade === "ORANGE" ? "bg-amber-50 border-amber-200" : "bg-emerald-50 border-emerald-200";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-indigo-100">
            <Radar className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{app?.name || product?.name || applicationId}</h1>
            <p className="text-sm text-slate-500">{product?.name || "Application"} Vulnerability Details</p>
          </div>
        </div>
      </div>

      {/* Risk Score Gauge */}
      <div className={`rounded-xl border ${riskBg} p-5`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">Security Risk Score</p>
            <p className={`text-3xl font-bold ${riskColor}`}>{Math.round(totalRisk)}</p>
          </div>
          <div className="text-right">
            <p className={`text-lg font-bold ${riskColor}`}>{riskGrade}</p>
            <p className="text-xs text-slate-500">Risk Level</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">Total Vulns</p>
            <Bug className="w-3 h-3 text-slate-400" />
          </div>
          <p className="text-xl font-bold text-slate-800">{vulns.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">Distinct</p>
            <Layers className="w-3 h-3 text-indigo-400" />
          </div>
          <p className="text-xl font-bold text-slate-800">{distinctCount ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">Occurrences</p>
            <FileText className="w-3 h-3 text-amber-400" />
          </div>
          <p className="text-xl font-bold text-slate-800">{totalOccurrences ?? vulns.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">Open</p>
            <AlertTriangle className="w-3 h-3 text-red-400" />
          </div>
          <p className="text-xl font-bold text-slate-800">{openVulns.length}</p>
        </div>
      </div>

      {/* Severity Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-800 mb-4">Vulnerability Severity</h3>
        <div className="space-y-3">
          {[
            { label: "Critical", count: criticalVulns.length, color: "bg-red-500", textColor: "text-red-600" },
            { label: "High", count: highVulns.length, color: "bg-orange-500", textColor: "text-orange-600" },
            { label: "Medium", count: vulns.filter((v: any) => v.unifiedSeverity === "MEDIUM").length, color: "bg-amber-500", textColor: "text-amber-600" },
            { label: "Low", count: vulns.filter((v: any) => v.unifiedSeverity === "LOW").length, color: "bg-slate-400", textColor: "text-slate-600" },
          ].map((item) => (
            <div key={item.label} className="flex items-center space-x-3">
              <span className={`w-2 h-2 rounded-full ${item.color}`} />
              <span className={`text-sm font-medium ${item.textColor} w-16`}>{item.label}</span>
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${item.color} rounded-full transition-all`}
                  style={{ width: vulns.length ? `${(item.count / vulns.length) * 100}%` : "0%" }}
                />
              </div>
              <span className="text-sm font-medium text-slate-700 w-8 text-right">{item.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Report History */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-800 mb-4">Report History</h3>
        {latestReport && (
          <div className="mb-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-indigo-500" />
                <span className="text-sm font-medium text-indigo-700">Latest: {latestReport.reportDate}</span>
                <span className="text-xs text-indigo-500">({latestReport.scannerSource})</span>
              </div>
              <span className="text-xs text-indigo-600">{latestReport.totalFindings} findings</span>
            </div>
          </div>
        )}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {(reports?.data || []).map((report: any) => (
            <button
              key={report.id}
              onClick={() => { setSelectedReportId(report.id); setAppView("report"); }}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors text-left"
            >
              <div className="flex items-center space-x-3">
                <FileText className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-700">{report.reportDate}</p>
                  <p className="text-xs text-slate-400">{report.scannerSource} v{report.reportVersion || "?"}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-xs text-slate-500">{report.totalFindings} vulns</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </button>
          ))}
          {(!reports?.data || reports.data.length === 0) && (
            <p className="text-sm text-slate-400 text-center py-4">No reports available</p>
          )}
        </div>
      </div>
    </div>
  );
}
