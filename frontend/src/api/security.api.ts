import { apiClient } from "../api/client";

export interface Vulnerability {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  status: "OPEN" | "FALSE_POSITIVE" | "WAIVED" | "REMEDIATED";
  sourceScanner: "VERACODE" | "NEXPOSE" | "PEN_TEST";
  detectedDate: string;
  remediatedDate: string | null;
  slaDueDate: string;
  isFalsePositive: boolean;
  explanationFalsePositive: string | null;
  targetProduct: string | null;
  owner: string | null;
  waiverId: string | null;
  riskAcceptanceId: string | null;
}

export interface Waiver {
  id: string;
  vulnerability_id: string;
  title: string;
  rationale: string;
  status: string;
  request_date: string;
  expiry_date: string;
  approved_by: string | null;
}

export interface RiskAcceptance {
  id: string;
  vulnerability_id: string;
  title: string;
  business_impact: string;
  mitigation_plan: string;
  status: string;
  request_date: string;
  expiry_date: string;
  approved_by: string | null;
}

export interface SlaIncident {
  id: string;
  title: string;
  contract_id: string | null;
  project_name: string | null;
  breach_time: string;
  resolution_time: string | null;
  max_allowed_resolution_hours: number;
  actual_duration_hours: number | null;
  status: string;
  penalty_cost: number | null;
}

export interface VulnListParams {
  page?: number;
  limit?: number;
  severity?: string;
  status?: string;
  scanner?: string;
  product?: string;
  search?: string;
}

export const securityApi = {
  // Vulnerabilities
  listVulnerabilities(params?: VulnListParams) {
    return apiClient.get<{ data: Vulnerability[]; total: number; page: number; limit: number }>("/api/security/vulnerabilities", { params });
  },
  getVulnerability(id: string) {
    return apiClient.get<{ data: Vulnerability }>(`/api/security/vulnerabilities/${id}`);
  },
  createVulnerability(data: Partial<Vulnerability>) {
    return apiClient.post<{ data: Vulnerability }>("/api/security/vulnerabilities", data);
  },
  updateVulnerability(id: string, data: Partial<Vulnerability>) {
    return apiClient.patch<{ data: Vulnerability }>(`/api/security/vulnerabilities/${id}`, data);
  },
  setFalsePositive(id: string, explanation: string) {
    return apiClient.post<{ data: Vulnerability }>(`/api/security/vulnerabilities/${id}/false-positive`, { explanation });
  },

  // Waivers
  listWaivers() {
    return apiClient.get<{ data: Waiver[] }>("/api/security/waivers");
  },
  createWaiver(data: Partial<Waiver>) {
    return apiClient.post<{ data: Waiver }>("/api/security/waivers", data);
  },
  approveWaiver(id: string) {
    return apiClient.patch<{ data: Waiver }>(`/api/security/waivers/${id}/approve`);
  },
  rejectWaiver(id: string) {
    return apiClient.patch<{ data: Waiver }>(`/api/security/waivers/${id}/reject`);
  },

  // Risk Acceptances
  listRiskAcceptances() {
    return apiClient.get<{ data: RiskAcceptance[] }>("/api/security/risk-acceptances");
  },
  createRiskAcceptance(data: Partial<RiskAcceptance>) {
    return apiClient.post<{ data: RiskAcceptance }>("/api/security/risk-acceptances", data);
  },
  approveRiskAcceptance(id: string) {
    return apiClient.patch<{ data: RiskAcceptance }>(`/api/security/risk-acceptances/${id}/approve`);
  },

  // SLA
  listSlaIncidents() {
    return apiClient.get<{ data: SlaIncident[] }>("/api/security/sla-incidents");
  },
  detectSlaBreaches() {
    return apiClient.post<{ data: { detected: number } }>("/api/security/detect-sla-breaches");
  },
  checkWaiverExpiry() {
    return apiClient.post<{ data: { checked: number } }>("/api/security/check-waiver-expiry");
  },

  // Scan Import
  importScan(vulnerabilities: Partial<Vulnerability>[]) {
    return apiClient.post<{ data: { imported: number; ids: string[] } }>("/api/security/import/scan", { vulnerabilities });
  },
};
