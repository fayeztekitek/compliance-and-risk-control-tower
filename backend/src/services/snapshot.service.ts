import { query } from "../config/database.js";
import { NotFoundError } from "../core/errors.js";

export const snapshotService = {
  async createSnapshot(roadmapId: string, label?: string) {
    // Get current roadmap state
    const roadmap = await query(`
      SELECT id, progress, milestone_status FROM roadmaps WHERE id = $1 AND deleted_at IS NULL
    `, [roadmapId]);
    if (!roadmap.rows.length) throw new NotFoundError("Roadmap", roadmapId);

    // Get current project aggregations
    const agg = await query(`
      SELECT
        COUNT(*)::int AS total_projects,
        COUNT(*) FILTER (WHERE status = 'ON_TRACK')::int AS on_track_count,
        COUNT(*) FILTER (WHERE status = 'DEVIATING')::int AS deviating_count,
        COUNT(*) FILTER (WHERE status = 'HIGH_RISK')::int AS high_risk_count,
        COALESCE(SUM(initial_budget), 0)::float AS total_budget,
        COALESCE(SUM(consumed_budget), 0)::float AS total_consumed,
        COALESCE(AVG(rtd_value), 0)::float AS avg_rtd,
        COALESCE(AVG(rtd_deviation), 0)::float AS avg_rtd_deviation
      FROM projects WHERE roadmap_id = $1 AND deleted_at IS NULL
    `, [roadmapId]);
    const a = agg.rows[0];

    // Get current project items
    const projects = await query(`
      SELECT id, name, code, status, rtd_value, rtd_deviation, slippage_md,
        test_automation_rate, go_live_readiness_state, initial_budget, consumed_budget
      FROM projects WHERE roadmap_id = $1 AND deleted_at IS NULL
    `, [roadmapId]);

    // Create snapshot
    const snap = await query(`
      INSERT INTO roadmap_snapshots (snapshot_date, label, roadmap_id, progress, milestone_status,
        total_projects, on_track_count, deviating_count, high_risk_count,
        total_budget, total_consumed, avg_rtd, avg_rtd_deviation)
      VALUES (CURRENT_DATE, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      label || null, roadmapId,
      roadmap.rows[0].progress, roadmap.rows[0].milestone_status,
      a.total_projects, a.on_track_count, a.deviating_count, a.high_risk_count,
      a.total_budget, a.total_consumed, a.avg_rtd, a.avg_rtd_deviation,
    ]);

    const snapshotId = snap.rows[0].id;

    // Insert snapshot items
    for (const p of projects.rows) {
      await query(`
        INSERT INTO roadmap_snapshot_items (snapshot_id, project_id, project_name, project_code,
          status, rtd_value, rtd_deviation, slippage_md, test_automation_rate,
          go_live_readiness_state, initial_budget, consumed_budget)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        snapshotId, p.id, p.name, p.code, p.status,
        parseFloat(p.rtd_value) || 0, parseFloat(p.rtd_deviation) || 0,
        parseFloat(p.slippage_md) || 0, parseFloat(p.test_automation_rate) || 0,
        p.go_live_readiness_state, parseFloat(p.initial_budget) || 0,
        parseFloat(p.consumed_budget) || 0,
      ]);
    }

    return this.getSnapshot(snapshotId);
  },

  async listSnapshots(roadmapId?: string) {
    const cond = roadmapId ? "WHERE roadmap_id = $1" : "";
    const params = roadmapId ? [roadmapId] : [];
    const r = await query(
      `SELECT * FROM roadmap_snapshots ${cond} ORDER BY snapshot_date DESC, created_at DESC`,
      params
    );
    return r.rows.map(row => ({
      id: row.id,
      createdAt: row.created_at,
      snapshotDate: row.snapshot_date,
      label: row.label,
      roadmapId: row.roadmap_id,
      progress: parseFloat(row.progress) || 0,
      milestoneStatus: row.milestone_status,
      totalProjects: row.total_projects,
      onTrackCount: row.on_track_count,
      deviatingCount: row.deviating_count,
      highRiskCount: row.high_risk_count,
      totalBudget: parseFloat(row.total_budget) || 0,
      totalConsumed: parseFloat(row.total_consumed) || 0,
      avgRtd: parseFloat(row.avg_rtd) || 0,
      avgRtdDeviation: parseFloat(row.avg_rtd_deviation) || 0,
    }));
  },

  async getSnapshot(id: string) {
    const r = await query("SELECT * FROM roadmap_snapshots WHERE id = $1", [id]);
    if (!r.rows.length) throw new NotFoundError("Snapshot", id);
    const s = r.rows[0];

    const items = await query(
      "SELECT * FROM roadmap_snapshot_items WHERE snapshot_id = $1 ORDER BY project_name",
      [id]
    );

    return {
      id: s.id,
      createdAt: s.created_at,
      snapshotDate: s.snapshot_date,
      label: s.label,
      roadmapId: s.roadmap_id,
      progress: parseFloat(s.progress) || 0,
      milestoneStatus: s.milestone_status,
      totalProjects: s.total_projects,
      onTrackCount: s.on_track_count,
      deviatingCount: s.deviating_count,
      highRiskCount: s.high_risk_count,
      totalBudget: parseFloat(s.total_budget) || 0,
      totalConsumed: parseFloat(s.total_consumed) || 0,
      avgRtd: parseFloat(s.avg_rtd) || 0,
      avgRtdDeviation: parseFloat(s.avg_rtd_deviation) || 0,
      items: items.rows.map(p => ({
        id: p.id,
        projectId: p.project_id,
        projectName: p.project_name,
        projectCode: p.project_code,
        status: p.status,
        rtdValue: parseFloat(p.rtd_value) || 0,
        rtdDeviation: parseFloat(p.rtd_deviation) || 0,
        slippageMd: parseFloat(p.slippage_md) || 0,
        testAutomationRate: parseFloat(p.test_automation_rate) || 0,
        goLiveReadinessState: p.go_live_readiness_state,
        initialBudget: parseFloat(p.initial_budget) || 0,
        consumedBudget: parseFloat(p.consumed_budget) || 0,
      })),
    };
  },

  async compareSnapshots(id1: string, id2: string) {
    const [snap1, snap2] = await Promise.all([
      this.getSnapshot(id1),
      this.getSnapshot(id2),
    ]);

    // Roadmap-level deltas
    const deltas = {
      progressDelta: +(snap2.progress - snap1.progress).toFixed(1),
      rtdDelta: +(snap2.avgRtd - snap1.avgRtd).toFixed(1),
      rtdDeviationDelta: +(snap2.avgRtdDeviation - snap1.avgRtdDeviation).toFixed(1),
      budgetDelta: +(snap2.totalConsumed - snap1.totalConsumed).toFixed(0),
      projectsDelta: snap2.totalProjects - snap1.totalProjects,
      onTrackDelta: snap2.onTrackCount - snap1.onTrackCount,
      deviatingDelta: snap2.deviatingCount - snap1.deviatingCount,
      highRiskDelta: snap2.highRiskCount - snap1.highRiskCount,
    };

    // Item-level changes (by project)
    const map1 = new Map(snap1.items.map(p => [p.projectId, p]));
    const map2 = new Map(snap2.items.map(p => [p.projectId, p]));

    const added = snap2.items.filter(p => !map1.has(p.projectId));
    const removed = snap1.items.filter(p => !map2.has(p.projectId));

    const changed: { projectId: string; projectName: string; field: string; from: any; to: any }[] = [];
    for (const p2 of snap2.items) {
      const p1 = map1.get(p2.projectId);
      if (!p1) continue;
      const fields: [string, keyof typeof p1, keyof typeof p2][] = [
        ["status", "status", "status"],
        ["rtdValue", "rtdValue", "rtdValue"],
        ["slippageMd", "slippageMd", "slippageMd"],
        ["goLiveReadinessState", "goLiveReadinessState", "goLiveReadinessState"],
        ["consumedBudget", "consumedBudget", "consumedBudget"],
      ];
      for (const [field, k1, k2] of fields) {
        const v1 = p1[k1]; const v2 = p2[k2];
        if (v1 !== v2) {
          changed.push({ projectId: p2.projectId, projectName: p2.projectName, field, from: v1, to: v2 });
        }
      }
    }

    return {
      snap1: { id: snap1.id, snapshotDate: snap1.snapshotDate, label: snap1.label },
      snap2: { id: snap2.id, snapshotDate: snap2.snapshotDate, label: snap2.label },
      deltas,
      added,
      removed,
      changed,
    };
  },
};
