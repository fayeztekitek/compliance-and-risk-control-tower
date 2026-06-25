import { useState, useEffect, useCallback, useMemo } from "react";
import { Building2, Loader2, CheckCircle2, XCircle, ChevronRight, ChevronLeft, BarChart3, PieChart, Database } from "lucide-react";
import { PieChart as RechartsPie, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import NexusApplicationDetail from "./NexusApplicationDetail";
import { nexusApi, ApplicationOverview, ScanStatusResult } from "../api/nexus.api";

type NexusView = "overview" | "application";

export default function NexusOverview() {
  const [nexusView, setNexusView] = useState<NexusView>("overview");
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");

  const [nexusUrl, setNexusUrl] = useState("");
  const [nexusUsername, setNexusUsername] = useState("");
  const [nexusToken, setNexusToken] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [connectionResult, setConnectionResult] = useState<{ success: boolean; message: string; duration: number } | null>(null);
  const [remoteOrgs, setRemoteOrgs] = useState<{ organizationId: string; organizationName: string }[]>([]);
  const [connected, setConnected] = useState(false);
  const [apps, setApps] = useState<any[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [scanStatuses, setScanStatuses] = useState<Record<string, ScanStatusResult>>({});
  const [scanStatusesLoading, setScanStatusesLoading] = useState(false);

  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    const savedUrl = localStorage.getItem("nexus_url");
    const savedUsername = localStorage.getItem("nexus_username");
    const savedToken = localStorage.getItem("nexus_token");
    const savedSessionToken = localStorage.getItem("nexus_session_token");

    if (savedUrl) setNexusUrl(savedUrl);
    if (savedUsername) setNexusUsername(savedUsername);
    if (savedToken) setNexusToken(savedToken);

    if (savedUrl && savedUsername && savedToken && savedSessionToken) {
      setSessionToken(savedSessionToken);
      handleConnectWithCredentials(savedUrl, savedUsername, savedToken);
    }
  }, []);

  const handleConnectWithCredentials = async (url: string, username: string, token: string) => {
    setConnecting(true);
    setConnectionResult(null);
    try {
      const { data } = await nexusApi.connectToNexus({ url, username, token });
      setConnectionResult(data.data.connection);
      if (data.data.connection.success) {
        setRemoteOrgs(data.data.remoteOrgs);
        setConnected(true);
        if (data.data.sessionToken) {
          setSessionToken(data.data.sessionToken);
          localStorage.setItem("nexus_session_token", data.data.sessionToken);
        }
      }
    } catch {
      setConnectionResult({ success: false, message: "Connection failed: unable to reach server", duration: 0 });
    } finally {
      setConnecting(false);
    }
  };

  const handleConnect = async () => {
    localStorage.setItem("nexus_url", nexusUrl);
    localStorage.setItem("nexus_username", nexusUsername);
    localStorage.setItem("nexus_token", nexusToken);
    await handleConnectWithCredentials(nexusUrl, nexusUsername, nexusToken);
  };

  const fetchAppsForOrg = useCallback(async (orgId: string) => {
    if (!sessionToken && !orgId) { setApps([]); return; }
    setAppsLoading(true);
    setScanStatuses({});
    try {
      const { data } = await nexusApi.fetchNexusApplications({
        sessionToken: sessionToken || undefined,
        organizationId: orgId,
      });
      const appList = data.data.applications || [];
      setApps(appList);

      // Fetch live scan status from Nexus IQ API with concurrency control
      if (sessionToken && appList.length > 0) {
        setScanStatusesLoading(true);
        try {
          const appsForApi = appList.map((a: any) => ({ id: a.id, publicId: a.publicId }));
          const { data: statusRes } = await nexusApi.bulkScanStatus(sessionToken, appsForApi);
          setScanStatuses(statusRes.data || {});
        } catch {
          setScanStatuses({});
        } finally {
          setScanStatusesLoading(false);
        }
      }
    } catch {
      setApps([]);
    } finally {
      setAppsLoading(false);
    }
  }, [sessionToken]);

  useEffect(() => {
    if (selectedOrgId) {
      setPage(1);
      fetchAppsForOrg(selectedOrgId);
    } else {
      setApps([]);
    }
  }, [selectedOrgId, fetchAppsForOrg]);

  useEffect(() => {
    if (connected && remoteOrgs.length > 0 && !selectedOrgId) {
      setSelectedOrgId(remoteOrgs[0].organizationId);
    }
  }, [connected, remoteOrgs, selectedOrgId]);

  const allOrgs = connected && remoteOrgs.length > 0 ? remoteOrgs : [];
  const selectedOrgName = allOrgs.find((o) => o.organizationId === selectedOrgId)?.organizationName || "";

  if (nexusView === "application" && selectedAppId) {
    const app = apps.find((p: any) => p.id === selectedAppId);
    return (
      <NexusApplicationDetail
        applicationId={selectedAppId}
        applicationPublicId={app?.publicId}
        applicationName={app?.name}
        organizationName={selectedOrgName}
        onBack={() => { setNexusView("overview"); setSelectedAppId(null); }}
        onBackToOverview={() => { setNexusView("overview"); setSelectedAppId(null); }}
      />
    );
  }

  function buildOverview(app: any): ApplicationOverview {
    const s = scanStatuses[app.id];
    return {
      id: app.id,
      publicId: app.publicId,
      organizationId: selectedOrgId,
      applicationName: app.name,
      scanPerformed: s?.scanPerformed ?? false,
      scanReportCount: s?.scanReportCount ?? 0,
      latestScanDate: s?.latestScanDate ?? null,
      latestScanAge: s?.latestScanAge ?? "N/A",
      statusLabel: s?.statusLabel ?? "N/A",
      statusColor: s?.statusColor ?? "grey",
    };
  }

  return (
    <div className="space-y-6">
      {/* Connection Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-800">Nexus IQ Connection</h2>
          {connectionResult && (
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full ${
              connectionResult.success
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}>
              {connectionResult.success
                ? <CheckCircle2 className="w-3.5 h-3.5" />
                : <XCircle className="w-3.5 h-3.5" />
              }
              {connectionResult.success ? `Connected in ${connectionResult.duration}ms` : connectionResult.message}
            </span>
          )}
          {!connectionResult && !connecting && (
            <span className="text-xs text-slate-400">Not connected</span>
          )}
          {connecting && (
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Connecting...
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Nexus IQ URL</label>
            <input
              type="text"
              value={nexusUrl}
              onChange={(e) => setNexusUrl(e.target.value)}
              placeholder="https://soft-security:8070"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Username</label>
            <input
              type="text"
              value={nexusUsername}
              onChange={(e) => setNexusUsername(e.target.value)}
              placeholder="admin"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Token / Password</label>
            <input
              type="password"
              value={nexusToken}
              onChange={(e) => setNexusToken(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
            />
          </div>
          <button
            onClick={handleConnect}
            disabled={connecting || !nexusUrl}
            className="px-5 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
          >
            {connecting ? "Connecting..." : connected ? "Reconnect" : "Connect"}
          </button>
        </div>
      </div>

      {/* Organization Filter */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <label className="block text-sm font-medium text-slate-700 mb-2">Filter by Organization</label>
        <select
          value={selectedOrgId}
          onChange={(e) => setSelectedOrgId(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none bg-white"
        >
          <option value="">-- Select an organization --</option>
          {allOrgs.map((org: any) => (
            <option key={org.organizationId} value={org.organizationId}>
              {org.organizationName}
            </option>
          ))}
        </select>
      </div>

      {/* Stats Summary */}
      {!appsLoading && apps.length > 0 && Object.keys(scanStatuses).length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 lg:col-span-2">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">{apps.length}</div>
              <div className="text-xs text-slate-500">Total Applications</div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-700">
                {Object.values(scanStatuses).filter((s: any) => s.scanPerformed).length}
              </div>
              <div className="text-xs text-slate-500">Scanned</div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
              <XCircle className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-500">
                {Object.values(scanStatuses).filter((s: any) => !s.scanPerformed).length}
              </div>
              <div className="text-xs text-slate-500">Not Scanned</div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
              <BarChart3 className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-violet-700">
                {Object.values(scanStatuses).reduce((sum: number, s: any) => sum + (s.scanReportCount || 0), 0)}
              </div>
              <div className="text-xs text-slate-500">Total Reports</div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Row */}
      {!appsLoading && apps.length > 0 && Object.keys(scanStatuses).length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Scan Status Pie Chart */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <PieChart className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-semibold text-slate-700">Scan Coverage</h3>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <RechartsPie>
                <Pie
                  data={[
                    { name: "Scanned", value: Object.values(scanStatuses).filter((s: any) => s.scanPerformed).length, color: "#10b981" },
                    { name: "Not Scanned", value: Object.values(scanStatuses).filter((s: any) => !s.scanPerformed).length, color: "#94a3b8" },
                  ]}
                  cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                  dataKey="value" nameKey="name"
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {[
                    <Cell key="scanned" fill="#10b981" />,
                    <Cell key="not-scanned" fill="#94a3b8" />,
                  ]}
                </Pie>
                <Tooltip />
              </RechartsPie>
            </ResponsiveContainer>
          </div>

          {/* Top Apps by Reports Bar Chart */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-semibold text-slate-700">Top Apps by Reports</h3>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={(() => {
                  const withReports = apps
                    .map((a: any) => ({ name: a.name, reports: scanStatuses[a.id]?.scanReportCount || 0 }))
                    .filter((a: any) => a.reports > 0)
                    .sort((a: any, b: any) => b.reports - a.reports)
                    .slice(0, 10);
                  if (withReports.length === 0) return [{ name: "No data", reports: 0 }];
                  return withReports;
                })()}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              >
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="reports" fill="#6366f1" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Loading State */}
      {appsLoading && (
        <div className="flex items-center justify-center py-12 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          <span className="text-sm">Loading applications...</span>
        </div>
      )}

      {/* Scan Status Loading Overlay */}
      {scanStatusesLoading && apps.length > 0 && (
        <div className="flex items-center justify-center py-2 text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          <span className="text-xs">Fetching scan status...</span>
        </div>
      )}

      {/* Applications Grid */}
      {!appsLoading && apps.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-500">{apps.length} applications</span>
            {apps.length > pageSize && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-400">Page {page} of {Math.ceil(apps.length / pageSize)}</span>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-600" />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(Math.ceil(apps.length / pageSize), p + 1))}
                  disabled={page >= Math.ceil(apps.length / pageSize)}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {apps.slice((page - 1) * pageSize, page * pageSize).map((app: any) => {
              const o = buildOverview(app);
              return (
                <button
                  key={o.id}
                  onClick={() => { setSelectedAppId(o.id); setNexusView("application"); }}
                  className="text-left bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-slate-300 transition-all cursor-pointer flex flex-col h-full"
                >
                  {/* Header: App Name + Chevron */}
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-slate-800 text-sm leading-snug pr-2">{o.applicationName}</h3>
                    <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                  </div>

                  {/* Status Badge */}
                  <div className="mb-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                      o.statusColor === "green" ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-500"
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        o.statusColor === "green" ? "bg-emerald-500" : "bg-slate-400"
                      }`} />
                      {o.statusLabel}
                    </span>
                  </div>

                  {/* Scan Reports Count */}
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-slate-500 text-xs font-medium">Scan Reports</span>
                    <span className="font-semibold text-slate-800">{o.scanReportCount}</span>
                  </div>

                  {/* Last Scan Date */}
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-slate-500 text-xs font-medium">Last Scan</span>
                    <span className="text-xs text-slate-600 font-mono">
                      {o.latestScanDate ? (() => {
                        const d = new Date(o.latestScanDate!);
                        const year = d.getUTCFullYear();
                        const month = String(d.getUTCMonth() + 1).padStart(2, "0");
                        const day = String(d.getUTCDate()).padStart(2, "0");
                        const hours = String(d.getUTCHours()).padStart(2, "0");
                        const minutes = String(d.getUTCMinutes()).padStart(2, "0");
                        return `${year}-${month}-${day} ${hours}:${minutes} UTC`;
                      })() : "N/A"}
                    </span>
                  </div>

                  {/* Last Scan Age */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 text-xs font-medium">Scan Age</span>
                    <span className="text-xs text-slate-600">{o.scanPerformed ? o.latestScanAge : "N/A"}</span>
                  </div>

                  {/* Card Footer */}
                  <div className="mt-auto pt-3 border-t border-slate-100 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400">
                    <span>ID: <span className="font-mono">{o.id.slice(0, 8)}</span></span>
                    {selectedOrgName && <span>Org: {selectedOrgName}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!appsLoading && selectedOrgId && apps.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No applications found for this organization.</p>
        </div>
      )}
    </div>
  );
}
