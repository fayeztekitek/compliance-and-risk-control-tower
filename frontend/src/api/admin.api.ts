export interface Team {
  id: string; createdAt: string; updatedAt: string;
  name: string; description?: string; ownerId?: string; isActive: boolean;
}

export interface TeamMember {
  id: string; createdAt: string;
  teamId: string; userId: string; role: string;
  userName?: string; userEmail?: string; userRole?: string;
}

export interface AuditEntry {
  id: string; createdAt: string;
  userId?: string; userName?: string; userRole?: string;
  action: string; resourceType?: string; resourceId?: string;
  details: any; ipAddress?: string; userAgent?: string; statusCode?: number;
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

const BASE = "/api/admin";

export const adminApi = {
  // Teams
  listTeams() { return json(`${BASE}/teams`).then(r => r.data as Team[]); },
  getTeam(id: string) { return json(`${BASE}/teams/${id}`).then(r => r.data as Team); },
  createTeam(p: { name: string; description?: string }) { return json(`${BASE}/teams`, { method: "POST", body: JSON.stringify(p) }).then(r => r.data); },
  updateTeam(id: string, p: Partial<Team>) { return json(`${BASE}/teams/${id}`, { method: "PUT", body: JSON.stringify(p) }).then(r => r.data); },
  deleteTeam(id: string) { return fetch(`${BASE}/teams/${id}`, { method: "DELETE", headers: authHeaders() }); },
  getTeamMembers(id: string) { return json(`${BASE}/teams/${id}/members`).then(r => r.data); },
  addTeamMember(teamId: string, userId: string, role?: string) { return json(`${BASE}/teams/${teamId}/members`, { method: "POST", body: JSON.stringify({ userId, role }) }).then(r => r.data); },
  removeTeamMember(teamId: string, userId: string) { return fetch(`${BASE}/teams/${teamId}/members/${userId}`, { method: "DELETE", headers: authHeaders() }); },
  // Audit
  listAuditLogs(params?: { userId?: string; action?: string; page?: number; limit?: number }) {
    const q = new URLSearchParams();
    if (params?.userId) q.set("userId", params.userId);
    if (params?.action) q.set("action", params.action);
    if (params?.page) q.set("page", String(params.page));
    if (params?.limit) q.set("limit", String(params.limit));
    return json(`${BASE}/audit-logs?${q}`).then(r => r as { data: AuditEntry[]; total: number; page: number; limit: number });
  },
  getAuditStats() { return json(`${BASE}/audit-logs/stats`).then(r => r.data); },
  // Users
  listUsers() { return json(`${BASE}/users`).then(r => r.data); },
  createUser(p: { name: string; email: string; password: string; role?: string }) { return json(`${BASE}/users`, { method: "POST", body: JSON.stringify(p) }).then(r => r.data); },
  updateUser(id: string, p: { role?: string; status?: string }) { return json(`${BASE}/users/${id}`, { method: "PUT", body: JSON.stringify(p) }).then(r => r.data); },
  deleteUser(id: string) { return fetch(`${BASE}/users/${id}`, { method: "DELETE", headers: authHeaders() }); },
};
