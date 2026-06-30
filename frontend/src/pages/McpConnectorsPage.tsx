import { useState, useEffect } from "react";
import { Plug, Plus, Trash2, Play, Wifi, WifiOff, Loader2, RefreshCw, History, Zap, ExternalLink } from "lucide-react";
import { mcpApi, McpConnector, ConnectorTestResult } from "../api/mcp.api";

const CONNECTOR_ICONS: Record<string, string> = {
  sonarqube: "🔍", nexus: "🔗", veracode: "🔐", fortify: "🛡️",
  jira: "📋", github: "🐙", gitlab: "🦊", confluence: "📄", slack: "💬",
};

const CONNECTOR_LABELS: Record<string, string> = {
  sonarqube: "SonarQube", nexus: "Nexus IQ", veracode: "Veracode", fortify: "Fortify",
  jira: "Jira", github: "GitHub", gitlab: "GitLab", confluence: "Confluence", slack: "Slack",
};

export default function McpConnectorsPage() {
  const [connectors, setConnectors] = useState<McpConnector[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", connectorType: "sonarqube", description: "", url: "", token: "" });
  const [testResults, setTestResults] = useState<Record<string, ConnectorTestResult>>({});

  function load() {
    setLoading(true);
    mcpApi.list().then(setConnectors).catch(() => {}).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleTest(id: string) {
    setTesting(id);
    try {
      const result = await mcpApi.test(id);
      setTestResults(prev => ({ ...prev, [id]: result }));
    } catch { }
    setTesting(null);
  }

  async function handleSync(id: string) {
    setSyncing(id);
    try { await mcpApi.sync(id); load(); } catch { }
    setSyncing(null);
  }

  async function handleCreate() {
    const config: any = { url: form.url };
    if (form.token) config.token = form.token;
    await mcpApi.create({ name: form.name, connectorType: form.connectorType, description: form.description, config });
    setShowCreate(false);
    setForm({ name: "", connectorType: "sonarqube", description: "", url: "", token: "" });
    load();
  }

  async function handleDelete(id: string) {
    await mcpApi.delete(id);
    load();
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Plug className="w-6 h-6 text-indigo-500" /> MCP Connectors
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage integrations with external tools and services</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { mcpApi.testAll().then(r => { const m: Record<string, ConnectorTestResult> = {}; connectors.forEach((c, i) => { m[c.id] = r[i]; }); setTestResults(m); }); }} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50">
            <Zap className="w-3.5 h-3.5" /> Test All
          </button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">
            <Plus className="w-3.5 h-3.5" /> Add Connector
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
      ) : connectors.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
          <Plug className="w-12 h-12 mb-3 opacity-50" />
          <p className="text-sm font-medium">No connectors configured</p>
          <p className="text-xs mt-1">Add a connector to integrate with external tools</p>
          <button onClick={() => setShowCreate(true)} className="mt-4 px-4 py-2 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">Add Connector</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {connectors.map(c => {
            const icon = CONNECTOR_ICONS[c.connectorType] || "🔌";
            const label = CONNECTOR_LABELS[c.connectorType] || c.connectorType;
            const test = testResults[c.id];
            return (
              <div key={c.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-xl">{icon}</div>
                    <div>
                      <h3 className="font-semibold text-sm text-slate-900 dark:text-white">{c.name}</h3>
                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">{label}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {c.status === "connected" ? <Wifi className="w-3.5 h-3.5 text-green-500" /> : <WifiOff className="w-3.5 h-3.5 text-slate-400" />}
                    <span className={`text-[10px] font-medium ${c.status === "connected" ? "text-green-500" : "text-slate-400"}`}>{c.status}</span>
                  </div>
                </div>

                {c.description && <p className="text-xs text-slate-500 mb-3">{c.description}</p>}

                {c.lastSyncAt && (
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-3">
                    <History className="w-3 h-3" />
                    Last sync: {new Date(c.lastSyncAt).toLocaleString()}
                    {c.lastSyncStatus && <span className={c.lastSyncStatus === "success" ? "text-green-500" : "text-red-500"}>({c.lastSyncStatus})</span>}
                  </div>
                )}

                {test && (
                  <div className={`mb-3 px-3 py-2 rounded-lg text-xs ${test.success ? "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300" : "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300"}`}>
                    {test.message}
                  </div>
                )}

                {c.lastError && !test && (
                  <p className="text-[10px] text-red-400 mb-2 truncate" title={c.lastError}>{c.lastError}</p>
                )}

                <div className="flex items-center gap-2 mt-auto">
                  <button onClick={() => handleTest(c.id)} disabled={testing === c.id}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-medium rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-indigo-300 disabled:opacity-50">
                    {testing === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />} Test
                  </button>
                  <button onClick={() => handleSync(c.id)} disabled={syncing === c.id}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-medium rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-indigo-300 disabled:opacity-50">
                    {syncing === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Sync
                  </button>
                  <button onClick={() => handleDelete(c.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-medium rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-red-400 hover:border-red-300">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Add Connector</h2>
            <div className="space-y-3">
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Connector name"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm" />
              <select value={form.connectorType} onChange={e => setForm(f => ({ ...f, connectorType: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm">
                {Object.entries(CONNECTOR_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description (optional)"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm" />
              <input type="text" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="URL / API endpoint"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm" />
              <input type="password" value={form.token} onChange={e => setForm(f => ({ ...f, token: e.target.value }))} placeholder="API Token / Key"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm" />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">Cancel</button>
              <button onClick={handleCreate} disabled={!form.name || !form.url} className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white disabled:opacity-50 hover:bg-indigo-700">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
