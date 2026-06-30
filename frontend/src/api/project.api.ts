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

  planning: "GREEN" | "AMBER" | "RED";
  quality: "GREEN" | "AMBER" | "RED";
  scope: "GREEN" | "AMBER" | "RED";
  governance: "GREEN" | "AMBER" | "RED";
  security: "GREEN" | "AMBER" | "RED";
  clientMood: "GREEN" | "AMBER" | "RED";
  resources: "GREEN" | "AMBER" | "RED";
  globalRisk: "GREEN" | "AMBER" | "RED";
  executiveMessage: string | null;
  planningTrend: string;
  qualityTrend: string;
  scopeTrend: string;
  governanceTrend: string;
  securityTrend: string;
  clientMoodTrend: string;
  resourcesTrend: string;
  globalRiskTrend: string;
}

export interface ProjectMilestone {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: string;
  createdAt: string;
}

export interface ProjectRisk {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  severity: "GREEN" | "AMBER" | "RED";
  category: string | null;
  status: string;
  owner: string | null;
  createdAt: string;
}

export interface StatusSnapshot {
  id: string;
  projectId: string;
  snapshotDate: string;
  planning: string; quality: string; scope: string;
  governance: string; security: string; clientMood: string;
  resources: string; globalRisk: string;
  executiveMessage: string | null;
  createdAt: string;
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
  // Milestones
  listMilestones(projectId: string) {
    return apiClient.get<{ data: ProjectMilestone[] }>(`/api/projects/${projectId}/milestones`);
  },
  createMilestone(projectId: string, data: Partial<ProjectMilestone>) {
    return apiClient.post<{ data: ProjectMilestone }>(`/api/projects/${projectId}/milestones`, data);
  },
  updateMilestone(id: string, data: Partial<ProjectMilestone>) {
    return apiClient.patch<{ data: ProjectMilestone }>(`/api/milestones/${id}`, data);
  },
  deleteMilestone(id: string) {
    return apiClient.delete(`/api/milestones/${id}`);
  },
  // Risks
  listRisks(projectId: string) {
    return apiClient.get<{ data: ProjectRisk[] }>(`/api/projects/${projectId}/risks`);
  },
  createRisk(projectId: string, data: Partial<ProjectRisk>) {
    return apiClient.post<{ data: ProjectRisk }>(`/api/projects/${projectId}/risks`, data);
  },
  updateRisk(id: string, data: Partial<ProjectRisk>) {
    return apiClient.patch<{ data: ProjectRisk }>(`/api/risks/${id}`, data);
  },
  deleteRisk(id: string) {
    return apiClient.delete(`/api/risks/${id}`);
  },
  // Status Snapshots
  listStatusSnapshots(projectId: string) {
    return apiClient.get<{ data: StatusSnapshot[] }>(`/api/projects/${projectId}/status-snapshots`);
  },
  createStatusSnapshot(projectId: string) {
    return apiClient.post<{ data: StatusSnapshot }>(`/api/projects/${projectId}/status-snapshots`);
  },
  // SteerCo Meetings
  listSteercoMeetings(projectId?: string) {
    const url = projectId ? `/api/projects/${projectId}/steerco-meetings` : "/api/steerco-meetings";
    return apiClient.get<{ data: SteercoMeeting[] }>(url);
  },
  getSteercoMeeting(id: string) {
    return apiClient.get<{ data: SteercoMeeting }>(`/api/steerco-meetings/${id}`);
  },
  createSteercoMeeting(projectId: string, data: Partial<SteercoMeeting>) {
    return apiClient.post<{ data: SteercoMeeting }>(`/api/projects/${projectId}/steerco-meetings`, data);
  },
  updateSteercoMeeting(id: string, data: Partial<SteercoMeeting>) {
    return apiClient.patch<{ data: SteercoMeeting }>(`/api/steerco-meetings/${id}`, data);
  },
  deleteSteercoMeeting(id: string) {
    return apiClient.delete(`/api/steerco-meetings/${id}`);
  },
  // SteerCo Decisions
  listSteercoDecisions(meetingId: string) {
    return apiClient.get<{ data: SteercoDecision[] }>(`/api/steerco-meetings/${meetingId}/decisions`);
  },
  createSteercoDecision(meetingId: string, data: Partial<SteercoDecision>) {
    return apiClient.post<{ data: SteercoDecision }>(`/api/steerco-meetings/${meetingId}/decisions`, data);
  },
  updateSteercoDecision(id: string, data: Partial<SteercoDecision>) {
    return apiClient.patch<{ data: SteercoDecision }>(`/api/steerco-decisions/${id}`, data);
  },
  deleteSteercoDecision(id: string) {
    return apiClient.delete(`/api/steerco-decisions/${id}`);
  },
  // SteerCo Action Items
  listSteercoActionItems(meetingId: string) {
    return apiClient.get<{ data: SteercoActionItem[] }>(`/api/steerco-meetings/${meetingId}/action-items`);
  },
  createSteercoActionItem(meetingId: string, data: Partial<SteercoActionItem>) {
    return apiClient.post<{ data: SteercoActionItem }>(`/api/steerco-meetings/${meetingId}/action-items`, data);
  },
  updateSteercoActionItem(id: string, data: Partial<SteercoActionItem>) {
    return apiClient.patch<{ data: SteercoActionItem }>(`/api/steerco-action-items/${id}`, data);
  },
  deleteSteercoActionItem(id: string) {
    return apiClient.delete(`/api/steerco-action-items/${id}`);
  },
};

export interface SteercoMeeting {
  id: string;
  projectId: string;
  title: string;
  date: string;
  time: string | null;
  status: string;
  notes: string | null;
  participants: string[];
  createdAt: string;
}

export interface SteercoDecision {
  id: string;
  meetingId: string;
  title: string;
  description: string | null;
  owner: string | null;
  dueDate: string | null;
  status: string;
  createdAt: string;
}

export interface SteercoActionItem {
  id: string;
  meetingId: string;
  title: string;
  assignee: string | null;
  dueDate: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
}

export interface EnrichedRoadmap extends Roadmap {
  projectCount: number;
  onTrackCount: number;
  deviatingCount: number;
  highRiskCount: number;
  totalBudget: number;
  totalConsumed: number;
  avgRtd: number;
  avgRtdDeviation: number;
}

export interface RoadmapProjectSummary {
  id: string;
  name: string;
  code: string;
  manager: string;
  initialBudget: number;
  consumedBudget: number;
  status: string;
  rtdValue: number;
  rtdDeviation: number;
  slippageMd: number;
  testAutomationRate: number;
  goLiveReadinessState: string;
}

export interface RoadmapDetailData extends Roadmap {
  projects: RoadmapProjectSummary[];
}

export const roadmapMonitoringApi = {
  list() {
    return apiClient.get<{ data: EnrichedRoadmap[] }>("/api/roadmaps/enriched");
  },
  getDetail(id: string) {
    return apiClient.get<{ data: RoadmapDetailData }>(`/api/roadmaps/${id}/detail`);
  },
};
