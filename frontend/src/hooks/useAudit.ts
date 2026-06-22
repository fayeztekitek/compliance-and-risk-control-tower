import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { auditApi, type Audit, type Finding, type CapiItem } from "../api/audit.api";
import { useUIStore } from "../store/ui.store";

export function useAuditList(params?: { search?: string; status?: string; page?: number }) {
  return useQuery({
    queryKey: ["audits", params],
    queryFn: async () => { const r = await auditApi.list(params); return { data: r.data.data, total: r.data.total }; },
  });
}

export function useAuditById(id: string | null) {
  return useQuery({
    queryKey: ["audits", id],
    queryFn: async () => { const r = await auditApi.getById(id!); return r.data.data; },
    enabled: !!id,
  });
}

export function useCreateAudit() {
  const qc = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  return useMutation({
    mutationFn: (data: Partial<Audit>) => auditApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["audits"] }); addToast({ type: "success", message: "Audit created" }); },
    onError: () => addToast({ type: "error", message: "Failed to create audit" }),
  });
}

export function useUpdateAudit() {
  const qc = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Audit> }) => auditApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["audits"] }); addToast({ type: "success", message: "Audit updated" }); },
    onError: () => addToast({ type: "error", message: "Failed to update audit" }),
  });
}

export function useDeleteAudit() {
  const qc = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  return useMutation({
    mutationFn: (id: string) => auditApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["audits"] }); addToast({ type: "success", message: "Audit deleted" }); },
    onError: () => addToast({ type: "error", message: "Failed to delete audit" }),
  });
}

export function useFindings(auditId: string | null) {
  return useQuery({
    queryKey: ["audits", auditId, "findings"],
    queryFn: async () => { const r = await auditApi.listFindings(auditId!); return r.data.data; },
    enabled: !!auditId,
  });
}

export function useCreateFinding() {
  const qc = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ auditId, data }: { auditId: string; data: Partial<Finding> }) => auditApi.createFinding(auditId, data),
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ["audits", vars.auditId, "findings"] }); addToast({ type: "success", message: "Finding added" }); },
    onError: () => addToast({ type: "error", message: "Failed to add finding" }),
  });
}

export function useCapiList(auditId: string | null) {
  return useQuery({
    queryKey: ["audits", auditId, "capa"],
    queryFn: async () => { const r = await auditApi.listCapi(auditId!); return r.data.data; },
    enabled: !!auditId,
  });
}

export function useCreateCapi() {
  const qc = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ auditId, data }: { auditId: string; data: Partial<CapiItem> }) => auditApi.createCapi(auditId, data),
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ["audits", vars.auditId, "capa"] }); addToast({ type: "success", message: "CAPA created" }); },
    onError: () => addToast({ type: "error", message: "Failed to create CAPA" }),
  });
}
