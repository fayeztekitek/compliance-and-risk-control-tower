import { query } from "../config/database.js";

export async function getRiskDashboard() {
  const [riskStats, vulnBySeverity, slaBreaches, waiversExpiring] = await Promise.all([
    query(`
      SELECT
        COUNT(*)::int AS total_vulnerabilities,
        COUNT(*) FILTER (WHERE severity = 'CRITICAL')::int AS critical,
        COUNT(*) FILTER (WHERE severity = 'HIGH')::int AS high,
        COUNT(*) FILTER (WHERE status = 'OPEN')::int AS open_vulns,
        COUNT(*) FILTER (WHERE status = 'OPEN' AND severity = 'CRITICAL')::int AS open_critical
      FROM vulnerabilities
    `),
    query(`
      SELECT severity::text, COUNT(*)::int
      FROM vulnerabilities
      GROUP BY severity
    `),
    query(`
      SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status = 'OPEN')::int AS open
      FROM sla_incidents
    `),
    query(`
      SELECT id::text, vulnerability_id, rationale, expiry_date::text
      FROM waivers
      WHERE status = 'APPROVED' AND expiry_date < NOW() + INTERVAL '14 days'
      ORDER BY expiry_date ASC
      LIMIT 5
    `),
  ]);

  return {
    kpis: {
      total_vulnerabilities: riskStats.rows[0]?.total_vulnerabilities || 0,
      critical: riskStats.rows[0]?.critical || 0,
      high: riskStats.rows[0]?.high || 0,
      open_vulns: riskStats.rows[0]?.open_vulns || 0,
      open_critical: riskStats.rows[0]?.open_critical || 0,
      total_sla_breaches: slaBreaches.rows[0]?.total || 0,
      open_sla_breaches: slaBreaches.rows[0]?.open || 0,
    },
    severityDistribution: vulnBySeverity.rows,
    waiversExpiringSoon: waiversExpiring.rows,
  };
}
