export interface ReportTemplate {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  description?: string;
  config: { sections: ReportSection[]; filters?: Record<string, any> };
  enabled: boolean;
}

export interface ReportSection {
  title: string;
  type: "kpi_summary" | "table" | "chart_data";
  dataSource?: string;
  query?: string;
}

export interface ReportSchedule {
  id: string;
  createdAt: string;
  updatedAt: string;
  templateId?: string;
  name: string;
  description?: string;
  cron: string;
  format: string;
  params: Record<string, any>;
  recipients: string[];
  channels: string[];
  isEnabled: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
}

export interface ReportInstance {
  id: string;
  createdAt: string;
  templateId?: string;
  name: string;
  format: string;
  params: Record<string, any>;
  status: string;
  filePath?: string;
  errorMessage?: string;
  generatedAt?: string;
}

export interface DistributionLog {
  id: string;
  createdAt: string;
  instanceId: string;
  scheduleId?: string;
  channel: string;
  recipient: string;
  status: string;
  deliveredAt?: string;
  errorMessage?: string;
}

function authHeaders() {
  const t = localStorage.getItem("auth_token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function json(url: string, init?: RequestInit) {
  const r = await fetch(url, {
    ...init,
    headers: { ...authHeaders(), "Content-Type": "application/json", ...init?.headers },
  });
  if (!r.ok) {
    const err = await r.text();
    throw new Error(`${r.status}: ${err}`);
  }
  return r.json();
}

const BASE = "/api/engine/reports";

export const reportsApi = {
  // Templates
  listTemplates() { return json(`${BASE}/templates`).then(r => r.data as ReportTemplate[]); },
  getTemplate(id: string) { return json(`${BASE}/templates/${id}`).then(r => r.data as ReportTemplate); },
  createTemplate(p: { name: string; description?: string; config: { sections: ReportSection[]; filters?: any } }) {
    return json(`${BASE}/templates`, { method: "POST", body: JSON.stringify(p) }).then(r => r.data);
  },
  updateTemplate(id: string, p: Partial<{ name: string; description: string; config: any }>) {
    return json(`${BASE}/templates/${id}`, { method: "PUT", body: JSON.stringify(p) }).then(r => r.data);
  },
  deleteTemplate(id: string) { return fetch(`${BASE}/templates/${id}`, { method: "DELETE", headers: authHeaders() }); },

  // Schedules
  listSchedules() { return json(`${BASE}/schedules`).then(r => r.data as ReportSchedule[]); },
  getSchedule(id: string) { return json(`${BASE}/schedules/${id}`).then(r => r.data as ReportSchedule); },
  createSchedule(p: { templateId?: string; name: string; cron: string; format?: string; recipients?: string[] }) {
    return json(`${BASE}/schedules`, { method: "POST", body: JSON.stringify(p) }).then(r => r.data);
  },
  updateSchedule(id: string, p: Partial<ReportSchedule>) {
    return json(`${BASE}/schedules/${id}`, { method: "PUT", body: JSON.stringify(p) }).then(r => r.data);
  },
  deleteSchedule(id: string) { return fetch(`${BASE}/schedules/${id}`, { method: "DELETE", headers: authHeaders() }); },

  // Reports
  listReports(limit = 20, offset = 0) {
    return json(`${BASE}?limit=${limit}&offset=${offset}`).then(r => r.data as ReportInstance[]);
  },
  getReport(id: string) { return json(`${BASE}/${id}`).then(r => r.data as ReportInstance); },
  generateReport(p: { name: string; format: string; templateId?: string; params?: any; channels?: string[]; recipients?: string[] }) {
    return json(`${BASE}/generate`, { method: "POST", body: JSON.stringify(p) }).then(r => r.data);
  },

  // Distribution
  getDistributionLogs(id: string) { return json(`${BASE}/${id}/distribution`).then(r => r.data as DistributionLog[]); },
  distributeReport(id: string, channels: string[], recipients: string[]) {
    return json(`${BASE}/${id}/distribute`, { method: "POST", body: JSON.stringify({ channels, recipients }) }).then(r => r.data);
  },

  getDownloadUrl(id: string) { return `${BASE}/${id}/download`; },
};
