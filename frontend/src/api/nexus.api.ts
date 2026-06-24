import { apiClient } from "./client";

export interface NexusProduct {
  id: string;
  productId: string;
  name: string;
  status: string;
  businessCriticality: string;
  securityOwner?: string;
  productOwner?: string;
  businessOwner?: string;
  technicalOwner?: string;
  organizationId?: string;
}

export interface NexusApplication {
  id: string;
  applicationId: string;
  name: string;
  productId?: string;
  contact?: string;
  businessOwner?: string;
  technicalOwner?: string;
}

export interface ScanReport {
  id: string;
  applicationId: string;
  scannerSource: string;
  reportDate: string;
  reportVersion?: string;
  scanType?: string;
  totalFindings: number;
  totalOccurrences: number;
}

export interface UnifiedFinding {
  id: string;
  sourceTool: string;
  sourceId?: string;
  title: string;
  description?: string;
  unifiedSeverity: string;
  nativeSeverity?: string;
  cvssScore?: number;
  cvssVector?: string;
  cveId?: string;
  cweId?: string;
  status: string;
  fixAvailable?: boolean;
  recommendedVersion?: string;
  componentName?: string;
  componentVersion?: string;
  packageUrl?: string;
  riskScore?: number;
  epssScore?: number;
  cisaKev?: boolean;
  detectedDate: string;
  remediatedDate?: string;
  slaDueDate?: string;
  ageInDays?: number;
  scanId?: string;
  applicationId?: string;
  occurrenceCount?: number;
}

export interface FindingOccurrence {
  id: string;
  findingId: string;
  componentId?: string;
  path?: string;
  module?: string;
  scope?: string;
  occurrenceStatus: string;
  firstDetectedDate?: string;
  lastDetectedDate?: string;
}

export interface FindingComponent {
  id: string;
  groupId?: string;
  artifactId?: string;
  version: string;
  packageUrl?: string;
  hash?: string;
  licenseType?: string;
  componentName?: string;
}

export interface Mitigation {
  id: string;
  findingId: string;
  mitigationType: string;
  targetComponentVersion?: string;
  targetRelease?: string;
  owner?: string;
  dueDate?: string;
  status: string;
  evidence?: string;
  verifiedBy?: string;
  verifiedDate?: string;
  notes?: string;
}

export interface FindingDetailResponse {
  finding: UnifiedFinding;
  components: FindingComponent[];
  occurrences: FindingOccurrence[];
  mitigations: Mitigation[];
  waivers: any[];
}

export interface OccurrenceDetailResponse {
  occurrence: FindingOccurrence;
  component: FindingComponent | null;
  finding: UnifiedFinding | null;
  mitigations: Mitigation[];
  waivers: any[];
}

export interface ReportComparison {
  latestReportId: string;
  previousReportId: string;
  latestReportDate: string;
  previousReportDate: string;
  newCount: number;
  fixedCount: number;
  recurringCount: number;
  newVulnerabilities: UnifiedFinding[];
  fixedVulnerabilities: UnifiedFinding[];
  recurringVulnerabilities: UnifiedFinding[];
  riskEvolution: {
    latestTotalRisk: number;
    previousTotalRisk: number;
    delta: number;
  };
  severityShift: Record<string, number>;
}

export interface TrendPoint {
  reportDate: string;
  reportId: string;
  totalFindings: number;
  totalOccurrences: number;
  totalPolicyViolations: number;
  riskScore: number;
  severityBreakdown: Record<string, number>;
}

