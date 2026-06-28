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
  snapshot: ExecutiveSnapshot | null;
  kpis: KpiData;
  kris: KriData[];
  trends: TrendsData;
  recentAlerts: unknown[];
  orgPostures: unknown[];
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

export interface TopRiskyApp {
  applicationId: string;
  applicationName: string;
  organizationId: string;
  organizationName: string;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  totalOpen: number;
}

export interface TopVulnerableComponent {
  componentName: string;
  componentVersion: string;
  packageUrl: string;
  criticalCount: number;
  highCount: number;
  totalOpen: number;
  affectedApps: number;
}

export interface AppRequiringAction {
  applicationId: string;
  applicationName: string;
  businessCriticality: string;
  organizationName: string;
  criticalCount: number;
  highCount: number;
  lastScanDate: string;
}

export interface LatestScanSummary {
  scanId: string;
  applicationId: string;
  applicationName: string;
  scanDate: string;
  stage: string;
  totalComponents: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  totalViolations: number;
  policyEvaluationStatus: string;
}

export interface OrgRiskHeatmap {
  organizationId: string;
  organizationName: string;
  totalApps: number;
  criticalCount: number;
  highCount: number;
  totalOpen: number;
  riskLevel: "GREEN" | "ORANGE" | "RED";
}

export interface OrgHierarchyItem {
  organizationId: string;
  organizationName: string;
  parentOrganizationId: string | null;
  parentOrganizationName: string | null;
  totalApps: number;
  scannedApps: number;
  subOrganizationCount: number;
  scanCoverageRate: number;
  openCritical: number;
  openHigh: number;
  openMedium: number;
  openLow: number;
  totalOpen: number;
}

export interface ExecutiveSnapshot {
  snapshotDate: string;
  totalOrganizations: number;
  totalApplications: number;
  activeApplications: number;
  inactiveApplications: number;
  neverScanned: number;
  scanCoverageRate: number;
  averageScanAgeDays: number;
  openCritical: number;
  openHigh: number;
  openMedium: number;
  openLow: number;
  totalOpenVulnerabilities: number;
  distinctVulnerabilities: number;
  occurrences: number;
  mitigatedVulnerabilities: number;
  acceptedRisks: number;
  waivedCount: number;
  falsePositives: number;
  newVulnerabilities30d: number;
  fixedVulnerabilities30d: number;
  recurringVulnerabilities: number;
  mttrDays: number;
  avgTimeToCloseDays: number;
  closedThisMonth: number;
  applicationsOutOfSla: number;
  acceptedRisksExpiringSoon: number;
  expiredAcceptedRisks: number;
  applicationsWithoutRecentScan: number;
  criticalAppsWithoutScan: number;
  complianceRate: number;
  slaComplianceRate: number;
  appsWithCriticalVulns: number;
  appsWithHighVulns: number;
  averageRiskScore: number;
  productsRedCount: number;
  productsOrangeCount: number;
  productsGreenCount: number;
  previousTotal: number;
  previousCritical: number;
  previousHigh: number;
  previousRiskScore: number;
  trendDirection: string;
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
  topRiskyApps(limit = 20) {
    return apiClient.get<{ data: TopRiskyApp[] }>("/api/dashboard/top-risky-apps", { params: { limit } });
  },
  topComponents(limit = 20) {
    return apiClient.get<{ data: TopVulnerableComponent[] }>("/api/dashboard/top-components", { params: { limit } });
  },
  appsRequiringAction(limit = 20) {
    return apiClient.get<{ data: AppRequiringAction[] }>("/api/dashboard/apps-requiring-action", { params: { limit } });
  },
  latestScanSummary(limit = 20) {
    return apiClient.get<{ data: LatestScanSummary[] }>("/api/dashboard/latest-scan-summary", { params: { limit } });
  },
  orgRiskHeatmap() {
    return apiClient.get<{ data: OrgRiskHeatmap[] }>("/api/dashboard/org-risk-heatmap");
  },
  orgHierarchy() {
    return apiClient.get<{ data: OrgHierarchyItem[] }>("/api/dashboard/org-hierarchy");
  },
  orgDrilldown(orgId: string) {
    return apiClient.get<{ data: any }>(`/api/dashboard/org-drilldown/${encodeURIComponent(orgId)}`);
  },
  fetchLiveNexusKpis(sessionToken: string) {
    return apiClient.post<{ data: LiveNexusKpis }>("/api/nexus/kpis/executive/live", { sessionToken }, { timeout: 30000 });
  },
  dashboardPage(page: string) {
    return apiClient.get<{ data: any }>(`/api/dashboard-pages/${page}`);
  },
};
