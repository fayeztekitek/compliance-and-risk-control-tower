import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { securityApi, VulnListParams, Vulnerability } from "../api/security.api";
import { useUIStore } from "../store/ui.store";

export function useVulnerabilityList(params?: VulnListParams) {
  return useQuery({
    queryKey: ["vulnerabilities", "list", params],
    queryFn: async () => { const { data } = await securityApi.listVulnerabilities(params); return data; },
  });
}

export function useWaivers() {
  return useQuery({
    queryKey: ["waivers", "list"],
    queryFn: async () => { const { data } = await securityApi.listWaivers(); return data.data; },
  });
}

export function useRiskAcceptances() {
  return useQuery({
    queryKey: ["risk-acceptances", "list"],
    queryFn: async () => { const { data } = await securityApi.listRiskAcceptances(); return data.data; },
  });
}

export function useSlaIncidents() {
  return useQuery({
    queryKey: ["sla-incidents", "list"],
    queryFn: async () => { const { data } = await securityApi.listSlaIncidents(); return data.data; },
  });
}

export function useCreateVulnerability() {
  const qc = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  return useMutation({
    mutationFn: (payload: Partial<Vulnerability>) => securityApi.createVulnerability(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vulnerabilities", "list"] });
      addToast({ type: "success", message: "Vulnerability created" });
    },
    onError: () => addToast({ type: "error", message: "Failed to create vulnerability" }),
  });
}

export function useUpdateVulnerability() {
  const qc = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Vulnerability> }) => securityApi.updateVulnerability(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vulnerabilities"] });
      addToast({ type: "success", message: "Vulnerability updated" });
    },
    onError: () => addToast({ type: "error", message: "Failed to update vulnerability" }),
  });
}

export function useSetFalsePositive() {
  const qc = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, explanation }: { id: string; explanation: string }) => securityApi.setFalsePositive(id, explanation),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vulnerabilities"] });
      addToast({ type: "success", message: "Marked as false positive" });
    },
    onError: () => addToast({ type: "error", message: "Failed to mark as false positive" }),
  });
}

export function useCreateWaiver() {
  const qc = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  return useMutation({
    mutationFn: (data: any) => securityApi.createWaiver(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["waivers"] });
      qc.invalidateQueries({ queryKey: ["vulnerabilities"] });
      addToast({ type: "success", message: "Waiver requested" });
    },
    onError: () => addToast({ type: "error", message: "Failed to request waiver" }),
  });
}

export function useApproveWaiver() {
  const qc = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  return useMutation({
    mutationFn: (id: string) => securityApi.approveWaiver(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["waivers"] });
      qc.invalidateQueries({ queryKey: ["vulnerabilities"] });
      addToast({ type: "success", message: "Waiver approved" });
    },
    onError: () => addToast({ type: "error", message: "Failed to approve waiver" }),
  });
}

export function useRejectWaiver() {
  const qc = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  return useMutation({
    mutationFn: (id: string) => securityApi.rejectWaiver(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["waivers"] });
      addToast({ type: "success", message: "Waiver rejected" });
    },
    onError: () => addToast({ type: "error", message: "Failed to reject waiver" }),
  });
}

export function useCreateRiskAcceptance() {
  const qc = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  return useMutation({
    mutationFn: (data: any) => securityApi.createRiskAcceptance(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["risk-acceptances"] });
      qc.invalidateQueries({ queryKey: ["vulnerabilities"] });
      addToast({ type: "success", message: "Risk acceptance submitted" });
    },
    onError: () => addToast({ type: "error", message: "Failed to submit risk acceptance" }),
  });
}

export function useApproveRiskAcceptance() {
  const qc = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  return useMutation({
    mutationFn: (id: string) => securityApi.approveRiskAcceptance(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["risk-acceptances"] });
      qc.invalidateQueries({ queryKey: ["vulnerabilities"] });
      addToast({ type: "success", message: "Risk acceptance approved" });
    },
    onError: () => addToast({ type: "error", message: "Failed to approve risk acceptance" }),
  });
}

export function useDetectSlaBreaches() {
  const qc = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  return useMutation({
    mutationFn: () => securityApi.detectSlaBreaches(),
    onSuccess: ({ data }) => {
      qc.invalidateQueries({ queryKey: ["sla-incidents"] });
      addToast({ type: "info", message: `Detected ${data.data.detected} SLA breaches` });
    },
    onError: () => addToast({ type: "error", message: "Failed to detect SLA breaches" }),
  });
}

export function useCheckWaiverExpiry() {
  const qc = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  return useMutation({
    mutationFn: () => securityApi.checkWaiverExpiry(),
    onSuccess: ({ data }) => {
      qc.invalidateQueries({ queryKey: ["waivers"] });
      qc.invalidateQueries({ queryKey: ["vulnerabilities"] });
      addToast({ type: "info", message: `Checked ${data.data.checked} waivers for expiry` });
    },
    onError: () => addToast({ type: "error", message: "Failed to check waiver expiry" }),
  });
}

export function useImportScan() {
  const qc = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  return useMutation({
    mutationFn: (vulnerabilities: Partial<Vulnerability>[]) => securityApi.importScan(vulnerabilities),
    onSuccess: ({ data }) => {
      qc.invalidateQueries({ queryKey: ["vulnerabilities", "list"] });
      addToast({ type: "success", message: `Imported ${data.data.imported} vulnerabilities` });
    },
    onError: () => addToast({ type: "error", message: "Failed to import scan results" }),
  });
}
