import { query } from "../config/database.js";

export async function getProjectsExecutiveDashboard() {
  const [kpis, ragHeatmap, riskSummary, milestoneSummary, snapshotTrend, budgetByProject] =
    await Promise.all([
      // KPIs
      query(`
        SELECT
          COUNT(*)::int AS total_projects,
          COUNT(*) FILTER (WHERE status = 'ON_TRACK')::int AS on_track,
          COUNT(*) FILTER (WHERE status = 'DEVIATING')::int AS deviating,
          COUNT(*) FILTER (WHERE status = 'HIGH_RISK')::int AS high_risk,
          ROUND(AVG(rtd_value)::numeric, 1)::float AS avg_rtd,
          ROUND(AVG(rtd_deviation)::numeric, 1)::float AS avg_rtd_deviation,
          ROUND(AVG(slippage_md)::numeric, 1)::float AS avg_slippage_md,
          ROUND(AVG(test_automation_rate)::numeric, 1)::float AS avg_test_automation,
          ROUND(SUM(initial_budget)::numeric, 0)::float AS total_budget,
          ROUND(SUM(consumed_budget)::numeric, 0)::float AS total_consumed,
          COUNT(*) FILTER (WHERE consumed_budget > initial_budget)::int AS overrun_count,
          COUNT(*) FILTER (WHERE go_live_readiness_state = 'BLOCKED')::int AS blocked_count
        FROM projects WHERE deleted_at IS NULL
      `),
      // RAG Heatmap — per-project RAG values + project info
      query(`
        SELECT id, name, code, status, planning, quality, scope, governance,
          security, client_mood, resources, global_risk, go_live_readiness_state,
          consumed_budget, initial_budget, rtd_value, slippage_md, test_automation_rate
        FROM projects WHERE deleted_at IS NULL
        ORDER BY name
      `),
      // Risk summary across all projects
      query(`
        SELECT severity::text, COUNT(*)::int AS count
        FROM project_risks
        GROUP BY severity ORDER BY severity
      `),
      // Milestone summary across all projects
      query(`
        SELECT status::text, COUNT(*)::int AS count
        FROM project_milestones
        GROUP BY status ORDER BY status
      `),
      // Latest 6 status snapshots (aggregated across all projects)
      query(`
        SELECT
          TO_CHAR(snapshot_date, 'YYYY-MM') AS period,
          COUNT(*)::int AS snapshot_count,
          COUNT(*) FILTER (WHERE planning = 'RED' OR quality = 'RED' OR scope = 'RED'
            OR governance = 'RED' OR security = 'RED' OR client_mood = 'RED'
            OR resources = 'RED' OR global_risk = 'RED')::int AS red_flag_count
        FROM project_status_snapshots
        GROUP BY period
        ORDER BY period DESC
        LIMIT 6
      `),
      // Budget burn per project (top 10 by consumed)
      query(`
        SELECT name, initial_budget, consumed_budget, status
        FROM projects WHERE deleted_at IS NULL
        ORDER BY consumed_budget DESC LIMIT 10
      `),
    ]);

  const k = kpis.rows[0];
  const utilization = k?.total_budget > 0 ? +((k.total_consumed / k.total_budget * 100).toFixed(1)) : 0;
  const capacityGap = (k?.deviating || 0) + (k?.high_risk || 0);

  return {
    kpis: {
      totalProjects: k?.total_projects || 0,
      onTrack: k?.on_track || 0,
      deviating: k?.deviating || 0,
      highRisk: k?.high_risk || 0,
      capacityGap,
      capacityUtilization: k?.total_projects ? +((k.on_track / k.total_projects * 100).toFixed(1)) : 0,
      avgRtd: k?.avg_rtd || 0,
      avgRtdDeviation: k?.avg_rtd_deviation || 0,
      avgSlippageMd: k?.avg_slippage_md || 0,
      avgTestAutomation: k?.avg_test_automation || 0,
      totalBudget: k?.total_budget || 0,
      totalConsumed: k?.total_consumed || 0,
      utilizationPct: utilization,
      overrunCount: k?.overrun_count || 0,
      blockedCount: k?.blocked_count || 0,
    },
    ragHeatmap: ragHeatmap.rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      code: r.code,
      status: r.status,
      planning: r.planning, quality: r.quality, scope: r.scope,
      governance: r.governance, security: r.security, clientMood: r.client_mood,
      resources: r.resources, globalRisk: r.global_risk,
      goLive: r.go_live_readiness_state,
      budgetBurn: r.initial_budget > 0 ? +((r.consumed_budget / r.initial_budget * 100).toFixed(0)) : 0,
      rtd: parseFloat(r.rtd_value) || 0,
      slippage: parseFloat(r.slippage_md) || 0,
      testAutomation: parseFloat(r.test_automation_rate) || 0,
    })),
    riskSummary: riskSummary.rows,
    milestoneSummary: milestoneSummary.rows,
    snapshotTrend: snapshotTrend.rows.reverse(),
    budgetByProject: budgetByProject.rows.map((r: any) => ({
      name: r.name,
      initialBudget: parseFloat(r.initial_budget) || 0,
      consumedBudget: parseFloat(r.consumed_budget) || 0,
      status: r.status,
      burnRate: r.initial_budget > 0 ? +((r.consumed_budget / r.initial_budget * 100).toFixed(0)) : 0,
    })),
  };
}

export async function getProjectDashboard(projectId: string) {
  const [project, milestones, risks, snapshots] = await Promise.all([
    query("SELECT * FROM projects WHERE id = $1 AND deleted_at IS NULL", [projectId]),
    query("SELECT status::text, COUNT(*)::int AS count FROM project_milestones WHERE project_id = $1 GROUP BY status", [projectId]),
    query("SELECT severity::text, COUNT(*)::int AS count FROM project_risks WHERE project_id = $1 GROUP BY severity", [projectId]),
    query(`
      SELECT snapshot_date, planning, quality, scope, governance, security, client_mood, resources, global_risk
      FROM project_status_snapshots WHERE project_id = $1
      ORDER BY snapshot_date ASC
    `, [projectId]),
  ]);

  if (!project.rows.length) return null;

  return {
    milestonesByStatus: milestones.rows,
    risksBySeverity: risks.rows,
    ragTrend: snapshots.rows.map((r: any) => ({
      date: r.snapshot_date,
      planning: r.planning, quality: r.quality, scope: r.scope,
      governance: r.governance, security: r.security, clientMood: r.client_mood,
      resources: r.resources, globalRisk: r.global_risk,
    })),
  };
}
