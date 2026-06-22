import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { saasApi, type SaaSApplication, type PrivacyAssessment } from "../api/saas.api";
import { useUIStore } from "../store/ui.store";

export function useSaaSList() {
  return useQuery({
    queryKey: ["saas", "list"],
    queryFn: async () => { const { data } = await saasApi.list(); return data.data; },
  });
}

export function useSaaSById(id: string | null) {
  return useQuery({
    queryKey: ["saas", id],
    queryFn: async () => { const { data } = await saasApi.getById(id!); return data.data; },
    enabled: !!id,
  });
}

export function useCreateSaaS() {
  const qc = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  return useMutation({
    mutationFn: (payload: Partial<SaaSApplication>) => saasApi.create(payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["saas"] }); addToast({ type: "success", message: "SaaS application created" }); },
    onError: () => addToast({ type: "error", message: "Failed to create SaaS application" }),
  });
}

export function useUpdateSaaS() {
  const qc = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SaaSApplication> }) => saasApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["saas"] }); addToast({ type: "success", message: "SaaS application updated" }); },
    onError: (err: any) => addToast({ type: "error", message: err?.response?.data?.error || "Failed to update SaaS" }),
  });
}

export function useDeleteSaaS() {
  const qc = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  return useMutation({
    mutationFn: (id: string) => saasApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["saas"] }); addToast({ type: "success", message: "SaaS application deleted" }); },
    onError: () => addToast({ type: "error", message: "Failed to delete SaaS application" }),
  });
}

export function useSubmitPrivacyAssessment() {
  const qc = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PrivacyAssessment> }) => saasApi.submitPrivacyAssessment(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["saas"] }); addToast({ type: "success", message: "Privacy assessment submitted" }); },
    onError: () => addToast({ type: "error", message: "Failed to submit privacy assessment" }),
  });
}
