import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectApi, type Project, type ProjectListParams, type RtdSubmission } from "../api/project.api";
import { useUIStore } from "../store/ui.store";

export function useProjectList(params?: ProjectListParams) {
  return useQuery({
    queryKey: ["projects", "list", params],
    queryFn: async () => { const { data } = await projectApi.list(params); return data; },
  });
}

export function useProjectById(id: string | null) {
  return useQuery({
    queryKey: ["projects", id],
    queryFn: async () => { const { data } = await projectApi.getById(id!); return data.data; },
    enabled: !!id,
  });
}

export function useRoadmapList() {
  return useQuery({
    queryKey: ["roadmaps", "list"],
    queryFn: async () => { const { data } = await projectApi.listRoadmaps(); return data.data; },
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  return useMutation({
    mutationFn: (payload: Partial<Project>) => projectApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      addToast({ type: "success", message: "Project created" });
    },
    onError: () => addToast({ type: "error", message: "Failed to create project" }),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Project> }) => projectApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      addToast({ type: "success", message: "Project updated" });
    },
    onError: () => addToast({ type: "error", message: "Failed to update project" }),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  return useMutation({
    mutationFn: (id: string) => projectApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      addToast({ type: "success", message: "Project deleted" });
    },
    onError: () => addToast({ type: "error", message: "Failed to delete project" }),
  });
}

export function useSubmitRtd() {
  const qc = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<RtdSubmission> }) => projectApi.submitRtd(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      addToast({ type: "success", message: "RTD submitted" });
    },
    onError: () => addToast({ type: "error", message: "Failed to submit RTD" }),
  });
}
