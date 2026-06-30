import { query } from "../config/database.js";
import { logger } from "../core/logger.js";
import { randomUUID } from "crypto";

export interface PipelineRun {
  id: string;
  createdAt: string;
  updatedAt: string;
  source: string;
  sourceRunId?: string;
  project: string;
  pipelineName?: string;
  status: string;
  branch?: string;
  commitSha?: string;
  commitMessage?: string;
  triggerActor?: string;
  url?: string;
  durationSeconds?: number;
  startedAt?: string;
  finishedAt?: string;
  rawPayload: any;
  connectorId?: string;
}

export interface PipelinePolicyGate {
  id: string;
  createdAt: string;
  pipelineRunId: string;
  policyRuleId?: string;
  gateName: string;
  status: string;
  result: any;
  evaluatedAt?: string;
  evaluatedBy?: string;
}

function runRow(r: any): PipelineRun {
  return {
    id: r.id, createdAt: r.created_at, updatedAt: r.updated_at,
    source: r.source, sourceRunId: r.source_run_id,
    project: r.project, pipelineName: r.pipeline_name,
    status: r.status, branch: r.branch,
    commitSha: r.commit_sha, commitMessage: r.commit_message,
    triggerActor: r.trigger_actor, url: r.url,
    durationSeconds: r.duration_seconds,
    startedAt: r.started_at, finishedAt: r.finished_at,
    rawPayload: typeof r.raw_payload === "string" ? JSON.parse(r.raw_payload) : r.raw_payload,
    connectorId: r.connector_id,
  };
}

function gateRow(r: any): PipelinePolicyGate {
  return {
    id: r.id, createdAt: r.created_at,
    pipelineRunId: r.pipeline_run_id, policyRuleId: r.policy_rule_id,
    gateName: r.gate_name, status: r.status,
    result: typeof r.result === "string" ? JSON.parse(r.result) : r.result,
    evaluatedAt: r.evaluated_at, evaluatedBy: r.evaluated_by,
  };
}

