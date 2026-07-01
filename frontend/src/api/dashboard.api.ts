import { apiClient } from "./client";

export interface ComplianceDashboardData {
  kpis: {
    total_controls: number; passed: number; failed: number; untested: number;
    pass_rate: number; total_breaches: number; recent_breaches: number; open_breaches: number;
  };
  classificationDistribution: { classification: string; count: number }[];
  upcomingDeadlines: { id: string; title: string; type: string; due_date: string | null }[];
}

export interface RiskDashboardData {
  kpis: {
    total_vulnerabilities: number; critical: number; high: number;
    open_vulns: number; open_critical: number;
    total_sla_breaches: number; open_sla_breaches: number;
  };
  severityDistribution: { severity: string; count: number }[];
  waiversExpiringSoon: { id: string; vulnerability_id: string; rationale: string; expiry_date: string }[];
}

export interface AuditDashboardData {
  kpis: {
    total_audits: number; in_progress: number; planned: number; completed: number;
    total_findings: number; critical_findings: number; high_findings: number; open_findings: number;
    total_capa: number; open_capa: number; completed_capa: number;
  };
  upcomingAudits: { id: string; title: string; scheduled_date: string; status: string }[];
  recentFindings: { id: string; title: string; severity: string; status: string; audit_title: string }[];
}

export async function fetchComplianceDashboard(): Promise<ComplianceDashboardData> {
  const { data } = await apiClient.get<{ data: ComplianceDashboardData }>("/api/dashboard/compliance");
  return data.data;
}

export async function fetchRiskDashboard(): Promise<RiskDashboardData> {
  const { data } = await apiClient.get<{ data: RiskDashboardData }>("/api/dashboard/risk");
  return data.data;
}

export async function fetchAuditDashboard(): Promise<AuditDashboardData> {
  const { data } = await apiClient.get<{ data: AuditDashboardData }>("/api/dashboard/audit");
  return data.data;
}

export interface CommitteesDashboardData {
  kpis: {
    total_committees: number; planned: number; held: number; cancelled: number;
    veg_committee: number; vuln_committee: number; saas_steering: number;
    exec_security: number; exec_arbitration: number;
    total_decisions: number; approved: number; rejected: number; deferred: number;
  };
  upcomingCommittees: { id: string; name: string; date: string; type: string; status: string }[];
  recentDecisions: { id: string; title: string; outcome: string; committee_name: string; created_at: string }[];
}

export interface SaaSDashboardData {
  kpis: {
    total_apps: number; avg_readiness: number;
    onboarding: number; go_live: number; offboarding: number;
    gdpr_low: number; gdpr_medium: number; gdpr_high: number;
    privacy_compliant: number; privacy_pending: number; privacy_non_compliant: number;
    steering_passed: number; steering_failed: number;
  };
  lifecycleDistribution: { lifecycle_stage: string; count: number }[];
  gdprRiskDistribution: { risk_level: string; count: number }[];
  privacyDesignStatus: { status: string; count: number }[];
}

export interface RoadmapsDashboardData {
  kpis: {
    total_roadmaps: number; avg_progress: number;
    strategic: number; budgetary: number; regulatory: number;
    on_time: number; delayed: number; critical: number;
    total_projects: number; on_track: number; deviating: number; high_risk: number;
    avg_rtd: number; avg_rtd_deviation: number;
    total_budget: number; total_consumed: number;
  };
  milestoneStatusDistribution: { status: string; count: number }[];
  projectStatusDistribution: { status: string; count: number }[];
  budgetStats: { total_budget: number; total_consumed: number }[];
  goLiveReadiness: { state: string; count: number }[];
}

export async function fetchCommitteesDashboard(): Promise<CommitteesDashboardData> {
  const { data } = await apiClient.get<{ data: CommitteesDashboardData }>("/api/dashboard/committees");
  return data.data;
}

export interface ProjectsDashboardData {
  kpis: {
    total_projects: number; on_track: number; deviating: number; high_risk: number;
    avg_rtd: number; avg_rtd_deviation: number;
    avg_slippage_md: number; avg_test_automation: number;
    total_budget: number; total_consumed: number; utilization_pct: number;
  };
  statusDistribution: { status: string; count: number }[];
  goLiveReadiness: { state: string; count: number }[];
}

export async function fetchProjectsDashboard(): Promise<ProjectsDashboardData> {
  const { data } = await apiClient.get<{ data: ProjectsDashboardData }>("/api/dashboard/projects");
  return data.data;
}

