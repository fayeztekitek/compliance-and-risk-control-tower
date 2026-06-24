import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, ChevronRight, Clock, FileText, Bug, AlertTriangle, Shield, Layers, Loader2, RefreshCw, BarChart3, GitCompare } from "lucide-react";
import { nexusApi, NexusStoredReport, NexusPolicyViolation, ReportComparisonResult, NexusEvolutionPoint } from "../api/nexus.api";
import { SkeletonPage } from "../components/ui/Skeleton";

interface Props {
  applicationId: string;
  applicationName?: string;
  onBack: () => void;
  onBackToOverview?: () => void;
}

type View = "reports" | "report-detail" | "compare" | "evolution";

const sevColors: Record<string, string> = {
  critical: "text-red-600 bg-red-50",
  high: "text-orange-600 bg-orange-50",
  medium: "text-amber-600 bg-amber-50",
  low: "text-slate-500 bg-slate-50",
};

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

export default function NexusApplicationDetail({ applicationId, applicationName, onBack, onBackToOverview }: Props) {
  const [view, setView] = useState<View>("reports");
  const [reports, setReports] = useState<NexusStoredReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  // Selected report for detail view
  const [selectedReport, setSelectedReport] = useState<NexusStoredReport | null>(null);
  const [reportViolations, setReportViolations] = useState<NexusPolicyViolation[]>([]);
  const [violationsLoading, setViolationsLoading] = useState(false);
  const [violationFilters, setViolationFilters] = useState<{ status?: string; search?: string }>({});

  // Compare
  const [compareA, setCompareA] = useState<string | null>(null);
  const [compareB, setCompareB] = useState<string | null>(null);
  const [compareResult, setCompareResult] = useState<ReportComparisonResult | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);

  // Evolution
  const [evolution, setEvolution] = useState<NexusEvolutionPoint[]>([]);
  const [evolutionLoading, setEvolutionLoading] = useState(false);

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
      const res = await nexusApi.syncNexusReports(sessionToken, applicationId);
      setSyncResult(`Synced ${res.data.data.reportsSynced} reports, ${res.data.data.violationsSynced} violations, ${res.data.data.componentsSynced} components`);
      await loadReports();
    } catch (err: any) {
      setSyncResult(`Sync failed: ${err?.response?.data?.error || err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const openReport = async (report: NexusStoredReport) => {
    setSelectedReport(report);
    setView("reports"); // stay in reports view, open violation panel inline
    setViolationsLoading(true);
    setReportViolations([]);
    try {
      const res = await nexusApi.getStoredReportViolations(report.scanId, { page: 1, limit: 200 });
      setReportViolations(res.data.data || []);
    } catch {
      setReportViolations([]);
    } finally {
      setViolationsLoading(false);
    }
  };

  const handleCompare = async () => {
    if (!compareA || !compareB) return;
    setCompareLoading(true);
    try {
      const res = await nexusApi.compareStoredReports(compareA, compareB);
      setCompareResult(res.data.data);
      setView("compare");
    } catch {
      setCompareResult(null);
    } finally {
      setCompareLoading(false);
    }
  };

  const handleEvolution = async () => {
    setEvolutionLoading(true);
    try {
      const res = await nexusApi.getEvolution(applicationId);
      setEvolution(res.data.data || []);
      setView("evolution");
    } catch {
      setEvolution([]);
    } finally {
      setEvolutionLoading(false);
    }
  };

  const appName = applicationName || applicationId;

  if (loading) return <SkeletonPage />;

  // ---- Compare View ----
  if (view === "compare" && compareResult) {
    const { reportA, reportB, addedViolations, removedViolations, sameViolations, statusChangedViolations, summary } = compareResult;
    return (
      <div className="space-y-6">
        <nav className="flex items-center space-x-2 text-sm text-slate-500">
          {onBackToOverview && <><button onClick={onBackToOverview} className="hover:text-violet-600">Nexus IQ</button><span>/</span></>}
          <button onClick={() => { setView("reports"); setCompareResult(null); }} className="hover:text-violet-600">{appName}</button>
          <span>/</span>
          <span className="text-slate-800 font-medium">Compare</span>
        </nav>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800">Compare Reports</h1>
          <button onClick={() => { setView("reports"); setCompareResult(null); }} className="text-sm text-violet-600 hover:underline">Back</button>
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-500">
          <div className="bg-slate-100 px-3 py-1 rounded">{reportA.scanDate} ({reportA.stage})</div>
          <span>vs</span>
          <div className="bg-slate-100 px-3 py-1 rounded">{reportB.scanDate} ({reportB.stage})</div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <SeverityBadge label="Added" count={addedViolations.length} color="text-red-600" />
          <SeverityBadge label="Removed" count={removedViolations.length} color="text-green-600" />
          <SeverityBadge label="Same" count={sameViolations.length} color="text-slate-600" />
          <SeverityBadge label="Status Changed" count={statusChangedViolations.length} color="text-violet-600" />
        </div>
        {[
          { title: `Added (${addedViolations.length})`, list: addedViolations, color: "text-red-600", bg: "bg-red-50" },
          { title: `Removed (${removedViolations.length})`, list: removedViolations, color: "text-green-600", bg: "bg-green-50" },
          { title: `Same (${sameViolations.length})`, list: sameViolations, color: "text-slate-600", bg: "bg-slate-50" },
        ].map(section => section.list.length > 0 && (
          <div key={section.title} className={`rounded-xl border p-4 ${section.bg}`}>
            <h3 className={`text-sm font-semibold mb-3 ${section.color}`}>{section.title}</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {section.list.slice(0, 50).map((v: any) => (
                <div key={v.violationId} className="text-xs flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${(v.threatLevel ?? 0) >= 8 ? "bg-red-500" : (v.threatLevel ?? 0) >= 5 ? "bg-orange-500" : (v.threatLevel ?? 0) >= 3 ? "bg-amber-500" : "bg-slate-400"}`} />
                  <span className="text-slate-700 truncate">{v.displayName || v.componentName || v.policyName}</span>
                  {v.cveId && <span className="text-slate-400 font-mono">{v.cveId}</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ---- Evolution View ----
  if (view === "evolution") {
    return (
      <div className="space-y-6">
        <nav className="flex items-center space-x-2 text-sm text-slate-500">
          {onBackToOverview && <><button onClick={onBackToOverview} className="hover:text-violet-600">Nexus IQ</button><span>/</span></>}
          <button onClick={() => { setView("reports"); setEvolutionLoading(false); }} className="hover:text-violet-600">{appName}</button>
          <span>/</span>
          <span className="text-slate-800 font-medium">Evolution</span>
        </nav>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800">Vulnerability Evolution</h1>
          <button onClick={() => setView("reports")} className="text-sm text-violet-600 hover:underline">Back</button>
        </div>
        {evolutionLoading ? <SkeletonPage /> : (
          <div className="space-y-3">
            {evolution.map((e) => (
              <div key={e.reportId} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-700">{e.scanDate}</span>
                    <span className="text-xs text-slate-400">{e.stage}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <SevInline c={e.criticalCount} h={e.highCount} m={e.mediumCount} l={e.lowCount} />
                    <span className="text-slate-400 font-medium">{e.totalViolations} total</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="text-green-600">+{e.newViolations} new</span>
                  <span className="text-red-600">-{e.fixedViolations} fixed</span>
                  {e.componentChurn && (
                    <>
                      <span>+{e.componentChurn.newComponents} components</span>
                      <span>-{e.componentChurn.removedComponents} components</span>
                    </>
                  )}
                </div>
              </div>
            ))}
            {evolution.length === 0 && <div className="text-center text-sm text-slate-400 py-8">No evolution data available</div>}
          </div>
        )}
      </div>
    );
  }

  // ---- Reports List View (default) ----
  const totalCritical = reports.reduce((s, r) => s + r.criticalCount, 0);
  const totalHigh = reports.reduce((s, r) => s + r.highCount, 0);
  const totalMedium = reports.reduce((s, r) => s + r.mediumCount, 0);
  const totalLow = reports.reduce((s, r) => s + r.lowCount, 0);
  const selectedReportViolations = reportViolations;
  const showViolationPanel = selectedReport !== null;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-slate-500">
        {onBackToOverview && <><button onClick={onBackToOverview} className="hover:text-violet-600">Nexus IQ</button><span>/</span></>}
        <span className="text-slate-800 font-medium">{appName}</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{appName}</h1>
            <p className="text-sm text-slate-500">{reports.length} scan report{reports.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => handleEvolution()} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
            <BarChart3 className="w-4 h-4" />
            Evolution
          </button>
          <button
            onClick={handleSync}
            disabled={syncing || !sessionToken}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
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
            <Shield className="w-4 h-4 text-violet-500" />
            <h2 className="text-sm font-semibold text-slate-700">Aggregate Severity (all reports)</h2>
          </div>
          <div className="grid grid-cols-5 gap-3">
            <SeverityBadge label="Critical" count={totalCritical} color="text-red-600" />
            <SeverityBadge label="High" count={totalHigh} color="text-orange-600" />
            <SeverityBadge label="Medium" count={totalMedium} color="text-amber-600" />
            <SeverityBadge label="Low" count={totalLow} color="text-slate-500" />
            <SeverityBadge label="Total" count={totalCritical + totalHigh + totalMedium + totalLow} color="text-violet-600" />
          </div>
        </div>
      )}

      {/* Compare Controls */}
      <div className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 px-5 py-3">
        <GitCompare className="w-4 h-4 text-slate-400" />
        <span className="text-sm text-slate-600">Compare:</span>
        <select
          className="text-sm border border-slate-200 rounded px-2 py-1"
          value={compareA || ""}
          onChange={(e) => setCompareA(e.target.value || null)}
        >
          <option value="">Select report A</option>
          {reports.map(r => <option key={r.scanId} value={r.scanId}>{r.scanDate} ({r.stage})</option>)}
        </select>
        <span className="text-slate-300">vs</span>
        <select
          className="text-sm border border-slate-200 rounded px-2 py-1"
          value={compareB || ""}
          onChange={(e) => setCompareB(e.target.value || null)}
        >
          <option value="">Select report B</option>
          {reports.map(r => <option key={r.scanId} value={r.scanId}>{r.scanDate} ({r.stage})</option>)}
        </select>
        <button
          onClick={handleCompare}
          disabled={!compareA || !compareB || compareLoading}
          className="px-3 py-1.5 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
        >
          {compareLoading ? "Comparing..." : "Go"}
        </button>
      </div>

      {/* Report List */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-5 py-3 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700">Reports ({reports.length})</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {reports.map((r) => (
            <div key={r.scanId}>
              <button
                onClick={() => openReport(r)}
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
              {selectedReport?.scanId === r.scanId && (
                <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-slate-700">Violations</h4>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedReport(null); setReportViolations([]); }}
                      className="text-xs text-violet-600 hover:underline"
                    >
                      Close
                    </button>
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
