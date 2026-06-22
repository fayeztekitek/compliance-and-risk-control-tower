import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { committeeApi, type Committee, type Decision, type Obligation } from "../api/committee.api";
import { useUIStore } from "../store/ui.store";

export function useCommitteeList(search?: string) {
  return useQuery({
    queryKey: ["committees", search],
    queryFn: async () => { const r = await committeeApi.list({ search }); return r.data.data; },
  });
}

export function useCommitteeById(id: string | null) {
  return useQuery({
    queryKey: ["committees", id],
    queryFn: async () => { const r = await committeeApi.getById(id!); return r.data.data; },
    enabled: !!id,
  });
}

export function useCreateCommittee() {
  const qc = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  return useMutation({
    mutationFn: (data: Partial<Committee>) => committeeApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["committees"] }); addToast({ type: "success", message: "Committee created" }); },
    onError: () => addToast({ type: "error", message: "Failed to create committee" }),
  });
}

export function useUpdateCommittee() {
  const qc = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Committee> }) => committeeApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["committees"] }); addToast({ type: "success", message: "Committee updated" }); },
    onError: () => addToast({ type: "error", message: "Failed to update committee" }),
  });
}

export function useDeleteCommittee() {
  const qc = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  return useMutation({
    mutationFn: (id: string) => committeeApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["committees"] }); addToast({ type: "success", message: "Committee deleted" }); },
    onError: () => addToast({ type: "error", message: "Failed to delete committee" }),
  });
}

export function useCommitteeDecisions(committeeId: string | null) {
  return useQuery({
    queryKey: ["committees", committeeId, "decisions"],
    queryFn: async () => { const r = await committeeApi.listDecisions(committeeId!); return r.data.data; },
    enabled: !!committeeId,
  });
}

export function useRecordDecision() {
  const qc = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ committeeId, data }: { committeeId: string; data: Partial<Decision> }) => committeeApi.recordDecision(committeeId, data),
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ["committees", vars.committeeId, "decisions"] }); addToast({ type: "success", message: "Decision recorded" }); },
    onError: () => addToast({ type: "error", message: "Failed to record decision" }),
  });
}

export function useCommitteeObligations(committeeId: string | null) {
  return useQuery({
    queryKey: ["committees", committeeId, "obligations"],
    queryFn: async () => { const r = await committeeApi.listObligations(committeeId!); return r.data.data; },
    enabled: !!committeeId,
  });
}

export function useCreateObligation() {
  const qc = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ committeeId, data }: { committeeId: string; data: Partial<Obligation> }) => committeeApi.createObligation(committeeId, data),
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ["committees", vars.committeeId, "obligations"] }); addToast({ type: "success", message: "Obligation created" }); },
    onError: () => addToast({ type: "error", message: "Failed to create obligation" }),
  });
}

export function useUpdateObligation() {
  const qc = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ obligationId, data }: { obligationId: string; data: Partial<Obligation> }) => committeeApi.updateObligation(obligationId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["committees"] }); addToast({ type: "success", message: "Obligation updated" }); },
    onError: () => addToast({ type: "error", message: "Failed to update obligation" }),
  });
}
