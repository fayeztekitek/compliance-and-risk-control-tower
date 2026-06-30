import { query } from "../config/database.js";

export async function getRoadmapExecutiveDashboard() {
  const [roadmapStats, milestoneDist, projectStats, budgetStats, typeDist, overrunStats, rtdByRoadmap, latestSnapshots] =
    await Promise.all([
      // Roadmap-level KPIs
      query(`
        SELECT
          COUNT(*)::int AS total,
          ROUND(AVG(progress)::numeric, 1)::float AS avg_progress,
          ROUND(SUM(progress)::numeric, 0)::float AS total_progress
        FROM roadmaps WHERE deleted_at IS NULL
      `),
      // Milestone status distribution
      query(`
        SELECT milestone_status::text AS name, COUNT(*)::int AS value
        FROM roadmaps WHERE deleted_at IS NULL
        GROUP BY milestone_status ORDER BY value DESC
      `),
      // Project-level KPIs
      query(`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE status = 'ON_TRACK')::int AS on_track,
          COUNT(*) FILTER (WHERE status = 'DEVIATING')::int AS deviating,
          COUNT(*) FILTER (WHERE status = 'HIGH_RISK')::int AS high_risk,
          ROUND(AVG(rtd_value)::numeric, 1)::float AS avg_rtd,
          ROUND(AVG(rtd_deviation)::numeric, 1)::float AS avg_rtd_deviation
        FROM projects WHERE deleted_at IS NULL
      `),
      // Budget totals
      query(`
        SELECT
          ROUND(SUM(initial_budget)::numeric, 0)::float AS total_budget,
          ROUND(SUM(consumed_budget)::numeric, 0)::float AS total_consumed
        FROM projects WHERE deleted_at IS NULL
      `),
      // Roadmap type distribution
      query(`
        SELECT type::text AS name, COUNT(*)::int AS value
        FROM roadmaps WHERE deleted_at IS NULL
        GROUP BY type ORDER BY value DESC
      `),
      // Overrun projects (consumed > initial)
      query(`
        SELECT COUNT(*)::int AS overrun_count,
          ROUND(SUM(consumed_budget - initial_budget)::numeric, 0)::float AS total_overrun
        FROM projects WHERE deleted_at IS NULL AND consumed_budget > initial_budget
      `),
      // RTD by roadmap for per-roadmap comparison
      query(`
        SELECT r.name AS roadmap_name,
          COUNT(p.id)::int AS project_count,
          ROUND(AVG(p.rtd_value)::numeric, 1)::float AS avg_rtd,
          ROUND(AVG(p.rtd_deviation)::numeric, 1)::float AS avg_deviation,
          r.progress,
          r.milestone_status::text
        FROM roadmaps r
        LEFT JOIN projects p ON p.roadmap_id = r.id AND p.deleted_at IS NULL
        WHERE r.deleted_at IS NULL
        GROUP BY r.id, r.name, r.progress, r.milestone_status
        ORDER BY r.name
      `),
      // Latest 6 snapshot aggregations for RTD trend
      query(`
        SELECT
          TO_CHAR(snapshot_date, 'YYYY-MM') AS period,
          ROUND(AVG(avg_rtd)::numeric, 1)::float AS avg_rtd,
          ROUND(AVG(avg_rtd_deviation)::numeric, 1)::float AS avg_deviation,
          SUM(total_projects)::int AS total_projects,
          SUM(on_track_count)::int AS on_track,
          SUM(deviating_count)::int AS deviating,
          SUM(high_risk_count)::int AS high_risk
        FROM roadmap_snapshots
        GROUP BY period
        ORDER BY period DESC
        LIMIT 6
      `),
    ]);

  const rs = roadmapStats.rows[0];
  const ps = projectStats.rows[0];
  const bs = budgetStats.rows[0];
  const os = overrunStats.rows[0];
  const capacityGap = (ps?.deviating || 0) + (ps?.high_risk || 0);

  return {
    kpis: {
      totalRoadmaps: rs?.total || 0,
      avgProgress: rs?.avg_progress || 0,
      totalProjects: ps?.total || 0,
      onTrack: ps?.on_track || 0,
      deviating: ps?.deviating || 0,
      highRisk: ps?.high_risk || 0,
      capacityGap,
      capacityUtilization: ps?.total ? +((ps.on_track / ps.total * 100).toFixed(1)) : 0,
      avgRtd: ps?.avg_rtd || 0,
      avgRtdDeviation: ps?.avg_rtd_deviation || 0,
      totalBudget: bs?.total_budget || 0,
      totalConsumed: bs?.total_consumed || 0,
      burnRate: bs?.total_budget ? +((bs.total_consumed / bs.total_budget * 100).toFixed(1)) : 0,
      overrunCount: os?.overrun_count || 0,
      totalOverrun: os?.total_overrun || 0,
    },
    milestoneStatusDistribution: milestoneDist.rows,
    typeDistribution: typeDist.rows,
    rtdByRoadmap: rtdByRoadmap.rows,
    snapshotTrend: latestSnapshots.rows.reverse(),
  };
}

export async function getRoadmapRtdTrend(roadmapId: string) {
  const snapshots = await query(`
    SELECT
      snapshot_date,
      avg_rtd, avg_rtd_deviation,
      total_projects, on_track_count, deviating_count, high_risk_count,
      total_budget, total_consumed
    FROM roadmap_snapshots
    WHERE roadmap_id = $1
    ORDER BY snapshot_date ASC
  `, [roadmapId]);

  return snapshots.rows.map(r => ({
    date: r.snapshot_date,
    avgRtd: parseFloat(r.avg_rtd) || 0,
    avgDeviation: parseFloat(r.avg_rtd_deviation) || 0,
    totalProjects: r.total_projects,
    onTrack: r.on_track_count,
    deviating: r.deviating_count,
    highRisk: r.high_risk_count,
    budget: parseFloat(r.total_budget) || 0,
    consumed: parseFloat(r.total_consumed) || 0,
  }));
}
