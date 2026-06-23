import { apiClient } from "./client";

export interface ComplianceClassification {
  id: string;
  created_at: string;
  finding_id: string | null;
  framework: string;
  control_id: string | null;
  requirement: string | null;
  impact_assessment: string | null;
  sla_deadline: string | null;
  status: string;
}

export interface RegulatoryMapping {
  id: string;
  created_at: string;
  framework: string;
  severity: string;
  control_id: string;
  requirement_description: string | null;
  sla_days: number;
}

export interface FrameworkSummary {
  framework: string;
  total_findings: number;
  breached: number;
  remediated: number;
  active: number;
}

export interface SlaBreach {
  id: string;
  finding_id: string;
  severity: string;
  framework: string;
  control_id: string;
  sla_deadline: string;
  status: string;
  days_overdue: number;
}

export const complianceApi = {
  getFrameworks() {
    return apiClient.get<{ data: FrameworkSummary[] }>("/api/compliance/frameworks");
  },
  getRegulatoryMappings() {
    return apiClient.get<{ data: RegulatoryMapping[] }>("/api/compliance/regulatory-mappings");
  },
  getSlaBreaches() {
    return apiClient.get<{ data: SlaBreach[] }>("/api/compliance/sla-breaches");
  },
  getClassifications(params?: { framework?: string; findingId?: string; status?: string }) {
    return apiClient.get<{ data: ComplianceClassification[] }>("/api/compliance/classifications", { params });
  },
  autoClassify(findingId: string) {
    return apiClient.post<{ data: ComplianceClassification[] }>(`/api/compliance/auto-classify/${findingId}`);
  },
  detectBreaches() {
    return apiClient.post<{ data: ComplianceClassification[] }>("/api/compliance/detect-breaches");
  },
  updateClassification(id: string, data: { requirement?: string; impactAssessment?: string; status?: string }) {
    return apiClient.patch<{ data: ComplianceClassification }>(`/api/compliance/classifications/${id}`, data);
  },
};
