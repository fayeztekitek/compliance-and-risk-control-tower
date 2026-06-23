import { apiClient } from "./client";

export interface PolicyRule {
  id: string;
  created_at: string;
  policy_id: string;
  name: string;
  threat_level: string;
  category: string | null;
  description: string | null;
}

export const policyRuleApi = {
  list(params?: { threatLevel?: string; category?: string }) {
    return apiClient.get<{ data: PolicyRule[] }>("/api/policy-rules", { params });
  },
  getById(id: string) {
    return apiClient.get<{ data: PolicyRule }>(`/api/policy-rules/${id}`);
  },
  create(data: { policyId: string; name: string; threatLevel: string; category?: string; description?: string }) {
    return apiClient.post<{ data: PolicyRule }>("/api/policy-rules", data);
  },
  update(id: string, data: { name?: string; threatLevel?: string; category?: string; description?: string }) {
    return apiClient.patch<{ data: PolicyRule }>(`/api/policy-rules/${id}`, data);
  },
  delete(id: string) {
    return apiClient.delete<{ data: { success: boolean } }>(`/api/policy-rules/${id}`);
  },
};
