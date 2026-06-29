import { query } from "../config/database.js";

export async function getRoadmapsDashboard() {
  const [roadmapStats, milestoneDist, projectStats, budgetStats, goLiveDist] = await Promise.all([
    query(`
      SELECT
        COUNT(*)::int AS total,
        ROUND(AVG(progress)::numeric, 1)::float AS avg_progress,
        COUNT(*) FILTER (WHERE type = 'STRATEGIC')::int AS strategic,
        COUNT(*) FILTER (WHERE type = 'BUDGETARY')::int AS budgetary,
        COUNT(*) FILTER (WHERE type = 'REGULATORY')::int AS regulatory
      FROM roadmaps
    `),
    query(`
      SELECT milestone_status::text AS status, COUNT(*)::int AS count
      FROM roadmaps
      GROUP BY milestone_status
      ORDER BY count DESC
    `),
    query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'ON_TRACK')::int AS on_track,
        COUNT(*) FILTER (WHERE status = 'DEVIATING')::int AS deviating,
        COUNT(*) FILTER (WHERE status = 'HIGH_RISK')::int AS high_risk,
        ROUND(AVG(rtd_value)::numeric, 1)::float AS avg_rtd,
        ROUND(AVG(rtd_deviation)::numeric, 1)::float AS avg_rtd_deviation
      FROM projects
    `),
    query(`
      SELECT
        ROUND(SUM(initial_budget)::numeric, 0)::float AS total_budget,
        ROUND(SUM(consumed_budget)::numeric, 0)::float AS total_consumed
      FROM projects
    `),
    query(`
      SELECT go_live_readiness_state::text AS state, COUNT(*)::int AS count
      FROM projects
      GROUP BY go_live_readiness_state
      ORDER BY count DESC
    `),
  ]);

  return {
    kpis: {
      total_roadmaps: roadmapStats.rows[0]?.total || 0,
      avg_progress: roadmapStats.rows[0]?.avg_progress || 0,
      strategic: roadmapStats.rows[0]?.strategic || 0,
      budgetary: roadmapStats.rows[0]?.budgetary || 0,
      regulatory: roadmapStats.rows[0]?.regulatory || 0,
      on_time: milestoneDist.rows.find((r: any) => r.status === "ON_TIME")?.count || 0,
      delayed: milestoneDist.rows.find((r: any) => r.status === "DELAYED")?.count || 0,
      critical: milestoneDist.rows.find((r: any) => r.status === "CRITICAL")?.count || 0,
      total_projects: projectStats.rows[0]?.total || 0,
      on_track: projectStats.rows[0]?.on_track || 0,
      deviating: projectStats.rows[0]?.deviating || 0,
      high_risk: projectStats.rows[0]?.high_risk || 0,
      avg_rtd: projectStats.rows[0]?.avg_rtd || 0,
      avg_rtd_deviation: projectStats.rows[0]?.avg_rtd_deviation || 0,
      total_budget: budgetStats.rows[0]?.total_budget || 0,
      total_consumed: budgetStats.rows[0]?.total_consumed || 0,
    },
    milestoneStatusDistribution: milestoneDist.rows,
    projectStatusDistribution: projectStats.rows,
    budgetStats: budgetStats.rows,
    goLiveReadiness: goLiveDist.rows,
  };
}
