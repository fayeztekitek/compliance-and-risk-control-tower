import { useState } from "react";
import {
  AlertTriangle, CheckCircle, Bug,
  Building2, Layers, FileText, X, Loader2,
} from "lucide-react";
import { useLiveNexusKpis, useNexusLifecycleOccurrences } from "../hooks/useDashboard";
import { useNavigate } from "react-router-dom";

export default function ExecutiveDashboard() {
  const nexusSessionToken = localStorage.getItem("nexus_session_token");
  const { data: liveNexusKpis, isFetching: liveKpisLoading } = useLiveNexusKpis(nexusSessionToken);
  const [selectedVulnId, setSelectedVulnId] = useState<string | null>(null);
  const { data: vulnOccurrences } = useNexusLifecycleOccurrences(selectedVulnId);
  const navigate = useNavigate();

  if (!nexusSessionToken) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500">
        <Building2 className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-semibold text-slate-700 mb-2">Not Connected to Nexus IQ</h2>
        <p className="text-sm text-slate-400 mb-6">
          Connect to a Nexus IQ server to see live executive KPIs.
        </p>
        <button
          onClick={() => navigate("/nexus")}
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          Go to Nexus Overview
        </button>
      </div>
    );
  }

  if (liveKpisLoading && !liveNexusKpis) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
        <p className="text-sm text-slate-400">Fetching live KPIs from Nexus IQ...</p>
      </div>
    );
  }

  if (!liveNexusKpis) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500">
        <AlertTriangle className="w-12 h-12 text-amber-400 mb-4" />
        <p className="text-lg font-medium">Unable to load live Nexus IQ KPIs.</p>
        <p className="text-sm mt-1">Check your connection and try again.</p>
        <button
          onClick={() => navigate("/nexus")}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
        >
          Reconnect to Nexus IQ
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Executive Dashboard</h2>
          <p className="text-sm text-slate-500 mt-1">
            Live data from Nexus IQ
          </p>
        </div>
      </div>

      {/* Nexus IQ Executive KPIs (Live) */}
      <div className="flex items-center gap-2">
        <Building2 className="w-5 h-5 text-emerald-500" />
        <h3 className="text-lg font-semibold text-slate-800">Nexus IQ Executive KPIs (Live)</h3>
        {liveKpisLoading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
      </div>
      {liveNexusKpis.errors?.length > 0 && (
        <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
          {liveNexusKpis.errors.length} warning(s) during aggregation. Some data may be partial.
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-emerald-200 border-l-4 border-l-emerald-500 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100"><Building2 className="w-5 h-5 text-emerald-600" /></div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Organizations</p>
              <p className="text-lg font-bold text-slate-800">{liveNexusKpis.totalOrganizations?.toLocaleString() ?? "—"}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-emerald-200 border-l-4 border-l-emerald-500 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100"><Layers className="w-5 h-5 text-blue-600" /></div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Applications</p>
              <p className="text-lg font-bold text-slate-800">{liveNexusKpis.totalApplications?.toLocaleString() ?? "—"}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-emerald-200 border-l-4 border-l-emerald-500 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-100"><FileText className="w-5 h-5 text-slate-600" /></div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Scan Reports</p>
              <p className="text-lg font-bold text-slate-800">{liveNexusKpis.totalScanReports?.toLocaleString() ?? "—"}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-emerald-200 border-l-4 border-l-emerald-500 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100"><CheckCircle className="w-5 h-5 text-green-600" /></div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Apps Scanned</p>
              <p className="text-lg font-bold text-green-700">{liveNexusKpis.applicationsWithScan?.toLocaleString() ?? "—"}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-emerald-200 border-l-4 border-l-emerald-500 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100"><X className="w-5 h-5 text-red-600" /></div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Apps Not Scanned</p>
              <p className="text-lg font-bold text-red-700">{liveNexusKpis.applicationsWithoutScan?.toLocaleString() ?? "—"}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-red-200 border-l-4 border-l-red-500 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100"><Bug className="w-5 h-5 text-red-600" /></div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Distinct Open Vulns</p>
              <p className="text-lg font-bold text-red-700">{liveNexusKpis.distinctOpenVulnerabilities?.toLocaleString() ?? "—"}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-red-200 border-l-4 border-l-red-500 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100"><AlertTriangle className="w-5 h-5 text-orange-600" /></div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Open Occurrences</p>
              <p className="text-lg font-bold text-slate-800">{liveNexusKpis.totalOpenOccurrences?.toLocaleString() ?? "—"}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-red-300 border-l-4 border-l-red-500 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100"><Bug className="w-5 h-5 text-red-600" /></div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Critical Open</p>
              <p className="text-lg font-bold text-red-700">{liveNexusKpis.criticalDistinctOpen?.toLocaleString() ?? "—"}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-orange-300 border-l-4 border-l-orange-500 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100"><AlertTriangle className="w-5 h-5 text-orange-600" /></div>
            <div>
              <p className="text-xs text-slate-500 font-medium">High Open</p>
              <p className="text-lg font-bold text-orange-700">{liveNexusKpis.highDistinctOpen?.toLocaleString() ?? "—"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Open Vulnerabilities by Occurrence — Live Nexus IQ */}
      {liveNexusKpis.topVulnerabilities && liveNexusKpis.topVulnerabilities.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Bug className="w-5 h-5" /> Top Open Vulnerabilities by Occurrence (Live)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Vulnerability ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Severity</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Occurrences</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Impacted Apps</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Impacted Orgs</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Last Seen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {liveNexusKpis.topVulnerabilities.map((vuln, i) => (
                  <tr key={vuln.vulnerabilityId} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-400">{i + 1}</td>
                    <td className="px-4 py-3 font-mono text-xs font-medium text-slate-700">{vuln.vulnerabilityId}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{vuln.type}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                        vuln.severity === "CRITICAL" ? "bg-red-100 text-red-700" :
                        vuln.severity === "HIGH" ? "bg-orange-100 text-orange-700" :
                        vuln.severity === "MEDIUM" ? "bg-amber-100 text-amber-700" :
                        "bg-slate-100 text-slate-700"
                      }`}>
                        {vuln.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800">{vuln.occurrenceCount}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{vuln.impactedApplications}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{vuln.impactedOrganizations}</td>
                    <td className="px-4 py-3 text-right text-xs text-slate-400">
                      {vuln.lastSeen ? new Date(vuln.lastSeen).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Drill-down Modal — Occurrences for selected vulnerability */}
      {selectedVulnId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setSelectedVulnId(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full mx-4 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 font-mono">{selectedVulnId}</h3>
              <button onClick={() => setSelectedVulnId(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-6">
              {!vulnOccurrences ? (
                <div className="flex items-center justify-center py-12 text-slate-400">
                  <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-2" />
                  Loading...
                </div>
              ) : vulnOccurrences.length === 0 ? (
                <p className="text-center text-slate-400 py-8">No occurrences found.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Organization</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Application</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Component</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-slate-500">Report Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {vulnOccurrences.map((occ, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-3 py-2 text-slate-700">{occ.organizationName}</td>
                        <td className="px-3 py-2 text-slate-700">{occ.applicationName}</td>
                        <td className="px-3 py-2 text-slate-500 font-mono text-xs">{occ.componentName}</td>
                        <td className="px-3 py-2 text-right text-slate-500 text-xs">{new Date(occ.reportDate).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
