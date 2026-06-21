import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { securityApi, VulnListParams, Vulnerability } from "../api/security.api";

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
  return useMutation({
    mutationFn: (payload: Partial<Vulnerability>) => securityApi.createVulnerability(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vulnerabilities", "list"] }),
  });
}

export function useUpdateVulnerability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Vulnerability> }) => securityApi.updateVulnerability(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vulnerabilities"] }),
  });
}

export function useSetFalsePositive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, explanation }: { id: string; explanation: string }) => securityApi.setFalsePositive(id, explanation),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vulnerabilities"] }),
  });
}

export function useCreateWaiver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => securityApi.createWaiver(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["waivers"] }); qc.invalidateQueries({ queryKey: ["vulnerabilities"] }); },
  });
}

export function useApproveWaiver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => securityApi.approveWaiver(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["waivers"] }); qc.invalidateQueries({ queryKey: ["vulnerabilities"] }); },
  });
}

export function useRejectWaiver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => securityApi.rejectWaiver(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["waivers"] }),
  });
}

export function useCreateRiskAcceptance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => securityApi.createRiskAcceptance(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["risk-acceptances"] }); qc.invalidateQueries({ queryKey: ["vulnerabilities"] }); },
  });
}

export function useApproveRiskAcceptance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => securityApi.approveRiskAcceptance(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["risk-acceptances"] }); qc.invalidateQueries({ queryKey: ["vulnerabilities"] }); },
  });
}

export function useDetectSlaBreaches() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => securityApi.detectSlaBreaches(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sla-incidents"] }),
  });
}

export function useCheckWaiverExpiry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => securityApi.checkWaiverExpiry(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["waivers"] }); qc.invalidateQueries({ queryKey: ["vulnerabilities"] }); },
  });
}

export function useImportScan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vulnerabilities: Partial<Vulnerability>[]) => securityApi.importScan(vulnerabilities),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vulnerabilities", "list"] }),
  });
}