export async function fetchSaaSDashboard(): Promise<SaaSDashboardData> {
  const { data } = await apiClient.get<{ data: SaaSDashboardData }>("/api/dashboard/saas");
  return data.data;
}

export async function fetchRoadmapsDashboard(): Promise<RoadmapsDashboardData> {
  const { data } = await apiClient.get<{ data: RoadmapsDashboardData }>("/api/dashboard/roadmaps");
  return data.data;
}

export interface RoadmapExecutiveDashboardData {
  kpis: {
    totalRoadmaps: number; avgProgress: number;
    totalProjects: number; onTrack: number; deviating: number; highRisk: number;
    capacityGap: number; capacityUtilization: number;
    avgRtd: number; avgRtdDeviation: number;
    totalBudget: number; totalConsumed: number; burnRate: number;
    overrunCount: number; totalOverrun: number;
  };
  milestoneStatusDistribution: { name: string; value: number }[];
  typeDistribution: { name: string; value: number }[];
  rtdByRoadmap: { roadmap_name: string; project_count: number; avg_rtd: number; avg_deviation: number; progress: number; milestone_status: string }[];
  snapshotTrend: {
    period: string; avg_rtd: number; avg_deviation: number;
    total_projects: number; on_track: number; deviating: number; high_risk: number;
  }[];
}

export async function fetchRoadmapExecutiveDashboard(): Promise<RoadmapExecutiveDashboardData> {
  const { data } = await apiClient.get<{ data: RoadmapExecutiveDashboardData }>("/api/roadmaps/executive-dashboard");
  return data.data;
}

export interface OrgDrilldownData {
  kpis: Record<string, number>;
  severityDistribution: { severity: string; count: number }[];
  slaBreaches: { id: string; title: string; severity: string; status: string }[];
  topVulnerableComponents: { id: string; name: string; vulnerability_count: number; avg_cvss: number }[];
}

export interface DashboardPageData {
  kpis: Record<string, number>;
  charts: Record<string, any[]>;
}

export const dashboardApi = {
  async executive() {
    return apiClient.get("/api/dashboard/executive");
  },
  async kpis() {
    return apiClient.get("/api/dashboard/kpi");
  },
  async kris() {
    return apiClient.get("/api/dashboard/kri");
  },
  async heatmap() {
    return apiClient.get("/api/dashboard/heatmap");
  },
  async trends(months = 12) {
    return apiClient.get("/api/dashboard/trends", { params: { months } });
  },
  async mttr() {
    return apiClient.get("/api/dashboard/mttr");
  },
  async slaBreach() {
    return apiClient.get("/api/dashboard/sla-breach");
  },
  async distinctVsOccurrences() {
    return apiClient.get("/api/dashboard/distinct-vs-occurrences");
  },
  async compliancePosture() {
    return apiClient.get("/api/dashboard/compliance-posture");
  },
  async nexusLifecycleSummary() {
    return apiClient.get("/api/dashboard/nexus-lifecycle-summary");
  },
  async nexusLifecycleOccurrences(vulnId: string) {
    return apiClient.get(`/api/dashboard/nexus-lifecycle-occurrences/${vulnId}`);
  },
  async orgHierarchy() {
    return apiClient.get("/api/dashboard/org-hierarchy");
  },
  async orgDrilldown(orgId: string, params?: Record<string, any>) {
    return apiClient.get<{ data: OrgDrilldownData }>(`/api/dashboard/org-drilldown/${orgId}`, { params });
  },
  async topRiskyApps(limit = 20) {
    return apiClient.get("/api/dashboard/top-risky-apps", { params: { limit } });
  },
  async topComponents(limit = 20) {
    return apiClient.get("/api/dashboard/top-components", { params: { limit } });
  },
  async appsRequiringAction(limit = 20) {
    return apiClient.get("/api/dashboard/apps-requiring-action", { params: { limit } });
  },
  async latestScanSummary(limit = 20) {
    return apiClient.get("/api/dashboard/latest-scan-summary", { params: { limit } });
  },
  async orgRiskHeatmap() {
    return apiClient.get("/api/dashboard/org-risk-heatmap");
  },
  async scanHealth() {
    return apiClient.get("/api/dashboard/scan-health");
  },
  async dashboardPage(page: string) {
    return apiClient.get<{ data: DashboardPageData }>(`/api/dashboard-pages/${page}`);
  },
  async fetchLiveNexusKpis(_sessionToken: string) {
    return apiClient.get("/api/dashboard/kpi");
  },
};
