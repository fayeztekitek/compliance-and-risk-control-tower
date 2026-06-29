import { query } from "../config/database.js";

export async function getCommitteesDashboard() {
  const [committeeStats, decisionStats, upcomingCommittees, recentDecisions] = await Promise.all([
    query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'PLANNED')::int AS planned,
        COUNT(*) FILTER (WHERE status = 'HELD')::int AS held,
        COUNT(*) FILTER (WHERE status = 'CANCELLED')::int AS cancelled,
        COUNT(*) FILTER (WHERE type = 'VEG_COMMITTEE')::int AS veg_committee,
        COUNT(*) FILTER (WHERE type = 'VULNERABILITY_COMMITTEE')::int AS vuln_committee,
        COUNT(*) FILTER (WHERE type = 'SAAS_STEERING')::int AS saas_steering,
        COUNT(*) FILTER (WHERE type = 'EXECUTIVE_SECURITY')::int AS exec_security,
        COUNT(*) FILTER (WHERE type = 'EXECUTIVE_ARBITRATION')::int AS exec_arbitration
      FROM committees
    `),
    query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE outcome = 'APPROVED')::int AS approved,
        COUNT(*) FILTER (WHERE outcome = 'REJECTED')::int AS rejected,
        COUNT(*) FILTER (WHERE outcome = 'DEFERRED')::int AS deferred
      FROM committee_decisions
    `),
    query(`
      SELECT id::text, name, date::text, type, status
      FROM committees
      WHERE status = 'PLANNED' AND date >= CURRENT_DATE AND date <= CURRENT_DATE + INTERVAL '30 days'
      ORDER BY date ASC
      LIMIT 5
    `),
    query(`
      SELECT cd.id::text, cd.title, cd.outcome, c.name AS committee_name, cd.created_at::text
      FROM committee_decisions cd
      JOIN committees c ON c.id = cd.committee_id
      ORDER BY cd.created_at DESC
      LIMIT 5
    `),
  ]);

  return {
    kpis: {
      total_committees: committeeStats.rows[0]?.total || 0,
      planned: committeeStats.rows[0]?.planned || 0,
      held: committeeStats.rows[0]?.held || 0,
      cancelled: committeeStats.rows[0]?.cancelled || 0,
      veg_committee: committeeStats.rows[0]?.veg_committee || 0,
      vuln_committee: committeeStats.rows[0]?.vuln_committee || 0,
      saas_steering: committeeStats.rows[0]?.saas_steering || 0,
      exec_security: committeeStats.rows[0]?.exec_security || 0,
      exec_arbitration: committeeStats.rows[0]?.exec_arbitration || 0,
      total_decisions: decisionStats.rows[0]?.total || 0,
      approved: decisionStats.rows[0]?.approved || 0,
      rejected: decisionStats.rows[0]?.rejected || 0,
      deferred: decisionStats.rows[0]?.deferred || 0,
    },
    upcomingCommittees: upcomingCommittees.rows,
    recentDecisions: recentDecisions.rows,
  };
}
