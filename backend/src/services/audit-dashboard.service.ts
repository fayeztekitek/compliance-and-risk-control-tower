import { query } from "../config/database.js";

export async function getAuditDashboard() {
  const [auditStats, findingStats, capaStats, upcomingAudits, recentFindings] = await Promise.all([
    query(`
      SELECT
        COUNT(*)::int AS total_audits,
        COUNT(*) FILTER (WHERE status = 'IN_PROGRESS')::int AS in_progress,
        COUNT(*) FILTER (WHERE status = 'PLANNED')::int AS planned,
        COUNT(*) FILTER (WHERE status = 'COMPLETED')::int AS completed
      FROM audits
    `),
    query(`
      SELECT
        COUNT(*)::int AS total_findings,
        COUNT(*) FILTER (WHERE severity = 'CRITICAL')::int AS critical,
        COUNT(*) FILTER (WHERE severity = 'HIGH')::int AS high,
        COUNT(*) FILTER (WHERE status = 'OPEN')::int AS open
      FROM audit_findings
    `),
    query(`
      SELECT
        COUNT(*)::int AS total_capa,
        COUNT(*) FILTER (WHERE status IN ('NOT_STARTED', 'IN_PROGRESS', 'OVERDUE'))::int AS open_capa,
        COUNT(*) FILTER (WHERE status = 'COMPLETED')::int AS completed_capa
      FROM corrective_actions
    `),
    query(`
      SELECT id::text, title, date::text AS scheduled_date, status
      FROM audits
      WHERE status IN ('PLANNED', 'IN_PROGRESS')
      ORDER BY date ASC
      LIMIT 5
    `),
    query(`
      SELECT af.id::text, af.title, af.severity, af.status, a.title AS audit_title
      FROM audit_findings af
      JOIN audits a ON a.id = af.audit_id
      WHERE af.status = 'OPEN'
      ORDER BY af.created_at DESC
      LIMIT 5
    `),
  ]);

  return {
    kpis: {
      total_audits: auditStats.rows[0]?.total_audits || 0,
      in_progress: auditStats.rows[0]?.in_progress || 0,
      planned: auditStats.rows[0]?.planned || 0,
      completed: auditStats.rows[0]?.completed || 0,
      total_findings: findingStats.rows[0]?.total_findings || 0,
      critical_findings: findingStats.rows[0]?.critical || 0,
      high_findings: findingStats.rows[0]?.high || 0,
      open_findings: findingStats.rows[0]?.open || 0,
      total_capa: capaStats.rows[0]?.total_capa || 0,
      open_capa: capaStats.rows[0]?.open_capa || 0,
      completed_capa: capaStats.rows[0]?.completed_capa || 0,
    },
    upcomingAudits: upcomingAudits.rows,
    recentFindings: recentFindings.rows,
  };
}
