import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { nexusApi } from "../api/nexus.api";

export function useOrganizations() {
  return useQuery({
    queryKey: ["nexus", "organizations"],
    queryFn: async () => {
      const { data } = await nexusApi.listOrganizations();
      return data.data;
    },
    staleTime: 60_000,
  });
}

export function useOrganization(organizationId: string) {
  return useQuery({
    queryKey: ["nexus", "organization", organizationId],
    queryFn: async () => {
      const { data } = await nexusApi.getOrganization(organizationId);
      return data.data;
    },
    enabled: !!organizationId,
    staleTime: 60_000,
  });
}

export function useProducts() {
  return useQuery({
    queryKey: ["nexus", "products"],
    queryFn: async () => {
      const { data } = await nexusApi.listProducts();
      return data.data;
    },
    staleTime: 60_000,
  });
}

export function useApplications() {
  return useQuery({
    queryKey: ["nexus", "applications"],
    queryFn: async () => {
      const { data } = await nexusApi.listApplications();
      return data.data;
    },
    staleTime: 60_000,
  });
}

export function useFindings(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["nexus", "findings", params],
    queryFn: async () => {
      const { data } = await nexusApi.listFindings(params as any);
      return data;
    },
    staleTime: 30_000,
  });
}

export function useFinding(id: string) {
  return useQuery({
    queryKey: ["nexus", "finding", id],
    queryFn: async () => {
      const { data } = await nexusApi.getFinding(id);
      return data;
    },
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useReports(applicationId: string, params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ["nexus", "reports", applicationId, params],
    queryFn: async () => {
      const { data } = await nexusApi.listReports(applicationId, params);
      return data;
    },
    enabled: !!applicationId,
    staleTime: 30_000,
  });
}

export function useLatestReport(applicationId: string) {
  return useQuery({
    queryKey: ["nexus", "latestReport", applicationId],
    queryFn: async () => {
      const { data } = await nexusApi.getLatestReport(applicationId);
      return data;
    },
    enabled: !!applicationId,
    staleTime: 30_000,
  });
}

export function useReportComparison(applicationId: string, latestId?: string, previousId?: string) {
  return useQuery({
    queryKey: ["nexus", "comparison", applicationId, latestId, previousId],
    queryFn: async () => {
      const { data } = await nexusApi.compareReports(applicationId, latestId, previousId);
      return data;
    },
    enabled: !!applicationId,
    staleTime: 30_000,
  });
}

export function useOccurrences(params?: { findingId?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ["nexus", "occurrences", params],
    queryFn: async () => {
      const { data } = await nexusApi.listOccurrences(params as any);
      return data;
    },
    enabled: !!params?.findingId,
    staleTime: 30_000,
  });
}

export function useDistinctCount(applicationId?: string) {
  return useQuery({
    queryKey: ["nexus", "distinctCount", applicationId],
    queryFn: async () => {
      const { data } = await nexusApi.getDistinctCount(applicationId);
      return data.distinctFindings;
    },
    staleTime: 30_000,
  });
}

export function useTotalOccurrences(applicationId?: string) {
  return useQuery({
    queryKey: ["nexus", "totalOccurrences", applicationId],
    queryFn: async () => {
      const { data } = await nexusApi.getTotalOccurrences(applicationId);
      return data.totalOccurrences;
    },
    staleTime: 30_000,
  });
}

export function useProposeMitigation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof nexusApi.proposeMitigation>[0]) => nexusApi.proposeMitigation(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["nexus", "finding"] }),
  });
}

export function useApproveMitigation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => nexusApi.approveMitigation(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["nexus", "finding"] }),
  });
}

export function useVerifyMitigation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, evidence }: { id: string; evidence: string }) => nexusApi.verifyMitigation(id, evidence),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["nexus", "finding"] }),
  });
}

export function useCloseMitigation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => nexusApi.closeMitigation(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["nexus", "finding"] }),
  });
}

export function useRejectMitigation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => nexusApi.rejectMitigation(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["nexus", "finding"] }),
  });
}

export function useAppTrend(applicationId: string, months?: number) {
  return useQuery({
    queryKey: ["nexus", "trend", applicationId, months],
    queryFn: async () => {
      const { data } = await nexusApi.getAppTrend(applicationId, months);
      return data;
    },
    enabled: !!applicationId,
    staleTime: 60_000,
  });
}

export function useVelocity(params?: { applicationId?: string; months?: number }) {
  return useQuery({
    queryKey: ["nexus", "velocity", params],
    queryFn: async () => {
      const { data } = await nexusApi.getVelocity(params);
      return data;
    },
    staleTime: 60_000,
  });
}

export function useCrossToolSummary() {
  return useQuery({
    queryKey: ["nexus", "crossToolSummary"],
    queryFn: async () => {
      const { data } = await nexusApi.getCrossToolSummary();
      return data as any;
    },
    staleTime: 60_000,
  });
}

export function useFindingDetail(id: string | null) {
  return useQuery({
    queryKey: ["nexus", "findingDetail", id],
    queryFn: async () => {
      const { data } = await nexusApi.getFindingDetail(id!);
      return data.data;
    },
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useOccurrenceDetail(id: string | null) {
  return useQuery({
    queryKey: ["nexus", "occurrenceDetail", id],
    queryFn: async () => {
      const { data } = await nexusApi.getOccurrenceDetail(id!);
      return data.data;
    },
    enabled: !!id,
    staleTime: 30_000,
  });
}