export const pipelineService = {
  // Ingest a pipeline run from webhook or API
  async ingestRun(payload: {
    source: string;
    sourceRunId?: string;
    project: string;
    pipelineName?: string;
    status: string;
    branch?: string;
    commitSha?: string;
    commitMessage?: string;
    triggerActor?: string;
    url?: string;
    durationSeconds?: number;
    startedAt?: string;
    finishedAt?: string;
    rawPayload?: any;
    connectorId?: string;
  }): Promise<PipelineRun> {
    const existing = payload.sourceRunId
      ? (await query("SELECT * FROM pipeline_runs WHERE source = $1 AND source_run_id = $2", [payload.source, payload.sourceRunId])).rows[0]
      : null;

    if (existing) {
      const result = await query(
        `UPDATE pipeline_runs SET status = $1, duration_seconds = $2, finished_at = $3, raw_payload = $4, updated_at = NOW()
         WHERE id = $5 RETURNING *`,
        [payload.status, payload.durationSeconds || null, payload.finishedAt || null,
         JSON.stringify(payload.rawPayload || {}), existing.id]
      );
      return runRow(result.rows[0]);
    }

    const id = randomUUID();
    const result = await query(
      `INSERT INTO pipeline_runs (id, source, source_run_id, project, pipeline_name, status, branch, commit_sha, commit_message, trigger_actor, url, duration_seconds, started_at, finished_at, raw_payload, connector_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`,
      [id, payload.source, payload.sourceRunId || null, payload.project,
       payload.pipelineName || null, payload.status, payload.branch || null,
       payload.commitSha || null, payload.commitMessage || null,
       payload.triggerActor || null, payload.url || null,
       payload.durationSeconds || null, payload.startedAt || null,
       payload.finishedAt || null, JSON.stringify(payload.rawPayload || {}),
       payload.connectorId || null]
    );
    return runRow(result.rows[0]);
  },

  // Process GitHub Actions webhook
  async processGithubWebhook(body: any) {
    const event = body.action || "unknown";
    if (body.workflow_run) {
      const wf = body.workflow_run;
      return this.ingestRun({
        source: "github_actions",
        sourceRunId: String(wf.id),
        project: body.repository?.full_name || "unknown",
        pipelineName: wf.name || body.workflow?.name,
        status: wf.conclusion || wf.status || "pending",
        branch: wf.head_branch,
        commitSha: wf.head_sha,
        triggerActor: wf.actor?.login || body.sender?.login,
        url: wf.html_url,
        durationSeconds: wf.run_started_at && wf.updated_at
          ? Math.round((new Date(wf.updated_at).getTime() - new Date(wf.run_started_at).getTime()) / 1000)
          : undefined,
        startedAt: wf.run_started_at,
        finishedAt: wf.updated_at,
        rawPayload: body,
      });
    }
    if (body.check_suite) {
      const cs = body.check_suite;
      return this.ingestRun({
        source: "github_actions",
        sourceRunId: String(cs.id),
        project: body.repository?.full_name || "unknown",
        pipelineName: `Check Suite: ${cs.head_branch}`,
        status: cs.conclusion || cs.status || "pending",
        branch: cs.head_branch,
        commitSha: cs.head_sha,
        triggerActor: body.sender?.login,
        url: cs.html_url || body.repository?.html_url,
        durationSeconds: cs.started_at && cs.updated_at
          ? Math.round((new Date(cs.updated_at).getTime() - new Date(cs.started_at).getTime()) / 1000)
          : undefined,
        startedAt: cs.started_at,
        finishedAt: cs.updated_at,
        rawPayload: body,
      });
    }
    return null;
  },

  // Process GitLab CI webhook
  async processGitlabWebhook(body: any) {
    if (body.object_kind === "pipeline" && body.object_attributes) {
      const attrs = body.object_attributes;
      const project = body.project || {};
      return this.ingestRun({
        source: "gitlab_ci",
        sourceRunId: String(attrs.id),
        project: project.path_with_namespace || project.name || "unknown",
        pipelineName: attrs.ref,
        status: attrs.status || "pending",
        branch: attrs.ref,
        commitSha: body.commit?.id,
        commitMessage: body.commit?.message,
        triggerActor: body.user?.username,
        url: attrs.url,
        durationSeconds: attrs.duration,
        startedAt: attrs.created_at,
        finishedAt: attrs.finished_at,
        rawPayload: body,
      });
    }
    if (body.object_kind === "build" && body.build) {
      const b = body.build;
      const project = body.project || {};
      return this.ingestRun({
        source: "gitlab_ci",
        sourceRunId: `build-${b.id}`,
        project: project.path_with_namespace || project.name || "unknown",
        pipelineName: `${b.stage}: ${b.name}`,
        status: b.status || "pending",
        branch: b.ref,
        commitSha: b.commit?.id,
        triggerActor: body.user?.username,
        url: b.url,
        durationSeconds: b.duration,
        startedAt: b.started_at,
        finishedAt: b.finished_at,
        rawPayload: body,
      });
    }
    return null;
  },

  // List pipeline runs
  async listRuns(params: {
    source?: string; project?: string; status?: string;
    page?: number; limit?: number;
  }) {
    const { page = 1, limit = 20 } = params;
    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (params.source) { conditions.push(`source = $${idx++}`); values.push(params.source); }
    if (params.project) { conditions.push(`project ILIKE $${idx++}`); values.push(`%${params.project}%`); }
    if (params.status) { conditions.push(`status = $${idx++}`); values.push(params.status); }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const offset = (page - 1) * limit;

    const countResult = await query(`SELECT COUNT(*) FROM pipeline_runs ${where}`, values);
    const total = parseInt(countResult.rows[0].count, 10);

    const dataResult = await query(
      `SELECT * FROM pipeline_runs ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
      [...values, limit, offset]
    );

    return { data: dataResult.rows.map(runRow), total, page, limit };
  },

  async getRun(id: string) {
    const result = await query("SELECT * FROM pipeline_runs WHERE id = $1", [id]);
    if (!result.rows.length) return null;
    return runRow(result.rows[0]);
  },

  // Policy gates
  async evaluateGates(pipelineRunId: string) {
    const run = await this.getRun(pipelineRunId);
    if (!run) throw new Error("Pipeline run not found");

    const policyRules = await query(
      "SELECT id, name, rule_type, config FROM policy_rules WHERE enabled = true"
    );
    const gates: PipelinePolicyGate[] = [];

    for (const rule of policyRules.rows) {
      let status = "pass";
      const result: any = { rule: rule.name, evaluated: true };

      try {
        const config = typeof rule.config === "string" ? JSON.parse(rule.config) : rule.config;
        if (config.source && config.source !== run.source) {
          status = "skipped";
          result.reason = `Source mismatch: expected ${config.source}, got ${run.source}`;
        } else if (config.branch && run.branch && !run.branch.match(config.branch)) {
          status = "fail";
          result.reason = `Branch ${run.branch} does not match pattern ${config.branch}`;
        } else if (config.statusMatch && config.statusMatch !== run.status) {
          status = "fail";
          result.reason = `Status ${run.status} does not match expected ${config.statusMatch}`;
        }
      } catch (err: any) {
        status = "error";
        result.error = err.message;
      }

      const gateId = randomUUID();
      await query(
        `INSERT INTO pipeline_policy_gates (id, pipeline_run_id, policy_rule_id, gate_name, status, result, evaluated_at, evaluated_by)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7)`,
        [gateId, pipelineRunId, rule.id, rule.name, status, JSON.stringify(result), "system"]
      );

      gates.push({
        id: gateId, createdAt: new Date().toISOString(),
        pipelineRunId, policyRuleId: rule.id,
        gateName: rule.name, status, result, evaluatedAt: new Date().toISOString(), evaluatedBy: "system",
      });
    }

    return gates;
  },

  async getGates(pipelineRunId: string) {
    const result = await query(
      "SELECT * FROM pipeline_policy_gates WHERE pipeline_run_id = $1 ORDER BY created_at",
      [pipelineRunId]
    );
    return result.rows.map(gateRow);
  },

  async listRecentGates(limit = 20) {
    const result = await query(
      "SELECT g.*, r.project, r.source, r.status AS run_status FROM pipeline_policy_gates g JOIN pipeline_runs r ON r.id = g.pipeline_run_id ORDER BY g.created_at DESC LIMIT $1",
      [limit]
    );
    return result.rows;
  },

  // Stats
  async getStats() {
    const total = await query("SELECT COUNT(*) FROM pipeline_runs");
    const byStatus = await query("SELECT status, COUNT(*) as count FROM pipeline_runs GROUP BY status");
    const bySource = await query("SELECT source, COUNT(*) as count FROM pipeline_runs GROUP BY source");
    const recent = await query("SELECT * FROM pipeline_runs ORDER BY created_at DESC LIMIT 5");
    return {
      total: parseInt(total.rows[0].count, 10),
      byStatus: byStatus.rows,
      bySource: bySource.rows,
      recent: recent.rows.map(runRow),
    };
  },
};
