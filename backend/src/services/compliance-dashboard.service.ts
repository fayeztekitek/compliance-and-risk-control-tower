import { query } from "../config/database.js";
import { logger } from "../core/logger.js";

export async function getComplianceDashboard() {
  let controlStats = { rows: [{ total_controls: 0, passed: 0, failed: 0, untested: 0 }] };
  let upcomingDeadlines = { rows: [] as any[] };

  try {
    [controlStats] = await Promise.all([
      query(`
        SELECT
          COUNT(*)::int AS total_controls,
          COUNT(*) FILTER (WHERE last_test_result = 'pass')::int AS passed,
          COUNT(*) FILTER (WHERE last_test_result = 'fail')::int AS failed,
          COUNT(*) FILTER (WHERE last_test_result IS NULL)::int AS untested
        FROM compliance_controls
      `),
    ]);
  } catch (e: any) {
    if (e?.code === "42P01") {
      logger.warn("compliance_controls table does not exist yet — returning zeros");
    } else {
      throw e;
    }
  }

  let upcoming = { rows: [] as any[] };
  try {
    upcoming = await query(`
      SELECT id::text, title, 'control_test' AS type, NULL AS due_date
      FROM compliance_controls WHERE last_test_result IS NULL OR last_test_result = 'fail'
      LIMIT 5
    `);
    upcomingDeadlines = upcoming;
  } catch (e: any) {
    if (e?.code !== "42P01") throw e;
  }

  const [breachStats, classificationStats] = await Promise.all([
    query(`
      SELECT
        COUNT(*)::int AS total_breaches,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days')::int AS last_30d,
        COUNT(*) FILTER (WHERE status = 'OPEN')::int AS open_breaches
      FROM sla_incidents
    `),
    query(`
      SELECT COALESCE(framework::text, 'Unclassified') AS classification, COUNT(*)::int AS count
      FROM compliance_classification
      GROUP BY framework
      ORDER BY COUNT(*) DESC
    `),
  ]);

  return {
    kpis: {
      total_controls: controlStats.rows[0]?.total_controls || 0,
      passed: controlStats.rows[0]?.passed || 0,
      failed: controlStats.rows[0]?.failed || 0,
      untested: controlStats.rows[0]?.untested || 0,
      pass_rate: controlStats.rows[0]?.total_controls > 0
        ? Math.round((controlStats.rows[0].passed / controlStats.rows[0].total_controls) * 100)
        : 0,
      total_breaches: breachStats.rows[0]?.total_breaches || 0,
      recent_breaches: breachStats.rows[0]?.last_30d || 0,
      open_breaches: breachStats.rows[0]?.open_breaches || 0,
    },
    classificationDistribution: classificationStats.rows,
    upcomingDeadlines: upcomingDeadlines.rows,
  };
}
