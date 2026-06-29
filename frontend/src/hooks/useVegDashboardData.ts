import { useQuery } from "@tanstack/react-query";
import { vegDealApi, type VegDashboardData, type VegDashboardFilters } from "../api/veg.api";

export function useVegDashboardData(filters?: VegDashboardFilters) {
  const result = useQuery({
    queryKey: ["veg", "dashboard", filters],
    queryFn: async () => {
      const { data } = await vegDealApi.dashboard(filters);
      return data.data as VegDashboardData;
    },
    staleTime: 60_000,
    retry: 2,
  });

  return {
    dashboard: result.data ?? null,
    isFetching: result.isFetching,
    isError: result.isError,
    refetch: result.refetch,
  };
}
