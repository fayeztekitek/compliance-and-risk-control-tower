export interface AgentInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  cronSchedule?: string;
}

export interface AgentRunLog {
  id: string;
  createdAt: string;
  agentType: string;
  status: string;
  triggerType: string;
  inputSummary?: string;
  errorMessage?: string;
  durationMs?: number;
}

export interface AgentRecommendation {
  id: string;
  createdAt: string;
  agentType: string;
  runId: string;
  title: string;
  description: string;
  severity: string;
  category?: string;
  isRead: boolean;
  isDismissed: boolean;
  actionUrl?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

const BASE = "/api/ai/agents";
function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, { ...init, headers: { ...authHeaders(), ...init?.headers } });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

export const agentsApi = {
  async list() {
    const json = await fetchJson(BASE);
    return json.data as AgentInfo[];
  },

  async chat(agentType: string, messages: { role: string; content: string }[]) {
    const res = await fetch(`${BASE}/${agentType}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        ...authHeaders(),
      },
      body: JSON.stringify({ messages }),
    });
    if (!res.ok) throw new Error(`Agent chat failed: ${res.status}`);
    return res.body!.getReader();
  },

  async getRuns(agentType?: string, page = 1, limit = 20) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (agentType) params.set("agentType", agentType);
    return fetchJson(`${BASE}/runs?${params}`) as Promise<PaginatedResponse<AgentRunLog>>;
  },

  async getRecommendations(agentType?: string, unreadOnly = false, page = 1, limit = 20) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit), unreadOnly: String(unreadOnly) });
    if (agentType) params.set("agentType", agentType);
    return fetchJson(`${BASE}/recommendations?${params}`) as Promise<PaginatedResponse<AgentRecommendation>>;
  },

  async markRead(id: string) {
    return fetchJson(`${BASE}/recommendations/${id}/read`, { method: "POST" });
  },

  async dismiss(id: string) {
    return fetchJson(`${BASE}/recommendations/${id}/dismiss`, { method: "POST" });
  },

  async runAgent(agentType: string) {
    return fetchJson(`${BASE}/${agentType}/run`, { method: "POST" });
  },
};
