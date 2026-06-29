import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vegApi, VegListParams, VegRequest } from "../api/veg.api";
import { useUIStore } from "../store/ui.store";

export function useVegList(params?: VegListParams) {
  return useQuery({
    queryKey: ["veg", "list", params],
    queryFn: async () => {
      const { data } = await vegApi.list(params);
      return data;
    },
  });
}

export function useVegById(id: string | null) {
  return useQuery({
    queryKey: ["veg", id],
    queryFn: async () => {
      const { data } = await vegApi.getById(id!);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateVeg() {
  const qc = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  return useMutation({
    mutationFn: (payload: Partial<VegRequest>) => vegApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["veg", "list"] });
      addToast({ type: "success", message: "VEG request created" });
    },
    onError: () => addToast({ type: "error", message: "Failed to create VEG request" }),
  });
}

export function useUpdateVeg() {
  const qc = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<VegRequest> }) => vegApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["veg"] });
      addToast({ type: "success", message: "VEG request updated" });
    },
    onError: () => addToast({ type: "error", message: "Failed to update VEG request" }),
  });
}

export function useDeleteVeg() {
  const qc = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  return useMutation({
    mutationFn: (id: string) => vegApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["veg", "list"] });
      addToast({ type: "success", message: "VEG request deleted" });
    },
    onError: () => addToast({ type: "error", message: "Failed to delete VEG request" }),
  });
}

export function useSignoffVeg() {
  const qc = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, department, state }: { id: string; department: string; state: string }) =>
      vegApi.signoff(id, department, state),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["veg"] });
      addToast({ type: "success", message: "Sign-off recorded" });
    },
    onError: () => addToast({ type: "error", message: "Failed to record sign-off" }),
  });
}

export function useBidDecision() {
  const qc = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: string }) =>
      vegApi.bidDecision(id, decision),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["veg"] });
      addToast({ type: "success", message: `Bid decision: ${variables.decision}` });
    },
    onError: () => addToast({ type: "error", message: "Failed to record bid decision" }),
  });
}

export function useGoNoGo() {
  const qc = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: string }) =>
      vegApi.goNoGo(id, decision),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["veg"] });
      addToast({ type: "success", message: `Go/No-Go: ${variables.decision}` });
    },
    onError: () => addToast({ type: "error", message: "Failed to record Go/No-Go decision" }),
  });
}

export function useCreateOpportunity() {
  const qc = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ vegId, data }: { vegId: string; data: any }) =>
      vegApi.createOpportunity(vegId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["veg"] });
      addToast({ type: "success", message: "Opportunity created" });
    },
    onError: () => addToast({ type: "error", message: "Failed to create opportunity" }),
  });
}

export function useCreateContract() {
  const qc = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ opportunityId, data }: { opportunityId: string; data: any }) =>
      vegApi.createContract(opportunityId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["veg"] });
      addToast({ type: "success", message: "Contract created" });
    },
    onError: () => addToast({ type: "error", message: "Failed to create contract" }),
  });
}

// === VEG DEAL hooks ===

import { vegDealApi, VegDealListParams, VegDealStats } from "../api/veg.api";

export function useVegDealList(params?: VegDealListParams) {
  return useQuery({
    queryKey: ["veg-deals", "list", params],
    queryFn: async () => {
      const { data } = await vegDealApi.list(params);
      return data;
    },
  });
}

export function useVegDealById(id: string | null) {
  return useQuery({
    queryKey: ["veg-deals", id],
    queryFn: async () => {
      const { data } = await vegDealApi.getById(id!);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useVegDealStats() {
  return useQuery({
    queryKey: ["veg-deals", "stats"],
    queryFn: async () => {
      const { data } = await vegDealApi.getStats();
      const raw = data.data;
      return {
        aggregates: raw.aggregates || { total_deals: "0", total_tcv: "0", avg_tcv: "0", won_deals: "0", lost_deals: "0", open_deals: "0" },
        decisions: Array.isArray(raw.decisions) ? raw.decisions : [],
        businessLines: Array.isArray(raw.businessLines) ? raw.businessLines : [],
        regions: Array.isArray(raw.regions) ? raw.regions : [],
        topClients: Array.isArray(raw.topClients) ? raw.topClients : [],
        topOwners: Array.isArray(raw.topOwners) ? raw.topOwners : [],
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useVegDealMonthlyTrend() {
  return useQuery({
    queryKey: ["veg-deals", "trends", "monthly"],
    queryFn: async () => {
      const { data } = await vegDealApi.getMonthlyTrend();
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useVegDealYearOverYear() {
  return useQuery({
    queryKey: ["veg-deals", "trends", "yoy"],
    queryFn: async () => {
      const { data } = await vegDealApi.getYearOverYear();
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateVegDeal() {
  const qc = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  return useMutation({
    mutationFn: (payload: any) => vegDealApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["veg-deals"] });
      addToast({ type: "success", message: "VEG deal created" });
    },
    onError: () => addToast({ type: "error", message: "Failed to create VEG deal" }),
  });
}

export function useUpdateVegDeal() {
  const qc = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => vegDealApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["veg-deals"] });
      addToast({ type: "success", message: "VEG deal updated" });
    },
    onError: () => addToast({ type: "error", message: "Failed to update VEG deal" }),
  });
}

export function useDeleteVegDeal() {
  const qc = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  return useMutation({
    mutationFn: (id: string) => vegDealApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["veg-deals"] });
      addToast({ type: "success", message: "VEG deal deleted" });
    },
    onError: () => addToast({ type: "error", message: "Failed to delete VEG deal" }),
  });
}