export interface NexusStoredReport {
  id: string;
  scanId: string;
  applicationId: string;
  applicationUuid?: string;
  stage: string;
  scanDate: string;
  reportTitle?: string;
  commitHash?: string;
  initiator?: string;
  reportUrl?: string;
  embeddableReportHtmlUrl?: string;
  reportPdfUrl?: string;
  reportDataUrl?: string;
  policyEvaluationStatus?: string;
  totalComponents: number;
  affectedComponents: number;
  totalViolations: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  componentHashes?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface NexusPolicyViolation {
  id: string;
  violationId: string;
  reportId: string;
  policyId?: string;
  policyName: string;
  constraintId?: string;
  constraintName?: string;
  threatLevel: number;
  threatCategory?: string;
  applicationId: string;
  componentHash?: string;
  componentFormat?: string;
  componentName?: string;
  componentCoordinates?: any;
  displayName?: string;
  proprietary?: boolean;
  matchState?: string;
  securityIssueRefId?: string;
  securityIssueSeverity?: number;
  cveId?: string;
  status: string;
  stage?: string;
  openTime?: string;
  waiveTime?: string;
  fixTime?: string;
  isWaived: boolean;
  isLegacy: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NexusEvolutionPoint {
  id: string;
  applicationId: string;
  reportId: string;
  scanDate: string;
  stage?: string;
  totalViolations: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  totalComponents: number;
  affectedComponents: number;
  componentChurn?: {
    newComponents: number;
    removedComponents: number;
    newComponentNames?: string[];
    removedComponentNames?: string[];
  } | null;
  newViolations: number;
  fixedViolations: number;
}

export interface NexusComponentImpact {
  applicationId: string;
  componentHash: string;
  firstSeen: string;
  lastSeen: string;
  reportsAffected: number;
  violationCount: number;
  maxThreatLevel: number;
  versionsSeen: string[];
}

export interface ReportComparisonResult {
  reportA: NexusStoredReport;
  reportB: NexusStoredReport;
  addedViolations: NexusPolicyViolation[];
  removedViolations: NexusPolicyViolation[];
  sameViolations: NexusPolicyViolation[];
  statusChangedViolations: { from: NexusPolicyViolation; to: NexusPolicyViolation }[];
  summary: {
    added: { critical: number; high: number; medium: number; low: number };
    removed: { critical: number; high: number; medium: number; low: number };
    same: { critical: number; high: number; medium: number; low: number };
    statusChanged: number;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export const nexusApi = {
  // Products (applications)
  listProducts() {
    return apiClient.get<{ data: NexusProduct[] }>("/api/nexus/products");
  },
  getProduct(productId: string) {
    return apiClient.get<{ data: NexusProduct }>(`/api/nexus/products/${productId}`);
  },

  // Applications
  listApplications() {
    return apiClient.get<{ data: NexusApplication[] }>("/api/nexus/applications");
  },

  // Findings
  listFindings(params?: {
    page?: number; limit?: number; sourceTool?: string;
    severity?: string; status?: string; productId?: string;
    applicationId?: string; cveId?: string; search?: string;
  }) {
    return apiClient.get<PaginatedResponse<UnifiedFinding>>("/api/unified-findings", { params });
  },
  getFinding(id: string) {
    return apiClient.get<UnifiedFinding>(`/api/unified-findings/${id}`);
  },
  getFindingsSummary() {
    return apiClient.get<{
      total: number; bySource: Record<string, number>;
      bySeverity: Record<string, number>; byStatus: Record<string, number>;
    }>("/api/unified-findings/summary");
  },

  // Scan Reports
  listReports(applicationId: string, params?: { page?: number; limit?: number }) {
    return apiClient.get<PaginatedResponse<ScanReport>>(`/api/reports/${applicationId}`, { params });
  },

  // Report Comparison
  compareReports(applicationId: string, latestId?: string, previousId?: string) {
    const params: Record<string, string> = {};
    if (latestId) params.latest = latestId;
    if (previousId) params.previous = previousId;
    return apiClient.get<ReportComparison>(`/api/reports/${applicationId}/compare`, { params });
  },

  // Occurrences
  listOccurrences(params?: {
    page?: number; limit?: number; findingId?: string; componentId?: string;
  }) {
    return apiClient.get<PaginatedResponse<FindingOccurrence>>("/api/finding-occurrences", { params });
  },
  getDistinctCount(applicationId?: string) {
    return apiClient.get<{ distinctFindings: number }>("/api/finding-occurrences/distinct-count", {
      params: applicationId ? { applicationId } : {},
    });
  },
  getTotalOccurrences(applicationId?: string) {
    return apiClient.get<{ totalOccurrences: number }>("/api/finding-occurrences/total-occurrences", {
      params: applicationId ? { applicationId } : {},
    });
  },

  // Components
  listComponents(params?: { page?: number; limit?: number; search?: string }) {
    return apiClient.get<PaginatedResponse<{ id: string; componentName: string; version: string; packageUrl?: string }>>(
      "/api/finding-components", { params }
    );
  },

  // Unified-findings cross-tool summary
  getCrossToolSummary() {
    return apiClient.get("/api/unified-findings/summary");
  },

  // Mitigations
  proposeMitigation(data: {
    findingId: string; mitigationType: string;
    targetComponentVersion?: string; targetRelease?: string;
    owner?: string; dueDate?: string; notes?: string;
  }) {
    return apiClient.post<{ data: any }>("/api/mitigations", data);
  },
  approveMitigation(id: string) {
    return apiClient.patch<{ data: any }>(`/api/mitigations/${id}/approve`);
  },
  verifyMitigation(id: string, evidence: string) {
    return apiClient.patch<{ data: any }>(`/api/mitigations/${id}/verify`, { evidence });
  },
  closeMitigation(id: string) {
    return apiClient.patch<{ data: any }>(`/api/mitigations/${id}/close`);
  },
  rejectMitigation(id: string, reason?: string) {
    return apiClient.patch<{ data: any }>(`/api/mitigations/${id}/reject`, { reason });
  },
  getMitigation(id: string) {
    return apiClient.get<{ data: any }>(`/api/mitigations/${id}`);
  },
  getOverdueMitigations() {
    return apiClient.get<{ data: any[] }>("/api/mitigations/overdue");
  },

  // Trends
  getAppTrend(applicationId: string, months?: number) {
    return apiClient.get<{
      applicationId: string; dataPoints: TrendPoint[];
      velocity: { newPerWeek: number; fixedPerWeek: number; netVelocity: number };
      riskProjection: { currentRisk: number; projectedRisk: number; projectedDate: string; direction: string };
    }>(`/api/trends/applications/${applicationId}`, { params: months ? { months } : {} });
  },
  getOrgTrend(organizationId: string, months?: number) {
    return apiClient.get(`/api/trends/organizations/${organizationId}`, { params: months ? { months } : {} });
  },
  getVelocity(params?: { applicationId?: string; months?: number }) {
    return apiClient.get<{
      weekStart: string; newCount: number; fixedCount: number; recurringCount: number;
    }[]>("/api/trends/velocity", { params });
  },

  // Finding Detail (aggregated)
  getFindingDetail(id: string) {
    return apiClient.get<{ data: FindingDetailResponse }>(`/api/nexus/findings/${id}/detail`);
  },
  getOccurrenceDetail(id: string) {
    return apiClient.get<{ data: OccurrenceDetailResponse }>(`/api/nexus/occurrences/${id}/detail`);
  },

  // Remote connection
  connectToNexus(credentials?: { url?: string; username?: string; token?: string }) {
    return apiClient.post<{ data: { connection: { success: boolean; message: string; duration: number }; remoteOrgs: { organizationId: string; organizationName: string }[]; sessionToken: string | null } }>("/api/nexus/config/connect", credentials || {}, { timeout: 30000 });
  },

  // Fetch applications from Nexus IQ using sessionToken, filtered by organization
  fetchNexusApplications(params?: { sessionToken?: string; organizationId?: string }) {
    return apiClient.post<{ data: { applications: { id: string; name: string; organizationId: string; status: string; businessCriticality: string; productId: string }[] } }>("/api/nexus/applications/fetch", params || {});
  },

  // ---- Reports from Nexus IQ ----

  fetchNexusReportHistory(params?: { sessionToken?: string; applicationId?: string }) {
    return apiClient.post<{ data: { reports: { reportId: string; reportTime: number; reportTitle: string; stage: string; commitHash: string | null; initiator: string; applicationId: string; applicationName: string }[] } }>("/api/nexus/reports/history", params || {});
  },

  fetchNexusReportViolations(params?: { sessionToken?: string; applicationPublicId?: string; scanId?: string }) {
    return apiClient.post<{ data: { violations: any[]; severityCounts: { critical: number; high: number; medium: number; low: number; total: number } } }>("/api/nexus/reports/violations", params || {});
  },

  fetchNexusLatestReport(params?: { sessionToken?: string; applicationId?: string; applicationPublicId?: string }) {
    return apiClient.post<{ data: { report: any | null; severityCounts: { critical: number; high: number; medium: number; low: number; total: number } | null } }>("/api/nexus/reports/latest", params || {});
  },

  // ---- Stored Reports (Drill-Down) ----

  syncNexusReports(sessionToken: string, applicationId: string, applicationPublicId?: string) {
    return apiClient.post<{ data: { applicationId: string; reportsSynced: number; violationsSynced: number; componentsSynced: number } }>("/api/nexus/reports/sync", { sessionToken, applicationId, applicationPublicId });
  },

  getStoredReports(applicationId: string, params?: { page?: number; limit?: number }) {
    return apiClient.get<{ data: NexusStoredReport[]; total: number; page: number; limit: number }>("/api/nexus/reports", { params: { applicationId, ...params } });
  },

  getStoredReport(id: string) {
    return apiClient.get<{ data: NexusStoredReport }>(`/api/nexus/reports/${id}`);
  },

  getStoredReportViolations(id: string, params?: {
    severity?: string; status?: string; search?: string; page?: number; limit?: number;
  }) {
    return apiClient.get<{
      data: NexusPolicyViolation[]; total: number; page: number; limit: number;
      summary: { total: number; critical: number; high: number; medium: number; low: number; open_count: number; waived_count: number; fixed_count: number };
      report: NexusStoredReport;
    }>(`/api/nexus/reports/${id}/violations`, { params });
  },

  compareStoredReports(reportIdA: string, reportIdB: string) {
    return apiClient.post<{ data: ReportComparisonResult }>("/api/nexus/reports/compare", { reportIdA, reportIdB });
  },

  getEvolution(applicationId: string, params?: { fromDate?: string; toDate?: string }) {
    return apiClient.get<{ data: NexusEvolutionPoint[] }>(`/api/nexus/reports/${applicationId}/evolution`, { params });
  },

  getComponentImpact(applicationId: string) {
    return apiClient.get<{ data: NexusComponentImpact[] }>(`/api/nexus/reports/${applicationId}/components`);
  },
};
