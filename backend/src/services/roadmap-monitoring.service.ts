import { query } from "../config/database.js";

export async function getEnrichedRoadmaps() {
  const roadmaps = await query(`
    SELECT
      r.id, r.created_at, r.updated_at,
      r.name, r.type, r.progress, r.target_date,
      r.milestone_status, r.lead_owner
    FROM roadmaps r
    WHERE r.deleted_at IS NULL
    ORDER BY r.target_date ASC
  `);

  const roadmapIds = roadmaps.rows.map((r: any) => r.id);
  if (roadmapIds.length === 0) return [];

  const projectAggs = await query(`
    SELECT
      p.roadmap_id,
      COUNT(*)::int AS project_count,
      COUNT(*) FILTER (WHERE p.status = 'ON_TRACK')::int AS on_track_count,
      COUNT(*) FILTER (WHERE p.status = 'DEVIATING')::int AS deviating_count,
      COUNT(*) FILTER (WHERE p.status = 'HIGH_RISK')::int AS high_risk_count,
      ROUND(SUM(p.initial_budget)::numeric, 0)::float AS total_budget,
      ROUND(SUM(p.consumed_budget)::numeric, 0)::float AS total_consumed,
      ROUND(AVG(p.rtd_value)::numeric, 1)::float AS avg_rtd,
      ROUND(AVG(p.rtd_deviation)::numeric, 1)::float AS avg_rtd_deviation
    FROM projects p
    WHERE p.roadmap_id = ANY($1) AND p.deleted_at IS NULL
    GROUP BY p.roadmap_id
  `, [roadmapIds]);

  const aggMap = new Map(projectAggs.rows.map((r: any) => [r.roadmap_id, r]));

  return roadmaps.rows.map((r: any) => {
    const agg = aggMap.get(r.id) || {};
    return {
      id: r.id,
      name: r.name,
      type: r.type,
      progress: parseFloat(r.progress) || 0,
      targetDate: r.target_date,
      milestoneStatus: r.milestone_status,
      leadOwner: r.lead_owner,
      projectCount: agg.project_count || 0,
      onTrackCount: agg.on_track_count || 0,
      deviatingCount: agg.deviating_count || 0,
      highRiskCount: agg.high_risk_count || 0,
      totalBudget: agg.total_budget || 0,
      totalConsumed: agg.total_consumed || 0,
      avgRtd: agg.avg_rtd || 0,
      avgRtdDeviation: agg.avg_rtd_deviation || 0,
    };
  });
}

export async function getRoadmapDetail(id: string) {
  const r = await query(`
    SELECT id, name, type, progress, target_date, milestone_status, lead_owner
    FROM roadmaps WHERE id = $1 AND deleted_at IS NULL
  `, [id]);
  if (!r.rows.length) return null;

  const roadmap = r.rows[0];
  const projects = await query(`
    SELECT
      p.id, p.name, p.code, p.manager,
      p.initial_budget, p.consumed_budget,
      p.status, p.rtd_value, p.rtd_deviation,
      p.slippage_md, p.test_automation_rate, p.go_live_readiness_state
    FROM projects p
    WHERE p.roadmap_id = $1 AND p.deleted_at IS NULL
    ORDER BY p.created_at DESC
  `, [id]);

  return {
    id: roadmap.id,
    name: roadmap.name,
    type: roadmap.type,
    progress: parseFloat(roadmap.progress) || 0,
    targetDate: roadmap.target_date,
    milestoneStatus: roadmap.milestone_status,
    leadOwner: roadmap.lead_owner,
    projects: projects.rows.map((p: any) => ({
      id: p.id,
      name: p.name,
      code: p.code,
      manager: p.manager,
      initialBudget: parseFloat(p.initial_budget) || 0,
      consumedBudget: parseFloat(p.consumed_budget) || 0,
      status: p.status,
      rtdValue: parseFloat(p.rtd_value) || 0,
      rtdDeviation: parseFloat(p.rtd_deviation) || 0,
      slippageMd: parseFloat(p.slippage_md) || 0,
      testAutomationRate: parseFloat(p.test_automation_rate) || 0,
      goLiveReadinessState: p.go_live_readiness_state,
    })),
  };
}
