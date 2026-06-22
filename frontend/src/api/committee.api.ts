import { apiClient } from "./client";

export interface Committee {
  id: string;
  name: string;
  type: string;
  status: string;
  chairperson: string;
  meetingFrequency: string;
}

export interface Decision {
  id: string;
  committeeId: string;
  title: string;
  description: string;
  status: string;
  decisionDate: string;
}

export interface Obligation {
  id: string;
  title: string;
  sourceContract: string;
  requirement: string;
  frequency: string;
  status: string;
}

export const committeeApi = {
  list(params?: { search?: string }) {
    return apiClient.get<{ data: Committee[] }>("/api/committees", { params });
  },
  getById(id: string) {
    return apiClient.get<{ data: Committee }>(`/api/committees/${id}`);
  },
  create(data: Partial<Committee>) {
    return apiClient.post<{ data: Committee }>("/api/committees", data);
  },
  update(id: string, data: Partial<Committee>) {
    return apiClient.put<{ data: Committee }>(`/api/committees/${id}`, data);
  },
  delete(id: string) {
    return apiClient.delete<{ data: { success: boolean } }>(`/api/committees/${id}`);
  },
  listDecisions(committeeId: string) {
    return apiClient.get<{ data: Decision[] }>(`/api/committees/${committeeId}/decisions`);
  },
  recordDecision(committeeId: string, data: Partial<Decision>) {
    return apiClient.post<{ data: Decision }>(`/api/committees/${committeeId}/decisions`, data);
  },
  listObligations(committeeId: string) {
    return apiClient.get<{ data: Obligation[] }>(`/api/committees/${committeeId}/obligations`);
  },
  createObligation(committeeId: string, data: Partial<Obligation>) {
    return apiClient.post<{ data: Obligation }>(`/api/committees/${committeeId}/obligations`, data);
  },
  updateObligation(obligationId: string, data: Partial<Obligation>) {
    return apiClient.put<{ data: Obligation }>(`/api/committees/obligations/${obligationId}`, data);
  },
};
