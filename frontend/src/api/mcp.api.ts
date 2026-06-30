export interface McpConnector {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  connectorType: string;
  description?: string;
  config: Record<string, any>;
  status: string;
  lastSyncAt?: string;
  lastSyncStatus?: string;
  lastError?: string;
  isEnabled: boolean;
}

export interface ConnectorTestResult {
  success: boolean;
  message: string;
}

export interface ConnectorSyncResult {
  success: boolean;
  itemsSynced: number;
  message: string;
}

const BASE = "/api/mcp";
function authHeaders() {
  const t = localStorage.getItem("auth_token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}
async function json(url: string, init?: RequestInit) {
  const r = await fetch(url, { ...init, headers: { ...authHeaders(), "Content-Type": "application/json", ...init?.headers } });
  if (!r.ok) throw new Error(`${r.status}: ${r.statusText}`);
  return r.json();
}

export const mcpApi = {
  list(type?: string) { return json(`${BASE}${type ? `?type=${type}` : ""}`).then(r => r.data as McpConnector[]); },
  get(id: string) { return json(`${BASE}/${id}`).then(r => r.data as McpConnector); },
  create(p: { name: string; connectorType: string; description?: string; config: any }) { return json(BASE, { method: "POST", body: JSON.stringify(p) }).then(r => r.data); },
  update(id: string, p: any) { return json(`${BASE}/${id}`, { method: "PUT", body: JSON.stringify(p) }).then(r => r.data); },
  delete(id: string) { return fetch(`${BASE}/${id}`, { method: "DELETE", headers: authHeaders() }); },
  test(id: string) { return json(`${BASE}/${id}/test`, { method: "POST" }).then(r => r.data as ConnectorTestResult); },
  testAll() { return json(`${BASE}/test-all`, { method: "POST" }).then(r => r.data as ConnectorTestResult[]); },
  sync(id: string) { return json(`${BASE}/${id}/sync`, { method: "POST" }).then(r => r.data as ConnectorSyncResult); },
  getWebhooks(id: string, limit = 20) { return json(`${BASE}/${id}/webhooks?limit=${limit}`).then(r => r.data); },
};
