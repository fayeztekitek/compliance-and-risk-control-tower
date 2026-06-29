import { query } from "../config/database.js";

export async function getSaaSDashboard() {
  const [appStats, lifecycleDist, gdprDist, privacyStatus, steeringStats] = await Promise.all([
    query(`
      SELECT
        COUNT(*)::int AS total,
        ROUND(AVG(go_live_readiness_score)::numeric, 1)::float AS avg_readiness
      FROM saas_applications
    `),
    query(`
      SELECT lifecycle_stage::text, COUNT(*)::int AS count
      FROM saas_applications
      GROUP BY lifecycle_stage
      ORDER BY count DESC
    `),
    query(`
      SELECT gdpr_risk_impact::text AS risk_level, COUNT(*)::int AS count
      FROM saas_applications
      GROUP BY gdpr_risk_impact
      ORDER BY count DESC
    `),
    query(`
      SELECT privacy_design_status::text AS status, COUNT(*)::int AS count
      FROM saas_applications
      GROUP BY privacy_design_status
      ORDER BY count DESC
    `),
    query(`
      SELECT
        COUNT(*) FILTER (WHERE steering_check_passed = true)::int AS passed,
        COUNT(*) FILTER (WHERE steering_check_passed = false)::int AS failed
      FROM saas_applications
    `),
  ]);

  return {
    kpis: {
      total_apps: appStats.rows[0]?.total || 0,
      avg_readiness: appStats.rows[0]?.avg_readiness || 0,
      onboarding: lifecycleDist.rows.find((r: any) => r.lifecycle_stage === "ONBOARDING")?.count || 0,
      go_live: lifecycleDist.rows.find((r: any) => r.lifecycle_stage === "GO_LIVE")?.count || 0,
      offboarding: lifecycleDist.rows.find((r: any) => r.lifecycle_stage === "OFFBOARDING")?.count || 0,
      gdpr_low: gdprDist.rows.find((r: any) => r.risk_level === "LOW")?.count || 0,
      gdpr_medium: gdprDist.rows.find((r: any) => r.risk_level === "MEDIUM")?.count || 0,
      gdpr_high: gdprDist.rows.find((r: any) => r.risk_level === "HIGH")?.count || 0,
      privacy_compliant: privacyStatus.rows.find((r: any) => r.status === "COMPLIANT")?.count || 0,
      privacy_pending: privacyStatus.rows.find((r: any) => r.status === "PENDING")?.count || 0,
      privacy_non_compliant: privacyStatus.rows.find((r: any) => r.status === "NON_COMPLIANT")?.count || 0,
      steering_passed: steeringStats.rows[0]?.passed || 0,
      steering_failed: steeringStats.rows[0]?.failed || 0,
    },
    lifecycleDistribution: lifecycleDist.rows,
    gdprRiskDistribution: gdprDist.rows,
    privacyDesignStatus: privacyStatus.rows,
  };
}
