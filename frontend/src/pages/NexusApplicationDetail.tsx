import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, ChevronRight, Clock, FileText, Bug, AlertTriangle, Shield, Layers, Loader2 } from "lucide-react";
import { nexusApi } from "../api/nexus.api";
import { SkeletonPage } from "../components/ui/Skeleton";

interface Props {
  applicationId: string;
  applicationName?: string;
  onBack: () => void;
  onBackToOverview?: () => void;
}

type SeverityCounts = { critical: number; high: number; medium: number; low: number; total: number };

export default function NexusApplicationDetail({ applicationId, applicationName, onBack, onBackToOverview }: Props) {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [severities, setSeverities] = useState<Record<string, SeverityCounts>>({});
  const [latestSev, setLatestSev] = useState<SeverityCounts | null>(null);

  // Attempt to read sessionToken from localStorage or from the connect flow
  // The sessionToken is stored in NexusOverview state — we read it from the API response.
  // For simplicity, we re-fetch using a minimal sessionToken stored in sessionStorage.
  const sessionToken = sessionStorage.getItem("nexus_session_token");

  const loadData = useCallback(async () => {
    if (!sessionToken) { setLoading(false); return; }
    setLoading(true);
    try {
      const hist = await nexusApi.fetchNexusReportHistory({ sessionToken, applicationId });
      const reportList = hist.data.data.reports || [];
      setReports(reportList);

      // Fetch severity counts for each report in parallel
      const sevMap: Record<string, SeverityCounts> = {};
      await Promise.all(reportList.map(async (r: any) => {
        try {
          const v = await nexusApi.fetchNexusReportViolations({
            sessionToken,
            applicationPublicId: r.applicationId || applicationId,
            scanId: r.reportId,
          });
          sevMap[r.reportId] = v.data.data.severityCounts;
        } catch {
          sevMap[r.reportId] = { critical: 0, high: 0, medium: 0, low: 0, total: 0 };
        }
      }));
      setSeverities(sevMap);

      if (reportList.length > 0) {
        setLatestSev(reportList[0] ? sevMap[reportList[0].reportId] || null : null);
      }
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [sessionToken, applicationId]);

  useEffect(() => { loadData(); }, [loadData]);

  const appName = applicationName || applicationId;

  if (loading) return <SkeletonPage />;

  const sevColors: Record<string, string> = {
    critical: "text-red-600 bg-red-50",
    high: "text-orange-600 bg-orange-50",
    medium: "text-amber-600 bg-amber-50",
    low: "text-slate-500 bg-slate-50",
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-slate-500">
        {onBackToOverview && <><button onClick={onBackToOverview} className="hover:text-violet-600">Nexus IQ</button><span>/</span></>}
        <span className="text-slate-800 font-medium">{appName}</span>
      </nav>

      {/* Header */}
      <div className="flex items-center space-x-4">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{appName}</h1>
          <p className="text-sm text-slate-500">{reports.length} scan report{reports.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Latest Scan Summary */}
      {latestSev && reports.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-violet-500" />
              <h2 className="text-sm font-semibold text-slate-700">Latest Scan</h2>
            </div>
            <span className="text-xs text-slate-400">
              {new Date(reports[0].reportTime).toLocaleDateString()} · {reports[0].stage} · {reports[0].reportTitle}
            </span>
          </div>
          <div className="grid grid-cols-5 gap-3">
            {[
              { label: "Critical", key: "critical", color: "bg-red-500" },
              { label: "High", key: "high", color: "bg-orange-500" },
              { label: "Medium", key: "medium", color: "bg-amber-500" },
              { label: "Low", key: "low", color: "bg-slate-400" },
              { label: "Total", key: "total", color: "bg-violet-500" },
            ].map((item) => (
              <div key={item.key} className="text-center">
                <div className={`text-lg font-bold ${item.key === "total" ? "text-violet-600" : sevColors[item.key]?.split(" ")[0] || "text-slate-600"}`}>
                  {(latestSev as any)[item.key] ?? 0}
                </div>
                <div className="text-xs text-slate-400">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Report List */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-5 py-3 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700">All Scans</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {reports.map((r: any) => {
            const sev = severities[r.reportId];
            return (
              <div key={r.reportId} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      {r.reportTitle}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(r.reportTime).toLocaleDateString()} · {r.stage}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {sev && (
                    <div className="flex items-center gap-2 text-xs">
                      {sev.critical > 0 && <span className="text-red-600 font-medium">{sev.critical} C</span>}
                      {sev.high > 0 && <span className="text-orange-600 font-medium">{sev.high} H</span>}
                      {sev.medium > 0 && <span className="text-amber-600 font-medium">{sev.medium} M</span>}
                      <span className="text-slate-400">({sev.total})</span>
                    </div>
                  )}
                  {!sev && <Loader2 className="w-3 h-3 animate-spin text-slate-300" />}
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
              </div>
            );
          })}
          {reports.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-slate-400">No scan reports found</div>
          )}
        </div>
      </div>
    </div>
  );
}
