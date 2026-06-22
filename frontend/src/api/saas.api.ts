import { apiClient } from "./client";

export interface SaaSApplication {
  id: string;
  name: string;
  lifecycleStage: "ONBOARDING" | "GO_LIVE" | "OFFBOARDING";
  goLiveReadinessScore: number;
  privacyDesignStatus: "COMPLIANT" | "PENDING" | "NON_COMPLIANT";
  steeringCheckPassed: boolean;
  dataCategory: "PII_COMMON" | "PII_SENSITIVE" | "NON_PII";
  gdprRiskImpact: "LOW" | "MEDIUM" | "HIGH";
  owner: string;
}

export interface PrivacyAssessment {
  id: string;
  saasApplicationId: string;
  assessmentDate: string;
  status: string;
  findings: string;
}

export const saasApi = {
  list() {
    return apiClient.get<{ data: SaaSApplication[] }>("/api/saas-applications");
  },
  getById(id: string) {
    return apiClient.get<{ data: SaaSApplication }>(`/api/saas-applications/${id}`);
  },
  create(data: Partial<SaaSApplication>) {
    return apiClient.post<{ data: SaaSApplication }>("/api/saas-applications", data);
  },
  update(id: string, data: Partial<SaaSApplication>) {
    return apiClient.patch<{ data: SaaSApplication }>(`/api/saas-applications/${id}`, data);
  },
  delete(id: string) {
    return apiClient.delete<{ data: { success: boolean } }>(`/api/saas-applications/${id}`);
  },
  submitPrivacyAssessment(id: string, data: Partial<PrivacyAssessment>) {
    return apiClient.post<{ data: PrivacyAssessment }>(`/api/saas-applications/${id}/privacy-assessment`, data);
  },
  getReadinessScore(id: string) {
    return apiClient.post<{ score: number }>(`/api/saas-applications/${id}/readiness`);
  },
};
