import { apiClient } from "./client";

export interface KpiData {
  totalVulnerabilities: number;
  criticalVulnerabilities: number;
  highVulnerabilities: number;
  openVulnerabilities: number;
  slaOverdueVulnerabilities: number;
  falsePositives: number;
  fixedVulnerabilities: number;
  waivedVulnerabilities: number;
  acceptedRisks: number;
  totalProjects: number;
  deviatingProjects: number;
  budgetOverrunProjects: number;
  activeWaivers: number;
  productsRed: number;
  productsOrange: number;
  productsGreen: number;
  globalRiskScore: number;
  complianceScore: number;
  securityDebtScore: number;
}

export interface KriData {
  id: string;
  name: string;
  value: number;
  threshold: number;
  unit: string;
  status: "OK" | "WARNING" | "BREACHED";
}

export interface HeatmapData {
  severityLevels: string[];
  ageRanges: string[];
  cells: { x: number; y: number; count: number; productId?: string }[];
}

export interface TrendsData {
  securityTrends: { date: string; riskScore: number; total: number; critical: number; high: number }[];
  projectTrends: { date: string; total: number; deviating: number }[];
}

export interface ExecutiveDashboard {
  snapshot: Record<string, unknown> | null;
  kpis: KpiData;
  kris: KriData[];
  heatmap: HeatmapData;
  trends: TrendsData;
  recentAlerts: unknown[];
  lastUpdated: string;
}

export interface MttrData {
  overall: number;
  bySeverity: Record<string, number>;
}

export interface SlaBreachData {
  total: number;
  breached: number;
  breachRate: number;
}

export interface DistinctVsOccurrencesData {
  distinctFindings: number;
  totalOccurrences: number;
}

export interface CompliancePostureData {
  complianceScore: number;
  slaBreachRate: number;
  mttrDays: number;
  totalVulnerabilities: number;
  openVulnerabilities: number;
  fixedRate: number;
  grade: "GREEN" | "AMBER" | "RED";
}

export interface NexusLifecycleTopVuln {
  vulnerabilityId: string;
  type: "CVE" | "Sonatype";
  severity: string;
  occurrences: number;
  applicationsImpacted: number;
  organizationsImpacted: number;
  firstSeen: string;
  lastSeen: string;
}

export interface NexusLifecycleSummary {
  totalOrganizations: number;
  totalApplications: number;
  totalLatestReports: number;
  distinctVulnerabilities: number;
  totalOccurrences: number;
  criticalDistinct: number;
  highDistinct: number;
  mediumDistinct: number;
  lowDistinct: number;
  topVulnerabilities: NexusLifecycleTopVuln[];
}

export interface NexusLifecycleOccurrence {
  organizationName: string;
  organizationId: string;
  applicationName: string;
  applicationId: string;
  componentName: string;
  reportDate: string;
}

export interface LiveNexusTopVuln {
  vulnerabilityId: string;
  type: "CVE" | "SONATYPE";
  severity: string;
  occurrenceCount: number;
  impactedApplications: number;
  impactedOrganizations: number;
  occurrences: Array<{
    organizationId: string;
    organizationName: string;
    applicationId: string;
    applicationName: string;
    reportId: string;
    reportDate: string;
    componentName: string;
    packageUrl: string;
    path: string;
    status: string;
  }>;
  waived: boolean;
  lastSeen: string;
}

export interface LiveNexusKpis {
  totalOrganizations: number;
  totalApplications: number;
  totalScanReports: number;
  applicationsWithScan: number;
  applicationsWithoutScan: number;
  distinctOpenVulnerabilities: number;
  totalOpenOccurrences: number;
  waivedVulnerabilities: number;
  criticalDistinctOpen: number;
  highDistinctOpen: number;
  topVulnerabilities: LiveNexusTopVuln[];
  errors: string[];
}

export const dashboardApi = {
  executive() {
    return apiClient.get<{ data: ExecutiveDashboard }>("/api/dashboard/executive");
  },
  kpis() {
    return apiClient.get<{ data: KpiData }>("/api/dashboard/kpi");
  },
  kris() {
    return apiClient.get<{ data: KriData[] }>("/api/dashboard/kri");
  },
  heatmap() {
    return apiClient.get<{ data: HeatmapData }>("/api/dashboard/heatmap");
  },
  trends(months = 12) {
    return apiClient.get<{ data: TrendsData }>("/api/dashboard/trends", { params: { months } });
  },
  mttr() {
    return apiClient.get<{ data: MttrData }>("/api/dashboard/mttr");
  },
  slaBreach() {
    return apiClient.get<{ data: SlaBreachData }>("/api/dashboard/sla-breach");
  },
  distinctVsOccurrences() {
    return apiClient.get<{ data: DistinctVsOccurrencesData }>("/api/dashboard/distinct-vs-occurrences");
  },
  compliancePosture() {
    return apiClient.get<{ data: CompliancePostureData }>("/api/dashboard/compliance-posture");
  },
  nexusLifecycleSummary() {
    return apiClient.get<{ data: NexusLifecycleSummary }>("/api/dashboard/nexus-lifecycle-summary");
  },
  nexusLifecycleOccurrences(vulnId: string) {
    return apiClient.get<{ data: NexusLifecycleOccurrence[] }>(`/api/dashboard/nexus-lifecycle-occurrences/${encodeURIComponent(vulnId)}`);
  },
  fetchLiveNexusKpis(sessionToken: string) {
    return apiClient.post<{ data: LiveNexusKpis }>("/api/nexus/kpis/executive/live", { sessionToken });
  },
};
