import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vegApi, VegListParams, VegRequest } from "../api/veg.api";

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
  return useMutation({
    mutationFn: (payload: Partial<VegRequest>) => vegApi.create(payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["veg", "list"] }); },
  });
}

export function useUpdateVeg() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<VegRequest> }) => vegApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["veg"] }); },
  });
}

export function useDeleteVeg() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vegApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["veg", "list"] }); },
  });
}

export function useSignoffVeg() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, department, state }: { id: string; department: string; state: string }) =>
      vegApi.signoff(id, department, state),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["veg"] }); },
  });
}

export function useBidDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: string }) =>
      vegApi.bidDecision(id, decision),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["veg"] }); },
  });
}

export function useGoNoGo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: string }) =>
      vegApi.goNoGo(id, decision),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["veg"] }); },
  });
}

export function useCreateOpportunity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ vegId, data }: { vegId: string; data: any }) =>
      vegApi.createOpportunity(vegId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["veg"] }); },
  });
}

export function useCreateContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ opportunityId, data }: { opportunityId: string; data: any }) =>
      vegApi.createContract(opportunityId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["veg"] }); },
  });
}
