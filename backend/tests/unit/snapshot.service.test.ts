import { describe, it, expect, vi, beforeEach } from "vitest";

const mockQuery = vi.fn();
vi.mock("../../src/config/database.js", () => ({ query: mockQuery }));

describe("Snapshot Service", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("should compare two snapshots and detect deltas", async () => {
    const snap1 = {
      id: "s1", snapshot_date: "2025-01-01", label: "Jan",
      progress: 50, avg_rtd: 80, avg_rtd_deviation: 5, total_consumed: 1000,
      total_projects: 10, on_track_count: 6, deviating_count: 3, high_risk_count: 1,
    };
    const snap2 = {
      id: "s2", snapshot_date: "2025-02-01", label: "Feb",
      progress: 65, avg_rtd: 75, avg_rtd_deviation: 8, total_consumed: 1200,
      total_projects: 12, on_track_count: 7, deviating_count: 3, high_risk_count: 2,
    };

    const items1 = [
      { project_id: "p1", project_name: "Alpha", project_code: "A", status: "ON_TRACK", rtd_value: 85, rtd_deviation: 3, slippage_md: 0, test_automation_rate: 70, go_live_readiness_state: "GREEN", initial_budget: 500, consumed_budget: 300 },
      { project_id: "p2", project_name: "Beta", project_code: "B", status: "DEVIATING", rtd_value: 60, rtd_deviation: 10, slippage_md: 15, test_automation_rate: 40, go_live_readiness_state: "AMBER", initial_budget: 800, consumed_budget: 600 },
    ];
    const items2 = [
      { project_id: "p1", project_name: "Alpha", project_code: "A", status: "DEVIATING", rtd_value: 82, rtd_deviation: 5, slippage_md: 5, test_automation_rate: 72, go_live_readiness_state: "AMBER", initial_budget: 500, consumed_budget: 350 },
      { project_id: "p3", project_name: "Gamma", project_code: "G", status: "ON_TRACK", rtd_value: 90, rtd_deviation: 2, slippage_md: 0, test_automation_rate: 90, go_live_readiness_state: "GREEN", initial_budget: 300, consumed_budget: 100 },
    ];

    // compareSnapshots uses Promise.all — mockImplementation avoids ordering issues
    const data: Record<string, any> = {
      s1: { snap: snap1, items: items1 },
      s2: { snap: snap2, items: items2 },
    };
    mockQuery.mockImplementation(async (sql: string, params: any[]) => {
      if (sql.includes("roadmap_snapshots")) return { rows: [data[params[0]].snap] };
      if (sql.includes("roadmap_snapshot_items")) return { rows: data[params[0]].items };
      return { rows: [] };
    });

    const { snapshotService } = await import("../../src/services/snapshot.service.js");
    const result = await snapshotService.compareSnapshots("s1", "s2");

    expect(result.deltas.progressDelta).toBe(15);
    expect(result.deltas.rtdDelta).toBe(-5);
    expect(result.deltas.projectsDelta).toBe(2);
    expect(result.deltas.highRiskDelta).toBe(1);

    const alphaChanges = result.changed.filter((c: any) => c.projectId === "p1");
    const statusChange = alphaChanges.find((c: any) => c.field === "status");
    expect(statusChange).toBeDefined();
    expect(statusChange.from).toBe("ON_TRACK");
    expect(statusChange.to).toBe("DEVIATING");

    expect(result.removed).toHaveLength(1);
    expect(result.removed[0].projectName).toBe("Beta");

    expect(result.added).toHaveLength(1);
    expect(result.added[0].projectName).toBe("Gamma");
  });

  it("should return empty deltas when comparing same snapshot", async () => {
    const snap = { id: "s1", snapshot_date: "2025-01-01", label: "Jan", progress: 50, avg_rtd: 80, avg_rtd_deviation: 5, total_consumed: 1000, total_projects: 10, on_track_count: 6, deviating_count: 3, high_risk_count: 1 };
    const items = [{ project_id: "p1", project_name: "Alpha", project_code: "A", status: "ON_TRACK", rtd_value: 85, rtd_deviation: 3, slippage_md: 0, test_automation_rate: 70, go_live_readiness_state: "GREEN", initial_budget: 500, consumed_budget: 300 }];

    mockQuery.mockImplementation(async (sql: string, params: any[]) => {
      if (sql.includes("roadmap_snapshots")) return { rows: [snap] };
      if (sql.includes("roadmap_snapshot_items")) return { rows: items };
      return { rows: [] };
    });

    const { snapshotService } = await import("../../src/services/snapshot.service.js");
    const result = await snapshotService.compareSnapshots("s1", "s1");

    expect(result.deltas.progressDelta).toBe(0);
    expect(result.added).toHaveLength(0);
    expect(result.removed).toHaveLength(0);
    expect(result.changed).toHaveLength(0);
  });

  it("should list snapshots with correct camelCase mapping", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{
        id: "snap1", created_at: "2025-01-01T00:00:00Z", snapshot_date: "2025-01-01",
        label: "Jan", roadmap_id: "r1", progress: "50", milestone_status: "ON_TRACK",
        total_projects: 10, on_track_count: 6, deviating_count: 3, high_risk_count: 1,
        total_budget: "5000", total_consumed: "3000", avg_rtd: "80", avg_rtd_deviation: "5",
      }],
    });

    const { snapshotService } = await import("../../src/services/snapshot.service.js");
    const list = await snapshotService.listSnapshots();

    expect(list).toHaveLength(1);
    expect(list[0].id).toBe("snap1");
    expect(list[0].snapshotDate).toBe("2025-01-01");
    expect(list[0].totalProjects).toBe(10);
    expect(list[0].avgRtd).toBe(80);
  });
});
