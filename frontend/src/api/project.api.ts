import { apiClient } from "./client";

export interface Project {
  id: string;
  name: string;
  code: string;
  manager: string;
  initialBudget: number;
  consumedBudget: number;
  roadmapId: string;
  status: "ON_TRACK" | "DEVIATING" | "HIGH_RISK";
  rtdValue: number;
  rtdDeviation: number;
  slippageMd: number;
  testAutomationRate: number;
  goLiveReadinessState: "READY" | "RISKY" | "BLOCKED";
  createdAt?: string;
}

export interface Roadmap {
  id: string;
  name: string;
  type: "STRATEGIC" | "BUDGETARY" | "REGULATORY";
  progress: number;
  targetDate: string;
  milestoneStatus: "ON_TIME" | "DELAYED" | "CRITICAL";
  leadOwner: string;
}

export interface RtdSubmission {
  reviewMonth: string;
  declaredRtd: number;
  actualConsumed: number;
  variance: number;
  comments?: string;
  submittedBy?: string;
}

export interface ProjectListParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export const projectApi = {
  list(params?: ProjectListParams) {
    return apiClient.get<PaginatedResponse<Project>>("/api/projects", { params });
  },
  getById(id: string) {
    return apiClient.get<{ data: Project }>(`/api/projects/${id}`);
  },
  create(data: Partial<Project>) {
    return apiClient.post<{ data: Project }>("/api/projects", data);
  },
  update(id: string, data: Partial<Project>) {
    return apiClient.patch<{ data: Project }>(`/api/projects/${id}`, data);
  },
  delete(id: string) {
    return apiClient.delete<{ data: { success: boolean } }>(`/api/projects/${id}`);
  },
  submitRtd(id: string, data: Partial<RtdSubmission>) {
    return apiClient.post<{ data: RtdSubmission }>(`/api/projects/${id}/rtd`, data);
  },
  listRoadmaps() {
    return apiClient.get<{ data: Roadmap[] }>("/api/roadmaps");
  },
};
