import { apiClient } from "./client";

export interface SnapshotSummary {
  id: string;
  createdAt: string;
  snapshotDate: string;
  label: string | null;
  roadmapId: string;
  progress: number;
  milestoneStatus: string;
  totalProjects: number;
  onTrackCount: number;
  deviatingCount: number;
  highRiskCount: number;
  totalBudget: number;
  totalConsumed: number;
  avgRtd: number;
  avgRtdDeviation: number;
}

export interface SnapshotItem {
  id: string;
  projectId: string;
  projectName: string;
  projectCode: string;
  status: string;
  rtdValue: number;
  rtdDeviation: number;
  slippageMd: number;
  testAutomationRate: number;
  goLiveReadinessState: string;
  initialBudget: number;
  consumedBudget: number;
}

export interface SnapshotDetail extends SnapshotSummary {
  items: SnapshotItem[];
}

export interface SnapshotDeltas {
  progressDelta: number;
  rtdDelta: number;
  rtdDeviationDelta: number;
  budgetDelta: number;
  projectsDelta: number;
  onTrackDelta: number;
  deviatingDelta: number;
  highRiskDelta: number;
}

export interface SnapshotChange {
  projectId: string;
  projectName: string;
  field: string;
  from: any;
  to: any;
}

export interface SnapshotComparison {
  snap1: { id: string; snapshotDate: string; label: string | null };
  snap2: { id: string; snapshotDate: string; label: string | null };
  deltas: SnapshotDeltas;
  added: SnapshotItem[];
  removed: SnapshotItem[];
  changed: SnapshotChange[];
}

export const snapshotApi = {
  list(roadmapId?: string) {
    return apiClient.get<{ data: SnapshotSummary[] }>("/api/snapshots", { params: { roadmapId } });
  },
  get(id: string) {
    return apiClient.get<{ data: SnapshotDetail }>(`/api/snapshots/${id}`);
  },
  create(roadmapId: string, label?: string) {
    return apiClient.post<{ data: SnapshotDetail }>("/api/snapshots", { roadmapId, label });
  },
  compare(id1: string, id2: string) {
    return apiClient.get<{ data: SnapshotComparison }>(`/api/snapshots/compare/${id1}/${id2}`);
  },
};
