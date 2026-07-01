import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Shield, Loader2, RefreshCw, BarChart3, ExternalLink, Bug } from "lucide-react";
import { nexusApi, NexusStoredReport, NexusPolicyViolation } from "../api/nexus.api";
import { SkeletonPage } from "../components/ui/Skeleton";

interface Props {
  applicationId?: string;
  applicationPublicId?: string;
  applicationName?: string;
  organizationName?: string;
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

export default function NexusApplicationDetail({ applicationId: propAppId, applicationPublicId, applicationName, organizationName: propOrgName, onBack, onBackToOverview }: Props) {
  const { appId } = useParams<{ appId: string }>();
  const organizationName = propOrgName || "";
  const navigate = useNavigate();
  const applicationId = propAppId || appId || "";
  const [reports, setReports] = useState<NexusStoredReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const sessionToken = localStorage.getItem("nexus_session_token");

  // Live vulnerabilities from Nexus IQ
  const [vulnIssues, setVulnIssues] = useState<any[]>([]);
  const [vulnLoading, setVulnLoading] = useState(false);
  const [vulnCounts, setVulnCounts] = useState<{ distinctCount: number; severityCounts: { critical: number; high: number; medium: number; low: number }; statusCounts: Record<string, number> } | null>(null);

  const fetchVulnerabilities = useCallback(async (publicId: string, scanId: string) => {
    if (!sessionToken || !publicId || !scanId) return;
    setVulnLoading(true);
    try {
      const res = await nexusApi.fetchNexusReportVulnerabilities({ sessionToken, applicationPublicId: publicId, scanId });
      setVulnIssues(res.data.data.issues || []);
      setVulnCounts(res.data.data);
    } catch {
      setVulnIssues([]);
      setVulnCounts(null);
    } finally {
      setVulnLoading(false);
    }
  }, [sessionToken]);

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await nexusApi.getStoredReports(applicationId, { limit: 100 });
      const list = res.data.data || [];
      setReports(list);
      // Fetch live vulnerabilities for the latest report
      if (list.length > 0 && applicationPublicId && sessionToken) {
        const latest = list[0];
        const scanId = latest.scanId;
        if (scanId) {
          fetchVulnerabilities(applicationPublicId, scanId);
        }
      }
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [applicationId, applicationPublicId, sessionToken, fetchVulnerabilities]);

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

  const appName = applicationName || applicationId;

  if (loading) return <SkeletonPage />;

  const totalCritical = reports.reduce((s, r) => s + r.criticalCount, 0);
  const totalHigh = reports.reduce((s, r) => s + r.highCount, 0);
  const totalMedium = reports.reduce((s, r) => s + r.mediumCount, 0);
  const totalLow = reports.reduce((s, r) => s + r.lowCount, 0);
  const totalWaived = reports.reduce((s, r) => s + (r as any).waivedCount, 0);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500">
        {onBackToOverview ? (
          <button onClick={onBackToOverview} className="hover:text-indigo-600">Nexus IQ</button>
        ) : (
          <Link to="/nexus" className="hover:text-indigo-600">Nexus IQ</Link>
        )}
        <span>/</span>
        {organizationName && (
          <>
            <span className="text-slate-600">{organizationName}</span>
            <span>/</span>
          </>
        )}
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
          {sessionToken && applicationPublicId && (() => {
            const nexusUrl = localStorage.getItem("nexus_url");
            const nativeUrl = nexusUrl
              ? `${nexusUrl}/assets/index.html#/applicationLatestEvaluations/${applicationPublicId}/stage/build`
              : null;
            return nativeUrl ? (
              <a
                href={nativeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"
              >
                <ExternalLink className="w-4 h-4" />
                Latest Evaluations
              </a>
            ) : null;
          })()}
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

      {/* Policy Violation Summary */}
      {reports.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-semibold text-slate-700">Policy Violations (all reports)</h2>
          </div>
          <div className="grid grid-cols-5 gap-3">
            <SeverityBadge label="Critical" count={totalCritical} color="text-red-600" />
            <SeverityBadge label="High" count={totalHigh} color="text-orange-600" />
            <SeverityBadge label="Medium" count={totalMedium} color="text-amber-600" />
            <SeverityBadge label="Low" count={totalLow} color="text-slate-500" />
            {totalWaived > 0 && <SeverityBadge label="Waived" count={totalWaived} color="text-slate-400" />}
            <SeverityBadge label="Total" count={totalCritical + totalHigh + totalMedium + totalLow} color="text-indigo-600" />
          </div>
        </div>
      )}

      {/* Security Vulnerabilities (live from Nexus IQ) */}
      {vulnCounts && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bug className="w-4 h-4 text-red-500" />
            <h2 className="text-sm font-semibold text-slate-700">Security Vulnerabilities (latest report — live)</h2>
          </div>
          <div className="grid grid-cols-5 gap-3">
            <SeverityBadge label="Critical" count={vulnCounts.severityCounts.critical} color="text-red-600" />
            <SeverityBadge label="High" count={vulnCounts.severityCounts.high} color="text-orange-600" />
            <SeverityBadge label="Medium" count={vulnCounts.severityCounts.medium} color="text-amber-600" />
            <SeverityBadge label="Low" count={vulnCounts.severityCounts.low} color="text-slate-500" />
            <SeverityBadge label="Distinct" count={vulnCounts.distinctCount} color="text-indigo-600" />
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
            {Object.entries(vulnCounts.statusCounts).map(([status, count]) => (
              <span key={status}>
                <span className={`font-medium ${status === "Open" ? "text-red-500" : status === "Waived" ? "text-amber-500" : status === "Fixed" ? "text-green-500" : ""}`}>{count}</span>
                {" "}{status}
              </span>
            ))}
          </div>
        </div>
      )}
      {vulnLoading && (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading vulnerabilities...
        </div>
      )}


      {/* Report Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">Reports ({reports.length})</h3>
          <Link
            to={`/nexus/evolution/${applicationId}?applicationName=${encodeURIComponent(appName)}`}
            className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
          >
            <BarChart3 className="w-3 h-3" />
            Evolution
          </Link>
        </div>
        {reports.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-slate-400">
            No scan reports stored. Click <strong>Sync</strong> to fetch from Nexus IQ.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                  <th className="text-left px-5 py-2.5 font-medium">Evaluation Date</th>
                  <th className="text-left px-5 py-2.5 font-medium">Trigger</th>
                  <th className="text-left px-5 py-2.5 font-medium">Version</th>
                  <th className="text-center px-5 py-2.5 font-medium">Violations</th>
                  <th className="text-right px-5 py-2.5 font-medium">Components</th>
                  <th className="text-right px-5 py-2.5 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 text-slate-700 whitespace-nowrap font-mono text-xs">
                      {r.scanDate}
                    </td>
                    <td className="px-5 py-3 text-slate-600 whitespace-nowrap text-xs">
                      {r.initiator || "—"}
                    </td>
                    <td className="px-5 py-3 text-slate-600 whitespace-nowrap font-mono text-xs">
                      {r.commitHash ? r.commitHash.slice(0, 7) : "—"}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex items-center justify-center gap-2 text-xs font-semibold">
                        <span className="text-red-600">{r.criticalCount}</span>
                        <span className="text-orange-600">{r.highCount}</span>
                        <span className="text-amber-600">{r.mediumCount}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right text-slate-700 text-xs font-medium">
                      {r.totalComponents}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/nexus/report/${r.id}?applicationId=${applicationId}&applicationName=${encodeURIComponent(appName)}`}
                          className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
                        >
                          View Report
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}