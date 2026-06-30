import { query, getClient } from "../config/database.js";

// ========== Projects ==========
const PROJECT_COLS = ["id","created_at","updated_at","name","code","manager","initial_budget","consumed_budget","roadmap_id","status","rtd_value","rtd_deviation","slippage_md","test_automation_rate","go_live_readiness_state","deleted_at","planning","quality","scope","governance","security","client_mood","resources","global_risk","executive_message","planning_trend","quality_trend","scope_trend","governance_trend","security_trend","client_mood_trend","resources_trend","global_risk_trend"];

function projectRow(r: any) {
  return {
    id: r.id, createdAt: r.created_at, updatedAt: r.updated_at,
    name: r.name, code: r.code, manager: r.manager,
    initialBudget: Number(r.initial_budget), consumedBudget: Number(r.consumed_budget),
    roadmapId: r.roadmap_id, status: r.status,
    rtdValue: Number(r.rtd_value), rtdDeviation: Number(r.rtd_deviation),
    slippageMd: Number(r.slippage_md), testAutomationRate: Number(r.test_automation_rate),
    goLiveReadinessState: r.go_live_readiness_state,
    planning: r.planning, quality: r.quality, scope: r.scope,
    governance: r.governance, security: r.security, clientMood: r.client_mood,
    resources: r.resources, globalRisk: r.global_risk,
    executiveMessage: r.executive_message,
    planningTrend: r.planning_trend, qualityTrend: r.quality_trend, scopeTrend: r.scope_trend,
    governanceTrend: r.governance_trend, securityTrend: r.security_trend, clientMoodTrend: r.client_mood_trend,
    resourcesTrend: r.resources_trend, globalRiskTrend: r.global_risk_trend,
  };
}

const RTD_COLS = ["id","created_at","updated_at","project_id","review_month","declared_rtd","actual_consumed","variance","comments","submitted_by","reviewer_approved"];

function rtdRow(r: any) {
  return {
    id: r.id, createdAt: r.created_at, updatedAt: r.updated_at,
    projectId: r.project_id, reviewMonth: r.review_month,
    declaredRtd: Number(r.declared_rtd), actualConsumed: Number(r.actual_consumed),
    variance: r.variance ? Number(r.variance) : null,
    comments: r.comments, submittedBy: r.submitted_by,
    reviewerApproved: r.reviewer_approved,
  };
}

