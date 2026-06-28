import { useQuery } from "@tanstack/react-query";
import { dashboardApi, OrgHierarchyItem, TopRiskyApp, LatestScanSummary } from "../api/dashboard.api";
import {
  DashboardData, KpiCardData, OrgCardData, OrgDrilldownData,
  SeverityDistribution, TrendPoint, TopRiskyAppItem,
  RiskStatusDistribution, LatestScanRow,
} from "../types/nexus";

const ROOT_ORG_ID = "ROOT_ORGANIZATION_ID";

interface UseDashboardResult {
  dashboard: DashboardData;
  isFetching: boolean;
  isError: boolean;
}

function buildKpiCards(snapshot: any, kpis: any): KpiCardData[] {
  return [
    { icon: "building", title: "Total Organizations", value: snapshot?.totalOrganizations || 0, delta: 0, deltaLabel: "vs last month", deltaDirection: "flat" },
    { icon: "appwindow", title: "Total Applications", value: snapshot?.totalApplications || 0, delta: 0, deltaLabel: "vs last month", deltaDirection: "flat" },
    { icon: "bug", title: "Total Vulnerabilities", value: kpis?.totalVulnerabilities || snapshot?.totalOpenVulnerabilities || 0, delta: 0, deltaLabel: "vs last month", deltaDirection: "flat" },
    { icon: "alert", title: "Open Vulnerabilities", value: snapshot?.totalOpenVulnerabilities || 0, delta: 0, deltaLabel: "vs last month", deltaDirection: "flat" },
  ];
}

function buildOrgCards(orgs: OrgHierarchyItem[]): OrgCardData[] {
  if (!orgs?.length) return [];
  const root = orgs.find(o => o.organizationId === ROOT_ORG_ID);
  const rootId = root?.organizationId;
  return orgs
    .filter(o => o.parentOrganizationId === rootId)
    .map(o => ({
      id: o.organizationId,
      name: o.organizationName,
      subOrganizationCount: o.subOrganizationCount,
      applicationCount: o.totalApps,
      totalOpenVulnerabilities: o.totalOpen,
      criticalCount: o.openCritical,
      highCount: o.openHigh,
    }));
}

function buildSeverityDistribution(snapshot: any): SeverityDistribution[] {
  return [
    { name: "Critical", value: snapshot?.openCritical || 0, color: "#dc2626" },
    { name: "High", value: snapshot?.openHigh || 0, color: "#ea580c" },
    { name: "Medium", value: snapshot?.openMedium || 0, color: "#d97706" },
    { name: "Low", value: snapshot?.openLow || 0, color: "#3b82f6" },
  ];
}

function buildTrendPoints(trends: any): TrendPoint[] {
  if (!trends?.securityTrends?.length) return [];
  return trends.securityTrends.map((t: any) => ({
    month: t.date,
    total: t.total || 0,
    critical: t.critical || 0,
    high: t.high || 0,
    medium: t.medium || 0,
    low: t.low || 0,
  }));
}

function buildTopApps(apps: TopRiskyApp[]): TopRiskyAppItem[] {
  if (!apps?.length) return [];
  return apps.slice(0, 5).map(a => ({
    applicationName: a.applicationName,
    totalOpen: a.totalOpen || a.criticalCount + a.highCount + a.mediumCount,
    criticalCount: a.criticalCount,
    highCount: a.highCount,
    riskScore: Math.round((a.criticalCount * 10 + a.highCount * 5) * 10) / 10,
  }));
}

