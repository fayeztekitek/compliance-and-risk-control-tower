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
