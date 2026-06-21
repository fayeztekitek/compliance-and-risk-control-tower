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
};
