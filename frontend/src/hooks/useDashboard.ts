import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "../api/dashboard.api";

export function useExecutiveDashboard() {
  return useQuery({
    queryKey: ["dashboard", "executive"],
    queryFn: async () => {
      const { data } = await dashboardApi.executive();
      return data.data;
    },
    staleTime: 60_000,
  });
}

export function useDashboardKpis() {
  return useQuery({
    queryKey: ["dashboard", "kpis"],
    queryFn: async () => {
      const { data } = await dashboardApi.kpis();
      return data.data;
    },
    staleTime: 60_000,
  });
}

export function useDashboardKris() {
  return useQuery({
    queryKey: ["dashboard", "kris"],
    queryFn: async () => {
      const { data } = await dashboardApi.kris();
      return data.data;
    },
    staleTime: 60_000,
  });
}

export function useDashboardHeatmap() {
  return useQuery({
    queryKey: ["dashboard", "heatmap"],
    queryFn: async () => {
      const { data } = await dashboardApi.heatmap();
      return data.data;
    },
    staleTime: 60_000,
  });
}

export function useDashboardTrends(months = 12) {
  return useQuery({
    queryKey: ["dashboard", "trends", months],
    queryFn: async () => {
      const { data } = await dashboardApi.trends(months);
      return data.data;
    },
    staleTime: 60_000,
  });
}

export function useMttr() {
  return useQuery({
    queryKey: ["dashboard", "mttr"],
    queryFn: async () => {
      const { data } = await dashboardApi.mttr();
      return data.data;
    },
    staleTime: 60_000,
  });
}

export function useSlaBreach() {
  return useQuery({
    queryKey: ["dashboard", "sla"],
    queryFn: async () => {
      const { data } = await dashboardApi.slaBreach();
      return data.data;
    },
    staleTime: 60_000,
  });
}

export function useDistinctVsOccurrences() {
  return useQuery({
    queryKey: ["dashboard", "distinct-occurrences"],
    queryFn: async () => {
      const { data } = await dashboardApi.distinctVsOccurrences();
      return data.data;
    },
    staleTime: 60_000,
  });
}

export function useCompliancePosture() {
  return useQuery({
    queryKey: ["dashboard", "compliance"],
    queryFn: async () => {
      const { data } = await dashboardApi.compliancePosture();
      return data.data;
    },
    staleTime: 60_000,
  });
}

export function useNexusLifecycleSummary() {
  return useQuery({
    queryKey: ["dashboard", "nexus-lifecycle"],
    queryFn: async () => {
      const { data } = await dashboardApi.nexusLifecycleSummary();
      return data.data;
    },
    staleTime: 60_000,
  });
}

export function useNexusLifecycleOccurrences(vulnId: string | null) {
  return useQuery({
    queryKey: ["dashboard", "nexus-occurrences", vulnId],
    queryFn: async () => {
      const { data } = await dashboardApi.nexusLifecycleOccurrences(vulnId!);
      return data.data;
    },
    enabled: !!vulnId,
    staleTime: 30_000,
  });
}

export function useOrgHierarchy() {
  return useQuery({
    queryKey: ["dashboard", "org-hierarchy"],
    queryFn: async () => { const { data } = await dashboardApi.orgHierarchy(); return data.data; },
    staleTime: 60_000,
  });
}

export function useTopRiskyApps(limit = 20) {
  return useQuery({
    queryKey: ["dashboard", "top-risky-apps", limit],
    queryFn: async () => { const { data } = await dashboardApi.topRiskyApps(limit); return data.data; },
    staleTime: 60_000,
  });
}

export function useTopComponents(limit = 20) {
  return useQuery({
    queryKey: ["dashboard", "top-components", limit],
    queryFn: async () => { const { data } = await dashboardApi.topComponents(limit); return data.data; },
    staleTime: 60_000,
  });
}

export function useAppsRequiringAction(limit = 20) {
  return useQuery({
    queryKey: ["dashboard", "apps-action", limit],
    queryFn: async () => { const { data } = await dashboardApi.appsRequiringAction(limit); return data.data; },
    staleTime: 60_000,
  });
}

export function useLatestScanSummary(limit = 20) {
  return useQuery({
    queryKey: ["dashboard", "latest-scans", limit],
    queryFn: async () => { const { data } = await dashboardApi.latestScanSummary(limit); return data.data; },
    staleTime: 60_000,
  });
}

export function useOrgRiskHeatmap() {
  return useQuery({
    queryKey: ["dashboard", "org-heatmap"],
    queryFn: async () => { const { data } = await dashboardApi.orgRiskHeatmap(); return data.data; },
    staleTime: 60_000,
  });
}

export function useLiveNexusKpis(sessionToken: string | null) {
  return useQuery({
    queryKey: ["dashboard", "nexus-live-kpis", sessionToken],
    queryFn: async () => {
      const { data } = await dashboardApi.fetchLiveNexusKpis(sessionToken!);
      return data.data;
    },
    enabled: !!sessionToken,
    staleTime: 120_000,
    retry: 1,
  });
}
