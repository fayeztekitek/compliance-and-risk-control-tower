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