function buildRiskDistribution(orgs: OrgHierarchyItem[]): RiskStatusDistribution[] {
  if (!orgs?.length) {
    return [
      { name: "Red (Critical)", value: 1, color: "#dc2626" },
      { name: "Orange (High)", value: 1, color: "#ea580c" },
      { name: "Yellow (Medium)", value: 1, color: "#d97706" },
      { name: "Green (Safe)", value: 1, color: "#16a34a" },
    ];
  }
  const topLevel = orgs.filter(o => o.organizationId !== ROOT_ORG_ID);
  const crit = topLevel.filter(o => o.openCritical > 0).length;
  const high = topLevel.filter(o => o.openHigh > 0 && o.openCritical === 0).length;
  const med = topLevel.filter(o => o.totalOpen > 0 && o.openCritical === 0 && o.openHigh === 0).length;
  const none = topLevel.filter(o => o.totalOpen === 0).length;
  return [
    { name: "Red (Critical)", value: crit || 1, color: "#dc2626" },
    { name: "Orange (High)", value: high || 1, color: "#ea580c" },
    { name: "Yellow (Medium)", value: med || 1, color: "#d97706" },
    { name: "Green (Safe)", value: none || 1, color: "#16a34a" },
  ];
}

function buildLatestScans(scans: LatestScanSummary[]): LatestScanRow[] {
  if (!scans?.length) return [];
  return scans.slice(0, 10).map(s => ({
    applicationName: s.applicationName,
    organizationName: s.stage || "—",
    lastScanDate: s.scanDate,
    scanReportCount: s.totalComponents ? Math.max(1, Math.floor(s.totalComponents / 50)) : 1,
    openCritical: s.criticalCount,
    openHigh: s.highCount,
    openMedium: s.mediumCount,
    openLow: s.lowCount,
    waivedCount: 0,
    acceptedRisks: 0,
    riskScore: Math.round((s.criticalCount * 10 + s.highCount * 5) * 10) / 10,
    status: s.policyEvaluationStatus,
  }));
}

export function useExecutiveDashboardData(): UseDashboardResult {
  const executive = useQuery({
    queryKey: ["dashboard", "executive"],
    queryFn: async () => {
      const { data } = await dashboardApi.executive();
      return data.data;
    },
    staleTime: 60_000,
    retry: 2,
  });

  const orgHierarchy = useQuery({
    queryKey: ["dashboard", "org-hierarchy"],
    queryFn: async () => {
      const { data } = await dashboardApi.orgHierarchy();
      return data.data;
    },
    staleTime: 60_000,
    retry: 2,
  });

  const topApps = useQuery({
    queryKey: ["dashboard", "top-risky-apps", 5],
    queryFn: async () => {
      const { data } = await dashboardApi.topRiskyApps(5);
      return data.data;
    },
    staleTime: 60_000,
    retry: 2,
  });

  const scans = useQuery({
    queryKey: ["dashboard", "latest-scans", 10],
    queryFn: async () => {
      const { data } = await dashboardApi.latestScanSummary(10);
      return data.data;
    },
    staleTime: 60_000,
    retry: 2,
  });

  const isFetching = executive.isFetching || orgHierarchy.isFetching;
  const isError = executive.isError && orgHierarchy.isError;

  const snapshot: any = executive.data?.snapshot || {};
  const kpis: any = executive.data?.kpis || {};
  const trends: any = executive.data?.trends || {};
  const orgs: OrgHierarchyItem[] = orgHierarchy.data || [];
  const topAppData: TopRiskyApp[] = topApps.data || [];
  const scanData: LatestScanSummary[] = scans.data || [];

  const dashboard: DashboardData = {
    kpiCards: buildKpiCards(snapshot, kpis),
    topLevelOrganizations: buildOrgCards(orgs),
    severityDistribution: buildSeverityDistribution(snapshot),
    vulnerabilityTrend: buildTrendPoints(trends),
    topFiveApps: buildTopApps(topAppData),
    riskStatusDistribution: buildRiskDistribution(orgs),
    latestScans: buildLatestScans(scanData),
    totalOrgs: snapshot.totalOrganizations || orgs.length || 0,
    totalApps: snapshot.totalApplications || 0,
    totalVulns: kpis.totalVulnerabilities || snapshot.totalOpenVulnerabilities || 0,
    totalOpen: snapshot.totalOpenVulnerabilities || 0,
    orgDrilldowns: {},
  };

  return { dashboard, isFetching, isError };
}