export const projectRepo = {
  async list(filters: { page: number; limit: number; status?: string; search?: string }) {
    const conditions = ["deleted_at IS NULL"]; const params: any[] = []; let idx = 1;
    if (filters.status) { conditions.push(`status = $${idx++}`); params.push(filters.status); }
    if (filters.search) { conditions.push(`(name ILIKE $${idx++} OR code ILIKE $${idx++})`); params.push(`%${filters.search}%`, `%${filters.search}%`); }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const offset = (filters.page - 1) * filters.limit;
    const count = await query(`SELECT COUNT(*) FROM projects ${where}`, params);
    const total = parseInt(count.rows[0].count, 10);
    const data = await query(`SELECT ${PROJECT_COLS.join(",")} FROM projects ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`, [...params, filters.limit, offset]);
    return { data: data.rows.map(projectRow), total, page: filters.page, limit: filters.limit };
  },

  async getById(id: string) {
    const r = await query(`SELECT ${PROJECT_COLS.join(",")} FROM projects WHERE id = $1 AND deleted_at IS NULL`, [id]);
    return r.rows.length ? projectRow(r.rows[0]) : null;
  },

  async create(data: any) {
    const r = await query(`INSERT INTO projects (name, code, manager, initial_budget, roadmap_id) VALUES ($1,$2,$3,$4,$5) RETURNING ${PROJECT_COLS.join(",")}`,
      [data.name, data.code, data.manager || null, data.initialBudget || 0, data.roadmapId || null]);
    return projectRow(r.rows[0]);
  },

  async update(id: string, data: any) {
    const fields: string[] = []; const params: any[] = []; let idx = 1;
    const map: Record<string, string> = { name: "name", manager: "manager", status: "status", consumedBudget: "consumed_budget", slippageMd: "slippage_md", testAutomationRate: "test_automation_rate", goLiveReadinessState: "go_live_readiness_state", planning: "planning", quality: "quality", scope: "scope", governance: "governance", security: "security", clientMood: "client_mood", resources: "resources", globalRisk: "global_risk", executiveMessage: "executive_message", planningTrend: "planning_trend", qualityTrend: "quality_trend", scopeTrend: "scope_trend", governanceTrend: "governance_trend", securityTrend: "security_trend", clientMoodTrend: "client_mood_trend", resourcesTrend: "resources_trend", globalRiskTrend: "global_risk_trend", initialBudget: "initial_budget", rtdValue: "rtd_value", rtdDeviation: "rtd_deviation" };
    for (const [k, c] of Object.entries(map)) { if (data[k] !== undefined) { fields.push(`${c}=$${idx++}`); params.push(data[k]); } }
    if (!fields.length) return null;
    params.push(id);
    const r = await query(`UPDATE projects SET ${fields.join(",")} WHERE id=$${idx} AND deleted_at IS NULL RETURNING ${PROJECT_COLS.join(",")}`, params);
    return r.rows.length ? projectRow(r.rows[0]) : null;
  },

  async delete(id: string) {
    const r = await query("UPDATE projects SET deleted_at=NOW() WHERE id=$1 AND deleted_at IS NULL", [id]);
    return r.rowCount ? true : false;
  },

  async submitRtd(projectId: string, data: any) {
    const r = await query(
      `INSERT INTO rtd_reviews (project_id, review_month, declared_rtd, actual_consumed, variance, comments, submitted_by) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING ${RTD_COLS.join(",")}`,
      [projectId, data.reviewMonth, data.declaredRtd, data.actualConsumed, data.declaredRtd - data.actualConsumed, data.comments || null, data.submittedBy || null]
    );
    await query("UPDATE projects SET rtd_value=$1, rtd_deviation=$2 WHERE id=$3", [data.declaredRtd, data.declaredRtd - data.actualConsumed, projectId]);
    return rtdRow(r.rows[0]);
  },

  // ========== Roadmaps ==========
  async listRoadmaps() {
    const r = await query("SELECT id,created_at,updated_at,name,type,progress,target_date,milestone_status,lead_owner,deleted_at FROM roadmaps WHERE deleted_at IS NULL ORDER BY created_at DESC");
    return r.rows.map((row: any) => ({ id: row.id, createdAt: row.created_at, updatedAt: row.updated_at, name: row.name, type: row.type, progress: Number(row.progress), targetDate: row.target_date, milestoneStatus: row.milestone_status, leadOwner: row.lead_owner }));
  },

  async createRoadmap(data: any) {
    const r = await query("INSERT INTO roadmaps (name, type, target_date, lead_owner) VALUES ($1,$2,$3,$4) RETURNING id,created_at,updated_at,name,type,progress,target_date,milestone_status,lead_owner",
      [data.name, data.type, data.targetDate, data.leadOwner || null]);
    return r.rows[0];
  },

  async updateRoadmap(id: string, data: any) {
    const fields: string[] = []; const params: any[] = []; let idx = 1;
    const map: Record<string, string> = { name: "name", progress: "progress", milestoneStatus: "milestone_status", targetDate: "target_date", leadOwner: "lead_owner" };
    for (const [k, c] of Object.entries(map)) { if (data[k] !== undefined) { fields.push(`${c}=$${idx++}`); params.push(data[k]); } }
    if (!fields.length) return null;
    params.push(id);
    const r = await query(`UPDATE roadmaps SET ${fields.join(",")} WHERE id=$${idx} RETURNING id,created_at,updated_at,name,type,progress,target_date,milestone_status,lead_owner`, params);
    return r.rows.length ? r.rows[0] : null;
  },

  async deleteRoadmap(id: string) {
    await query("UPDATE roadmaps SET deleted_at=NOW() WHERE id=$1", [id]);
  },

  // ========== SaaS Applications ==========
  async listSaaSApps() {
    const r = await query("SELECT id,created_at,updated_at,name,lifecycle_stage,go_live_readiness_score,privacy_design_status,steering_check_passed,data_category,gdpr_risk_impact,owner,deleted_at FROM saas_applications WHERE deleted_at IS NULL ORDER BY created_at DESC");
    return r.rows.map((row: any) => ({ id: row.id, createdAt: row.created_at, updatedAt: row.updated_at, name: row.name, lifecycleStage: row.lifecycle_stage, goLiveReadinessScore: Number(row.go_live_readiness_score), privacyDesignStatus: row.privacy_design_status, steeringCheckPassed: row.steering_check_passed, dataCategory: row.data_category, gdprRiskImpact: row.gdpr_risk_impact, owner: row.owner }));
  },

  async createSaaSApp(data: any) {
    const r = await query("INSERT INTO saas_applications (name, data_category, gdpr_risk_impact, owner) VALUES ($1,$2,$3,$4) RETURNING id,created_at,updated_at,name,lifecycle_stage,go_live_readiness_score,privacy_design_status,steering_check_passed,data_category,gdpr_risk_impact,owner",
      [data.name, data.dataCategory || "NON_PII", data.gdprRiskImpact || "LOW", data.owner || null]);
    return r.rows[0];
  },

  async updateSaaSApp(id: string, data: any) {
    const fields: string[] = []; const params: any[] = []; let idx = 1;
    const map: Record<string, string> = { name: "name", lifecycleStage: "lifecycle_stage", privacyDesignStatus: "privacy_design_status", steeringCheckPassed: "steering_check_passed" };
    for (const [k, c] of Object.entries(map)) { if (data[k] !== undefined) { fields.push(`${c}=$${idx++}`); params.push(data[k]); } }
    if (!fields.length) return null;
    params.push(id);
    const r = await query(`UPDATE saas_applications SET ${fields.join(",")} WHERE id=$${idx} RETURNING id,created_at,updated_at,name,lifecycle_stage,go_live_readiness_score,privacy_design_status,steering_check_passed,data_category,gdpr_risk_impact,owner`, params);
    return r.rows.length ? r.rows[0] : null;
  },

  async deleteSaaSApp(id: string) {
    await query("UPDATE saas_applications SET deleted_at=NOW() WHERE id=$1", [id]);
  },

  async createPrivacyAssessment(saasId: string, data: any) {
    const r = await query(
      "INSERT INTO privacy_assessments (saas_application_id, gdpr_ready, data_protection_officer_review, commitments, data_processing_objective, checklist) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id,created_at,updated_at,saas_application_id,gdpr_ready,data_protection_officer_review,commitments,data_processing_objective,checklist",
      [saasId, data.gdprReady || false, data.dataProtectionOfficerReview || false, data.commitments || null, data.dataProcessingObjective || null, JSON.stringify(data.checklist || [])]
    );
    return r.rows[0];
  },

  async calculateReadinessScore(saasId: string) {
    const app = await query("SELECT * FROM saas_applications WHERE id=$1", [saasId]);
    if (!app.rows.length) return null;
    const a = app.rows[0];
    let score = 0;
    if (a.privacy_design_status === "COMPLIANT") score += 40;
    else if (a.privacy_design_status === "PENDING") score += 20;
    if (a.steering_check_passed) score += 30;
    if (a.go_live_readiness_score) score = Math.round(score * 0.7 + Number(a.go_live_readiness_score) * 0.3);
    else score = Math.round(score);
    await query("UPDATE saas_applications SET go_live_readiness_score=$1 WHERE id=$2", [Math.min(score, 100), saasId]);
    return Math.min(score, 100);
  },

  async getAudit(id: string) {
    const r = await query("SELECT id,created_at,updated_at,title,type,date,status,lead_auditor FROM audits WHERE id=$1 AND deleted_at IS NULL", [id]);
    return r.rows.length ? r.rows[0] : null;
  },

  async updateFinding(id: string, data: any) {
    const fields: string[] = []; const params: any[] = []; let idx = 1;
    const map: Record<string, string> = { title: "title", description: "description", severity: "severity", status: "status", targetEntity: "target_entity" };
    for (const [k, c] of Object.entries(map)) { if (data[k] !== undefined) { fields.push(`${c}=$${idx++}`); params.push(data[k]); } }
    if (!fields.length) return null;
    params.push(id);
    const r = await query(`UPDATE audit_findings SET ${fields.join(",")} WHERE id=$${idx} RETURNING id,created_at,updated_at,audit_id,title,description,severity,status,target_entity`, params);
    return r.rows.length ? r.rows[0] : null;
  },

  async listCapa(auditId: string) {
    return (await query(
      `SELECT ca.id,ca.created_at,ca.updated_at,ca.finding_id,ca.description,ca.owner,ca.due_date,ca.status,ca.completion_date,ca.evidence_description FROM corrective_actions ca JOIN audit_findings af ON ca.finding_id = af.id WHERE af.audit_id=$1 ORDER BY ca.created_at DESC`,
      [auditId]
    )).rows;
  },

  async createCapa(auditId: string, data: any) {
    const finding = await query("INSERT INTO audit_findings (audit_id, title, description, severity) VALUES ($1,$2,$3,$4) RETURNING id",
      [auditId, data.description ? data.description.substring(0, 255) : "Corrective Action", data.description || null, "MEDIUM"]);
    const r = await query("INSERT INTO corrective_actions (finding_id, description, owner, due_date) VALUES ($1,$2,$3,$4) RETURNING id,created_at,updated_at,finding_id,description,owner,due_date,status,completion_date,evidence_description",
      [finding.rows[0].id, data.description, data.owner || null, data.dueDate]);
    return r.rows[0];
  },

  // ========== Audits ==========
  async listAudits() {
    const r = await query("SELECT id,created_at,updated_at,title,type,date,status,lead_auditor,deleted_at FROM audits WHERE deleted_at IS NULL ORDER BY created_at DESC");
    return r.rows.map((row: any) => ({ id: row.id, createdAt: row.created_at, updatedAt: row.updated_at, title: row.title, type: row.type, date: row.date, status: row.status, leadAuditor: row.lead_auditor }));
  },

  async createAudit(data: any) {
    const r = await query("INSERT INTO audits (title, type, date, lead_auditor) VALUES ($1,$2,$3,$4) RETURNING id,created_at,updated_at,title,type,date,status,lead_auditor",
      [data.title, data.type, data.date || new Date().toISOString().split("T")[0], data.leadAuditor || null]);
    return r.rows[0];
  },

  async updateAudit(id: string, data: any) {
    const fields: string[] = []; const params: any[] = []; let idx = 1;
    const map: Record<string, string> = { title: "title", status: "status", leadAuditor: "lead_auditor" };
    for (const [k, c] of Object.entries(map)) { if (data[k] !== undefined) { fields.push(`${c}=$${idx++}`); params.push(data[k]); } }
    if (!fields.length) return null;
    params.push(id);
    const r = await query(`UPDATE audits SET ${fields.join(",")} WHERE id=$${idx} RETURNING id,created_at,updated_at,title,type,date,status,lead_auditor`, params);
    return r.rows.length ? r.rows[0] : null;
  },

  async deleteAudit(id: string) {
    await query("UPDATE audits SET deleted_at=NOW() WHERE id=$1", [id]);
  },

  async listFindings(auditId: string) {
    return (await query("SELECT id,created_at,updated_at,audit_id,title,description,severity,status,target_entity FROM audit_findings WHERE audit_id=$1 ORDER BY created_at DESC", [auditId])).rows;
  },

  async createFinding(auditId: string, data: any) {
    const r = await query("INSERT INTO audit_findings (audit_id, title, description, severity, target_entity) VALUES ($1,$2,$3,$4,$5) RETURNING id,created_at,updated_at,audit_id,title,description,severity,status,target_entity",
      [auditId, data.title, data.description || null, data.severity, data.targetEntity || null]);
    return r.rows[0];
  },

  async listCorrectiveActions(findingId: string) {
    return (await query("SELECT id,created_at,updated_at,finding_id,description,owner,due_date,status,completion_date,evidence_description FROM corrective_actions WHERE finding_id=$1 ORDER BY created_at DESC", [findingId])).rows;
  },

  async createCorrectiveAction(findingId: string, data: any) {
    const r = await query("INSERT INTO corrective_actions (finding_id, description, owner, due_date) VALUES ($1,$2,$3,$4) RETURNING id,created_at,updated_at,finding_id,description,owner,due_date,status,completion_date,evidence_description",
      [findingId, data.description, data.owner || null, data.dueDate]);
    return r.rows[0];
  },

  async closeCorrectiveAction(id: string, evidenceDesc: string) {
    const r = await query("UPDATE corrective_actions SET status='COMPLETED', completion_date=CURRENT_DATE, evidence_description=$1 WHERE id=$2 RETURNING id,created_at,updated_at,finding_id,description,owner,due_date,status,completion_date,evidence_description",
      [evidenceDesc, id]);
    return r.rows.length ? r.rows[0] : null;
  },

  // ========== Committees ==========
  async listCommittees(filters: { page: number; limit: number }) {
    const offset = (filters.page - 1) * filters.limit;
    const countResult = await query<{ count: string }>("SELECT COUNT(*) as count FROM committees WHERE deleted_at IS NULL");
    const total = parseInt(countResult.rows[0].count, 10);
    const dataResult = await query(
      "SELECT id,created_at,updated_at,name,date,time,type,status,participants,agenda,minutes FROM committees WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT $1 OFFSET $2",
      [filters.limit, offset]
    );
    return { data: dataResult.rows, total, page: filters.page, limit: filters.limit };
  },

  async createCommittee(data: any) {
    const r = await query("INSERT INTO committees (name, date, time, type, participants, agenda) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id,created_at,updated_at,name,date,time,type,status,participants,agenda,minutes",
      [data.name, data.date, data.time || null, data.type, data.participants || [], data.agenda || []]);
    return r.rows[0];
  },

  async updateCommittee(id: string, data: any) {
    const fields: string[] = []; const params: any[] = []; let idx = 1;
    const map: Record<string, string> = { name: "name", status: "status", minutes: "minutes" };
    for (const [k, c] of Object.entries(map)) { if (data[k] !== undefined) { fields.push(`${c}=$${idx++}`); params.push(data[k]); } }
    if (data.participants) { fields.push(`participants=$${idx++}`); params.push(data.participants); }
    if (data.agenda) { fields.push(`agenda=$${idx++}`); params.push(data.agenda); }
    if (!fields.length) return null;
    params.push(id);
    const r = await query(`UPDATE committees SET ${fields.join(",")} WHERE id=$${idx} RETURNING id,created_at,updated_at,name,date,time,type,status,participants,agenda,minutes`, params);
    return r.rows.length ? r.rows[0] : null;
  },

  async deleteCommittee(id: string) {
    await query("UPDATE committees SET deleted_at=NOW() WHERE id=$1", [id]);
  },

  async listDecisions(committeeId: string) {
    return (await query("SELECT id,created_at,updated_at,committee_id,title,context,outcome,owner,comments FROM committee_decisions WHERE committee_id=$1 ORDER BY created_at DESC", [committeeId])).rows;
  },

  async recordDecision(committeeId: string, data: any) {
    const r = await query("INSERT INTO committee_decisions (committee_id, title, context, outcome, owner, comments) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id,created_at,updated_at,committee_id,title,context,outcome,owner,comments",
      [committeeId, data.title, data.context || null, data.outcome, data.owner || null, data.comments || null]);
    return r.rows[0];
  },

  async getCommittee(id: string) {
    const r = await query("SELECT id,created_at,updated_at,name,date,time,type,status,participants,agenda,minutes FROM committees WHERE id=$1 AND deleted_at IS NULL", [id]);
    return r.rows.length ? r.rows[0] : null;
  },

  async listCommitteeObligations(committeeId: string) {
    return (await query("SELECT id,created_at,updated_at,title,source_contract,requirement,frequency,last_verified_date,status,verified_by,deleted_at FROM contractual_obligations WHERE deleted_at IS NULL ORDER BY created_at DESC")).rows;
  },

  async createCommitteeObligation(committeeId: string, data: any) {
    const r = await query("INSERT INTO contractual_obligations (title, source_contract, requirement, frequency) VALUES ($1,$2,$3,$4) RETURNING id,created_at,updated_at,title,source_contract,requirement,frequency,last_verified_date,status,verified_by",
      [data.title, data.sourceContract || null, data.requirement, data.frequency || null]);
    return r.rows[0];
  },

  async updateObligation(id: string, data: any) {
    const fields: string[] = []; const params: any[] = []; let idx = 1;
    const map: Record<string, string> = { title: "title", sourceContract: "source_contract", requirement: "requirement", frequency: "frequency", status: "status" };
    for (const [k, c] of Object.entries(map)) { if (data[k] !== undefined) { fields.push(`${c}=$${idx++}`); params.push(data[k]); } }
    if (!fields.length) return null;
    params.push(id);
    const r = await query(`UPDATE contractual_obligations SET ${fields.join(",")} WHERE id=$${idx} RETURNING id,created_at,updated_at,title,source_contract,requirement,frequency,last_verified_date,status,verified_by`, params);
    return r.rows.length ? r.rows[0] : null;
  },

  // ========== Contractual Obligations ==========
  async listObligations() {
    return (await query("SELECT id,created_at,updated_at,title,source_contract,requirement,frequency,last_verified_date,status,verified_by,deleted_at FROM contractual_obligations WHERE deleted_at IS NULL ORDER BY created_at DESC")).rows;
  },

  async createObligation(data: any) {
    const r = await query("INSERT INTO contractual_obligations (title, source_contract, requirement, frequency) VALUES ($1,$2,$3,$4) RETURNING id,created_at,updated_at,title,source_contract,requirement,frequency,last_verified_date,status,verified_by",
      [data.title, data.sourceContract || null, data.requirement, data.frequency || null]);
    return r.rows[0];
  },

  async verifyObligation(id: string, data: any) {
    const r = await query("UPDATE contractual_obligations SET status=$1, verified_by=$2, last_verified_date=CURRENT_DATE WHERE id=$3 RETURNING id,created_at,updated_at,title,source_contract,requirement,frequency,last_verified_date,status,verified_by",
      [data.status, data.verifiedBy || null, id]);
    return r.rows.length ? r.rows[0] : null;
  },

  // ========== Milestones ==========
  async listMilestones(projectId: string) {
    const r = await query("SELECT * FROM project_milestones WHERE project_id=$1 ORDER BY due_date ASC NULLS LAST", [projectId]);
    return r.rows.map((row: any) => ({ id: row.id, projectId: row.project_id, title: row.title, description: row.description, dueDate: row.due_date, status: row.status, createdAt: row.created_at, updatedAt: row.updated_at }));
  },

  async createMilestone(projectId: string, data: any) {
    const r = await query("INSERT INTO project_milestones (project_id, title, description, due_date, status) VALUES ($1,$2,$3,$4,$5) RETURNING *",
      [projectId, data.title, data.description || null, data.dueDate || null, data.status || "PENDING"]);
    return r.rows[0];
  },

  async updateMilestone(id: string, data: any) {
    const fields: string[] = []; const params: any[] = []; let idx = 1;
    const map: Record<string, string> = { title: "title", description: "description", dueDate: "due_date", status: "status" };
    for (const [k, c] of Object.entries(map)) { if (data[k] !== undefined) { fields.push(`${c}=$${idx++}`); params.push(data[k]); } }
    if (!fields.length) return null;
    params.push(id);
    const r = await query(`UPDATE project_milestones SET ${fields.join(",")} WHERE id=$${idx} RETURNING *`, params);
    return r.rows.length ? r.rows[0] : null;
  },

  async deleteMilestone(id: string) {
    await query("DELETE FROM project_milestones WHERE id=$1", [id]);
  },

  // ========== Risks ==========
  async listRisks(projectId: string) {
    const r = await query("SELECT * FROM project_risks WHERE project_id=$1 ORDER BY created_at DESC", [projectId]);
    return r.rows.map((row: any) => ({ id: row.id, projectId: row.project_id, title: row.title, description: row.description, severity: row.severity, category: row.category, status: row.status, owner: row.owner, createdAt: row.created_at, updatedAt: row.updated_at }));
  },

  async createRisk(projectId: string, data: any) {
    const r = await query("INSERT INTO project_risks (project_id, title, description, severity, category, status, owner) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *",
      [projectId, data.title, data.description || null, data.severity || "AMBER", data.category || null, data.status || "OPEN", data.owner || null]);
    return r.rows[0];
  },

  async updateRisk(id: string, data: any) {
    const fields: string[] = []; const params: any[] = []; let idx = 1;
    const map: Record<string, string> = { title: "title", description: "description", severity: "severity", category: "category", status: "status", owner: "owner" };
    for (const [k, c] of Object.entries(map)) { if (data[k] !== undefined) { fields.push(`${c}=$${idx++}`); params.push(data[k]); } }
    if (!fields.length) return null;
    params.push(id);
    const r = await query(`UPDATE project_risks SET ${fields.join(",")} WHERE id=$${idx} RETURNING *`, params);
    return r.rows.length ? r.rows[0] : null;
  },

  async deleteRisk(id: string) {
    await query("DELETE FROM project_risks WHERE id=$1", [id]);
  },

  // ========== Status Snapshots ==========
  async listStatusSnapshots(projectId: string) {
    const r = await query("SELECT * FROM project_status_snapshots WHERE project_id=$1 ORDER BY snapshot_date DESC", [projectId]);
    return r.rows.map((row: any) => ({ id: row.id, projectId: row.project_id, snapshotDate: row.snapshot_date, planning: row.planning, quality: row.quality, scope: row.scope, governance: row.governance, security: row.security, clientMood: row.client_mood, resources: row.resources, globalRisk: row.global_risk, executiveMessage: row.executive_message, planningTrend: row.planning_trend, qualityTrend: row.quality_trend, scopeTrend: row.scope_trend, governanceTrend: row.governance_trend, securityTrend: row.security_trend, clientMoodTrend: row.client_mood_trend, resourcesTrend: row.resources_trend, globalRiskTrend: row.global_risk_trend, createdAt: row.created_at }));
  },

  async createStatusSnapshot(projectId: string) {
    const project = await this.getById(projectId);
    if (!project) return null;
    const r = await query(`INSERT INTO project_status_snapshots (project_id, planning, quality, scope, governance, security, client_mood, resources, global_risk, executive_message, planning_trend, quality_trend, scope_trend, governance_trend, security_trend, client_mood_trend, resources_trend, global_risk_trend) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,
      [projectId, project.planning, project.quality, project.scope, project.governance, project.security, project.clientMood, project.resources, project.globalRisk, project.executiveMessage, project.planningTrend, project.qualityTrend, project.scopeTrend, project.governanceTrend, project.securityTrend, project.clientMoodTrend, project.resourcesTrend, project.globalRiskTrend]);
    return r.rows[0];
  },
};
