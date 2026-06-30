import { query } from "../config/database.js";

export async function getProjectsDashboard() {
  const [stats, statusDist, goLiveDist, budgetStats] = await Promise.all([
    query(`
      SELECT
        COUNT(*)::int AS total_projects,
        COUNT(*) FILTER (WHERE status = 'ON_TRACK')::int AS on_track,
        COUNT(*) FILTER (WHERE status = 'DEVIATING')::int AS deviating,
        COUNT(*) FILTER (WHERE status = 'HIGH_RISK')::int AS high_risk,
        ROUND(AVG(rtd_value)::numeric, 1)::float AS avg_rtd,
        ROUND(AVG(rtd_deviation)::numeric, 1)::float AS avg_rtd_deviation,
        ROUND(AVG(slippage_md)::numeric, 1)::float AS avg_slippage_md,
        ROUND(AVG(test_automation_rate)::numeric, 1)::float AS avg_test_automation
      FROM projects
    `),
    query(`
      SELECT status::text AS status, COUNT(*)::int AS count
      FROM projects
      GROUP BY status
      ORDER BY count DESC
    `),
    query(`
      SELECT go_live_readiness_state::text AS state, COUNT(*)::int AS count
      FROM projects
      GROUP BY go_live_readiness_state
      ORDER BY count DESC
    `),
    query(`
      SELECT
        ROUND(SUM(initial_budget)::numeric, 0)::float AS total_budget,
        ROUND(SUM(consumed_budget)::numeric, 0)::float AS total_consumed,
        CASE WHEN SUM(initial_budget) > 0
          THEN ROUND((SUM(consumed_budget) / SUM(initial_budget) * 100)::numeric, 1)::float
          ELSE 0
        END AS utilization_pct
      FROM projects
    `),
  ]);

  return {
    kpis: {
      total_projects: stats.rows[0]?.total_projects || 0,
      on_track: stats.rows[0]?.on_track || 0,
      deviating: stats.rows[0]?.deviating || 0,
      high_risk: stats.rows[0]?.high_risk || 0,
      avg_rtd: stats.rows[0]?.avg_rtd || 0,
      avg_rtd_deviation: stats.rows[0]?.avg_rtd_deviation || 0,
      avg_slippage_md: stats.rows[0]?.avg_slippage_md || 0,
      avg_test_automation: stats.rows[0]?.avg_test_automation || 0,
      total_budget: budgetStats.rows[0]?.total_budget || 0,
      total_consumed: budgetStats.rows[0]?.total_consumed || 0,
      utilization_pct: budgetStats.rows[0]?.utilization_pct || 0,
    },
    statusDistribution: statusDist.rows,
    goLiveReadiness: goLiveDist.rows,
  };
}
