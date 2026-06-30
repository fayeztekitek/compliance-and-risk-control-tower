import { BaseMcpConnector } from "./baseConnector.js";
import { logger } from "../../core/logger.js";
import { pipelineService } from "../pipeline.service.js";

export class GithubMcpConnector extends BaseMcpConnector {
  private get token() { return this.getConfig("token") || ""; }

  private async request<T>(url: string): Promise<T> {
    const base = this.getConfig("url") || "https://api.github.com";
    const res = await fetch(`${base.replace(/\/$/, "")}${url}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "Control-Tower-MCP",
      },
    });
    if (!res.ok) throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
    return res.json() as Promise<T>;
  }

  async testConnection() {
    try {
      await this.request<any>("/user");
      await this.updateStatus("connected");
      return { success: true, message: "Connected to GitHub" };
    } catch (err: any) {
      await this.updateStatus("error", err.message);
      return { success: false, message: err.message };
    }
  }

  async sync() {
    try {
      const repos = await this.request<any[]>("/user/repos?per_page=50&sort=updated");
      let workflowsCount = 0;
      for (const repo of repos.slice(0, 10)) {
        try {
          const workflows = await this.request<any>(`/repos/${repo.full_name}/actions/runs?per_page=10&status=completed`);
          if (workflows.workflow_runs) {
            for (const wf of workflows.workflow_runs) {
              await pipelineService.ingestRun({
                source: "github_actions",
                sourceRunId: String(wf.id),
                project: repo.full_name,
                pipelineName: wf.name,
                status: wf.conclusion || wf.status || "pending",
                branch: wf.head_branch,
                commitSha: wf.head_sha,
                commitMessage: wf.display_title,
                triggerActor: wf.actor?.login,
                url: wf.html_url,
                durationSeconds: wf.run_started_at && wf.updated_at
                  ? Math.round((new Date(wf.updated_at).getTime() - new Date(wf.run_started_at).getTime()) / 1000)
                  : undefined,
                startedAt: wf.run_started_at,
                finishedAt: wf.updated_at,
                connectorId: this.id,
              });
              workflowsCount++;
            }
          }
        } catch { }
      }
      logger.info({ connector: this.name, repos: repos.length, workflows: workflowsCount }, "GitHub sync completed");
      return { success: true, itemsSynced: repos.length + workflowsCount, message: `Synced ${repos.length} repos, ${workflowsCount} workflows` };
    } catch (err: any) {
      return { success: false, itemsSynced: 0, message: err.message, errors: [err.message] };
    }
  }
}
