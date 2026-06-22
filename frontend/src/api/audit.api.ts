import { apiClient } from "./client";

export interface Audit {
  id: string;
  title: string;
  auditType: string;
  status: string;
  startDate: string;
  endDate: string;
  leadAuditor: string;
  scope: string;
}

export interface Finding {
  id: string;
  auditId: string;
  title: string;
  description: string;
  severity: string;
  status: string;
}

export interface CapiItem {
  id: string;
  findingId: string;
  action: string;
  owner: string;
  dueDate: string;
  status: string;
}

export const auditApi = {
  list(params?: { search?: string; status?: string; page?: number }) {
    return apiClient.get<{ data: Audit[]; total: number }>("/api/audits", { params });
  },
  getById(id: string) {
    return apiClient.get<{ data: Audit }>(`/api/audits/${id}`);
  },
  create(data: Partial<Audit>) {
    return apiClient.post<{ data: Audit }>("/api/audits", data);
  },
  update(id: string, data: Partial<Audit>) {
    return apiClient.put<{ data: Audit }>(`/api/audits/${id}`, data);
  },
  delete(id: string) {
    return apiClient.delete<{ data: { success: boolean } }>(`/api/audits/${id}`);
  },
  listFindings(auditId: string) {
    return apiClient.get<{ data: Finding[] }>(`/api/audits/${auditId}/findings`);
  },
  createFinding(auditId: string, data: Partial<Finding>) {
    return apiClient.post<{ data: Finding }>(`/api/audits/${auditId}/findings`, data);
  },
  updateFinding(findingId: string, data: Partial<Finding>) {
    return apiClient.put<{ data: Finding }>(`/api/audits/findings/${findingId}`, data);
  },
  listCapi(auditId: string) {
    return apiClient.get<{ data: CapiItem[] }>(`/api/audits/${auditId}/capa`);
  },
  createCapi(auditId: string, data: Partial<CapiItem>) {
    return apiClient.post<{ data: CapiItem }>(`/api/audits/${auditId}/capa`, data);
  },
};
