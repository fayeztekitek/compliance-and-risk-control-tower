import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ChevronRight, FileText, Shield, Layers, Loader2, RefreshCw, BarChart3, GitCompare, ExternalLink } from "lucide-react";
import { nexusApi, NexusStoredReport, NexusPolicyViolation } from "../api/nexus.api";
import { SkeletonPage } from "../components/ui/Skeleton";

interface Props {
  applicationId?: string;
  applicationPublicId?: string;
  applicationName?: string;
  onBack?: () => void;
  onBackToOverview?: () => void;
}

const API_BASE = "/api/nexus/reports";

const sevDotColors: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-amber-500",
  low: "bg-slate-400",
};

function SeverityBadge({ count, label, color }: { count: number; label: string; color: string }) {
  return (
    <div className="text-center">
      <div className={`text-lg font-bold ${color}`}>{count}</div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  );
}

function SevInline({ c, h, m, l }: { c: number; h: number; m: number; l: number }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {c > 0 && <span className="text-red-600 font-medium">{c}C</span>}
      {h > 0 && <span className="text-orange-600 font-medium">{h}H</span>}
      {m > 0 && <span className="text-amber-600 font-medium">{m}M</span>}
      {l > 0 && <span className="text-slate-400 font-medium">{l}L</span>}
    </div>
  );
}

