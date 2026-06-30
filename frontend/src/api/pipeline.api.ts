export interface PipelineRun {
  id: string;
  createdAt: string;
  updatedAt: string;
  source: string;
  sourceRunId?: string;
  project: string;
  pipelineName?: string;
  status: string;
  branch?: string;
  commitSha?: string;
  commitMessage?: string;
  triggerActor?: string;
  url?: string;
  durationSeconds?: number;
  startedAt?: string;
  finishedAt?: string;
  connectorId?: string;
}

export interface PipelinePolicyGate {
  id: string;
  createdAt: string;
  pipelineRunId: string;
  policyRuleId?: string;
  gateName: string;
  status: string;
  result: any;
  evaluatedAt?: string;
  evaluatedBy?: string;
}

export interface PipelineStats {
  total: number;
  byStatus: { status: string; count: number }[];
  bySource: { source: string; count: number }[];
  recent: PipelineRun[];
}

function authHeaders() {
  const t = localStorage.getItem("auth_token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function json(url: string, init?: RequestInit) {
  const r = await fetch(url, { ...init, headers: { ...authHeaders(), "Content-Type": "application/json", ...init?.headers } });
  if (!r.ok) throw new Error(`${r.status}: ${r.statusText}`);
  return r.json();
}

const BASE = "/api/pipelines";

export const pipelineApi = {
  list(params?: { source?: string; project?: string; status?: string; page?: number; limit?: number }) {
    const q = new URLSearchParams();
    if (params?.source) q.set("source", params.source);
    if (params?.project) q.set("project", params.project);
    if (params?.status) q.set("status", params.status);
    if (params?.page) q.set("page", String(params.page));
    if (params?.limit) q.set("limit", String(params.limit));
    return json(`${BASE}?${q}`).then(r => r as { data: PipelineRun[]; total: number; page: number; limit: number });
  },
  get(id: string) { return json(`${BASE}/${id}`).then(r => r.data as PipelineRun); },
  getGates(id: string) { return json(`${BASE}/${id}/gates`).then(r => r.data as PipelinePolicyGate[]); },
  evaluateGates(id: string) { return json(`${BASE}/${id}/evaluate`, { method: "POST" }).then(r => r.data as PipelinePolicyGate[]); },
  getRecentGates(limit = 20) { return json(`${BASE}/gates/recent?limit=${limit}`).then(r => r.data); },
  getStats() { return json(`${BASE}/stats/summary`).then(r => r.data as PipelineStats); },
};
