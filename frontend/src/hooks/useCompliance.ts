import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { complianceApi } from "../api/compliance.api";
import { useUIStore } from "../store/ui.store";

export function useFrameworkSummaries() {
  return useQuery({
    queryKey: ["compliance", "frameworks"],
    queryFn: async () => {
      const { data } = await complianceApi.getFrameworks();
      return data.data;
    },
    staleTime: 30000,
  });
}

export function useRegulatoryMappings() {
  return useQuery({
    queryKey: ["compliance", "regulatory-mappings"],
    queryFn: async () => {
      const { data } = await complianceApi.getRegulatoryMappings();
      return data.data;
    },
    staleTime: 60000,
  });
}

export function useSlaBreaches() {
  return useQuery({
    queryKey: ["compliance", "sla-breaches"],
    queryFn: async () => {
      const { data } = await complianceApi.getSlaBreaches();
      return data.data;
    },
    refetchInterval: 30000,
  });
}

export function useClassifications(params?: { framework?: string; findingId?: string; status?: string }) {
  return useQuery({
    queryKey: ["compliance", "classifications", params],
    queryFn: async () => {
      const { data } = await complianceApi.getClassifications(params);
      return data.data;
    },
  });
}

export function useAutoClassify() {
  const qc = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  return useMutation({
    mutationFn: (findingId: string) => complianceApi.autoClassify(findingId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["compliance"] });
      addToast({ type: "success", message: "Finding auto-classified" });
    },
    onError: () => addToast({ type: "error", message: "Auto-classify failed" }),
  });
}

export function useDetectBreaches() {
  const qc = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  return useMutation({
    mutationFn: () => complianceApi.detectBreaches(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["compliance"] });
      addToast({ type: "success", message: "Breaches detected" });
    },
    onError: () => addToast({ type: "error", message: "Breach detection failed" }),
  });
}
