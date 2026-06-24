import { useState, useEffect, useCallback } from "react";
import { Building2, Loader2, CheckCircle2, XCircle, ChevronRight, FileText } from "lucide-react";
import NexusApplicationDetail from "./NexusApplicationDetail";
import { nexusApi } from "../api/nexus.api";

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
  const [appScanCounts, setAppScanCounts] = useState<Record<string, { count: number; latest: string }>>({});

  // Session token from backend (encrypted credentials on server)
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/nexus/config", { headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` } })
      .then(r => r.json())
      .then(d => {
        if (d.data) {
          setNexusUrl(d.data.url || "");
          setNexusUsername(d.data.username || "");
        }
      })
      .catch(() => {});
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    setConnectionResult(null);
    try {
      const { data } = await nexusApi.connectToNexus({
        url: nexusUrl,
        username: nexusUsername,
        token: nexusToken,
      });
      setConnectionResult(data.data.connection);
      if (data.data.connection.success) {
        setRemoteOrgs(data.data.remoteOrgs);
        setConnected(true);
        if (data.data.sessionToken) {
          setSessionToken(data.data.sessionToken);
          sessionStorage.setItem("nexus_session_token", data.data.sessionToken);
        }
      }
    } catch {
      setConnectionResult({ success: false, message: "Connection failed: unable to reach server", duration: 0 });
    } finally {
      setConnecting(false);
    }
  };

  // Fetch applications when org selection changes
  const fetchAppsForOrg = useCallback(async (orgId: string) => {
    if (!sessionToken && !orgId) { setApps([]); return; }
    setAppsLoading(true);
    try {
      const { data } = await nexusApi.fetchNexusApplications({
        sessionToken: sessionToken || undefined,
        organizationId: orgId,
      });
      const appList = data.data.applications || [];
      setApps(appList);

      // Fetch scan count for each app in parallel
      if (sessionToken) {
        const counts: Record<string, { count: number; latest: string }> = {};
        await Promise.all(appList.map(async (app: any) => {
          try {
            const hist = await nexusApi.fetchNexusReportHistory({ sessionToken, applicationId: app.id });
            const reports = hist.data.data.reports || [];
            counts[app.id] = {
              count: reports.length,
              latest: reports.length > 0
                ? new Date(reports[0].reportTime).toLocaleDateString()
                : "—",
            };
          } catch {
            counts[app.id] = { count: 0, latest: "—" };
          }
        }));
        setAppScanCounts(counts);
      }
    } catch {
      setApps([]);
    } finally {
      setAppsLoading(false);
    }
  }, [sessionToken]);

  useEffect(() => {
    if (selectedOrgId) {
      fetchAppsForOrg(selectedOrgId);
    } else {
      setApps([]);
    }
  }, [selectedOrgId, fetchAppsForOrg]);

  // Auto-select first org when connected
  useEffect(() => {
    if (connected && remoteOrgs.length > 0 && !selectedOrgId) {
      setSelectedOrgId(remoteOrgs[0].organizationId);
    }
  }, [connected, remoteOrgs, selectedOrgId]);

  if (nexusView === "application" && selectedAppId) {
    const app = apps.find((p: any) => p.id === selectedAppId);
    return (
      <NexusApplicationDetail
        applicationId={selectedAppId}
        applicationName={app?.name}
        onBack={() => { setNexusView("overview"); setSelectedAppId(null); }}
        onBackToOverview={() => { setNexusView("overview"); setSelectedAppId(null); }}
      />
    );
  }

  const allOrgs = connected && remoteOrgs.length > 0
    ? remoteOrgs
    : [];

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

      {/* Applications Grid */}
      {appsLoading && (
        <div className="flex items-center justify-center py-12 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          <span className="text-sm">Loading applications...</span>
        </div>
      )}

      {!appsLoading && apps.length > 0 && (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {apps.map((app: any) => {
              const sc = appScanCounts[app.id];
              return (
                <button
                  key={app.id}
                  onClick={() => { setSelectedAppId(app.id); setNexusView("application"); }}
                  className="text-left bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-slate-300 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-800 text-sm">{app.name}</h3>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                      app.status === "GREEN" ? "bg-emerald-50 text-emerald-700" :
                      app.status === "ORANGE" ? "bg-amber-50 text-amber-700" :
                      "bg-red-50 text-red-700"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        app.status === "GREEN" ? "bg-emerald-500" :
                        app.status === "ORANGE" ? "bg-amber-500" :
                        "bg-red-500"
                      }`} />
                      {app.status || "UNKNOWN"}
                    </span>
                    {app.businessCriticality && (
                      <span className="text-xs text-slate-400">{app.businessCriticality}</span>
                    )}
                  </div>
                  <div className="flex items-center text-xs text-slate-400">
                    <FileText className="w-3 h-3 mr-1" />
                    <span>{sc ? `${sc.count} scan${sc.count !== 1 ? 's' : ''}` : "—"}</span>
                    {sc?.latest && sc.count > 0 && (
                      <span className="ml-2">· Latest: {sc.latest}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!appsLoading && selectedOrgId && apps.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No applications found for this organization.</p>
        </div>
      )}
    </div>
  );
}