export default function NexusApplicationDetail({ applicationId: propAppId, applicationPublicId, applicationName, onBack, onBackToOverview }: Props) {
  const { appId } = useParams<{ appId: string }>();
  const navigate = useNavigate();
  const applicationId = propAppId || appId || "";
  const [reports, setReports] = useState<NexusStoredReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  // Compare
  const [compareA, setCompareA] = useState<string>("");
  const [compareB, setCompareB] = useState<string>("");

  // Inline violation panel
  const [selectedReport, setSelectedReport] = useState<NexusStoredReport | null>(null);
  const [reportViolations, setReportViolations] = useState<NexusPolicyViolation[]>([]);
  const [violationsLoading, setViolationsLoading] = useState(false);

  const sessionToken = sessionStorage.getItem("nexus_session_token");

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await nexusApi.getStoredReports(applicationId, { limit: 100 });
      setReports(res.data.data || []);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => { loadReports(); }, [loadReports]);

  const handleSync = async () => {
    if (!sessionToken) return;
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await nexusApi.syncNexusReports(sessionToken, applicationId, applicationPublicId);
      setSyncResult(`Synced ${res.data.data.reportsSynced} reports, ${res.data.data.violationsSynced} violations, ${res.data.data.componentsSynced} components`);
      await loadReports();
    } catch (err: any) {
      setSyncResult(`Sync failed: ${err?.response?.data?.error || err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const openViolations = async (report: NexusStoredReport) => {
    if (selectedReport?.id === report.id) {
      setSelectedReport(null);
      setReportViolations([]);
      return;
    }
    setSelectedReport(report);
    setViolationsLoading(true);
    setReportViolations([]);
    try {
      const res = await nexusApi.getStoredReportViolations(report.id, { page: 1, limit: 50 });
      setReportViolations(res.data.data || []);
    } catch {
      setReportViolations([]);
    } finally {
      setViolationsLoading(false);
    }
  };

  const appName = applicationName || applicationId;

  if (loading) return <SkeletonPage />;

  const totalCritical = reports.reduce((s, r) => s + r.criticalCount, 0);
  const totalHigh = reports.reduce((s, r) => s + r.highCount, 0);
  const totalMedium = reports.reduce((s, r) => s + r.mediumCount, 0);
  const totalLow = reports.reduce((s, r) => s + r.lowCount, 0);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-slate-500">
        {onBackToOverview ? <><button onClick={onBackToOverview} className="hover:text-indigo-600">Nexus IQ</button><span>/</span></> : <Link to="/nexus" className="hover:text-indigo-600">Nexus IQ</Link>}
        {onBackToOverview && <span>/</span>}
        <span className="text-slate-800 font-medium">{appName}</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack || (() => navigate('/nexus'))} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{appName}</h1>
            <p className="text-sm text-slate-500">{reports.length} scan report{reports.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/nexus/evolution/${applicationId}?applicationName=${encodeURIComponent(appName)}`}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"
          >
            <BarChart3 className="w-4 h-4" />
            Evolution
          </Link>
          <button
            onClick={handleSync}
            disabled={syncing || !sessionToken}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing..." : "Sync"}
          </button>
        </div>
      </div>

      {syncResult && (
        <div className={`text-sm p-3 rounded-lg ${syncResult.startsWith("Synced") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {syncResult}
        </div>
      )}

      {/* Aggregate Severity Summary */}
      {reports.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-semibold text-slate-700">Aggregate Severity (all reports)</h2>
          </div>
          <div className="grid grid-cols-5 gap-3">
            <SeverityBadge label="Critical" count={totalCritical} color="text-red-600" />
            <SeverityBadge label="High" count={totalHigh} color="text-orange-600" />
            <SeverityBadge label="Medium" count={totalMedium} color="text-amber-600" />
            <SeverityBadge label="Low" count={totalLow} color="text-slate-500" />
            <SeverityBadge label="Total" count={totalCritical + totalHigh + totalMedium + totalLow} color="text-indigo-600" />
          </div>
        </div>
      )}

      {/* Compare Controls */}
      <div className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 px-5 py-3">
        <GitCompare className="w-4 h-4 text-slate-400" />
        <span className="text-sm text-slate-600">Compare:</span>
        <select
          className="text-sm border border-slate-200 rounded px-2 py-1"
          value={compareA}
          onChange={(e) => setCompareA(e.target.value)}
        >
          <option value="">Select report A</option>
          {reports.map(r => <option key={r.id} value={r.id}>{r.scanDate} ({r.stage})</option>)}
        </select>
        <span className="text-slate-300">vs</span>
        <select
          className="text-sm border border-slate-200 rounded px-2 py-1"
          value={compareB}
          onChange={(e) => setCompareB(e.target.value)}
        >
          <option value="">Select report B</option>
          {reports.map(r => <option key={r.id} value={r.id}>{r.scanDate} ({r.stage})</option>)}
        </select>
        <button
          onClick={() => {
            if (compareA && compareB) {
              navigate(`/nexus/compare?reportA=${compareA}&reportB=${compareB}`);
            }
          }}
          disabled={!compareA || !compareB}
          className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          Go
        </button>
      </div>

      {/* Report List */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-5 py-3 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700">Reports ({reports.length})</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {reports.map((r) => (
            <div key={r.id}>
              <button
                onClick={() => openViolations(r)}
                className="w-full px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{r.reportTitle || "Scan Report"}</p>
                    <p className="text-xs text-slate-400">
                      {r.scanDate} · {r.stage}
                      {r.initiator && ` · ${r.initiator}`}
                      {r.commitHash && <span className="font-mono ml-1">· {r.commitHash.slice(0, 7)}</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {r.totalViolations > 0 && (
                    <SevInline c={r.criticalCount} h={r.highCount} m={r.mediumCount} l={r.lowCount} />
                  )}
                  <span className="text-xs text-slate-400 min-w-[4rem] text-right">{r.totalViolations} violations</span>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
              </button>

              {/* Inline Violation Panel */}
              {selectedReport?.id === r.id && (
                <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-slate-700">Violations (preview)</h4>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/nexus/report/${r.id}?applicationId=${applicationId}&applicationName=${encodeURIComponent(appName)}`}
                        className="flex items-center gap-1 text-xs text-indigo-600 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Full Report
                      </Link>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedReport(null); setReportViolations([]); }}
                        className="text-xs text-slate-500 hover:underline"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                  {violationsLoading ? (
                    <div className="flex items-center justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-slate-300" /></div>
                  ) : reportViolations.length === 0 ? (
                    <div className="text-sm text-slate-400 py-4 text-center">No violations in this report</div>
                  ) : (
                    <div className="space-y-1.5 max-h-80 overflow-y-auto">
                      {reportViolations.map((v) => {
                        const tl = v.threatLevel ?? 0;
                        const dotColor = tl >= 8 ? "bg-red-500" : tl >= 5 ? "bg-orange-500" : tl >= 3 ? "bg-amber-500" : "bg-slate-400";
                        return (
                          <div key={v.violationId} className="flex items-center gap-3 text-xs bg-white rounded-lg px-3 py-2 border border-slate-100">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-slate-700 truncate">{v.displayName || v.componentName || v.policyName}</span>
                                {v.cveId && <span className="text-slate-400 font-mono text-[10px]">{v.cveId}</span>}
                              </div>
                              <div className="text-slate-400">{v.policyName}{v.constraintName ? ` / ${v.constraintName}` : ""}</div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                v.status === "OPEN" ? "bg-red-50 text-red-600" :
                                v.status === "WAIVED" ? "bg-amber-50 text-amber-600" :
                                v.status === "FIXED" ? "bg-green-50 text-green-600" :
                                "bg-slate-50 text-slate-500"
                              }`}>
                                {v.status}
                              </span>
                              <span className="text-slate-400">{tl >= 8 ? "CRITICAL" : tl >= 5 ? "HIGH" : tl >= 3 ? "MEDIUM" : "LOW"}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {reports.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-slate-400">
              No scan reports stored. Click <strong>Sync</strong> to fetch from Nexus IQ.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}