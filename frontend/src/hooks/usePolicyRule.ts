import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { policyRuleApi } from "../api/policyRule.api";
import { useUIStore } from "../store/ui.store";

export function usePolicyRuleList(filters?: { threatLevel?: string; category?: string }) {
  return useQuery({
    queryKey: ["policy-rules", "list", filters],
    queryFn: async () => {
      const { data } = await policyRuleApi.list(filters);
      return data.data;
    },
  });
}

export function usePolicyRule(id: string) {
  return useQuery({
    queryKey: ["policy-rules", id],
    queryFn: async () => {
      const { data } = await policyRuleApi.getById(id);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreatePolicyRule() {
  const qc = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  return useMutation({
    mutationFn: (payload: { policyId: string; name: string; threatLevel: string; category?: string; description?: string }) =>
      policyRuleApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["policy-rules"] });
      addToast({ type: "success", message: "Policy rule created" });
    },
    onError: () => addToast({ type: "error", message: "Failed to create policy rule" }),
  });
}

export function useUpdatePolicyRule() {
  const qc = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; threatLevel?: string; category?: string; description?: string } }) =>
      policyRuleApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["policy-rules"] });
      addToast({ type: "success", message: "Policy rule updated" });
    },
    onError: () => addToast({ type: "error", message: "Failed to update policy rule" }),
  });
}

export function useDeletePolicyRule() {
  const qc = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  return useMutation({
    mutationFn: (id: string) => policyRuleApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["policy-rules"] });
      addToast({ type: "success", message: "Policy rule deleted" });
    },
    onError: () => addToast({ type: "error", message: "Failed to delete policy rule" }),
  });
}
