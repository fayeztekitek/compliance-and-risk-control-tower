import { BaseMcpConnector } from "./baseConnector.js";
import { logger } from "../../core/logger.js";
import { pipelineService } from "../pipeline.service.js";

export class GitlabMcpConnector extends BaseMcpConnector {
  private get baseUrl() { return (this.getConfig("url") || "https://gitlab.com").replace(/\/$/, ""); }
  private get token() { return this.getConfig("token") || ""; }

  private async request<T>(endpoint: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}/api/v4${endpoint}`, {
      headers: { "PRIVATE-TOKEN": this.token, Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`GitLab API error: ${res.status} ${res.statusText}`);
    return res.json() as Promise<T>;
  }

  async testConnection() {
    try {
      await this.request<any>("/user");
      await this.updateStatus("connected");
      return { success: true, message: "Connected to GitLab" };
    } catch (err: any) {
      await this.updateStatus("error", err.message);
      return { success: false, message: err.message };
    }
  }

  async sync() {
    try {
      const projects = await this.request<any[]>("/projects?per_page=50&membership=true&order_by=last_activity_at");
      let pipelinesCount = 0;
      for (const project of projects.slice(0, 10)) {
        try {
          const pipelines = await this.request<any[]>(`/projects/${project.id}/pipelines?per_page=10&order_by=updated_at`);
          for (const pipe of pipelines) {
            const detail = await this.request<any>(`/projects/${project.id}/pipelines/${pipe.id}`);
            await pipelineService.ingestRun({
              source: "gitlab_ci",
              sourceRunId: String(pipe.id),
              project: project.path_with_namespace,
              pipelineName: detail.ref,
              status: detail.status || "pending",
              branch: detail.ref,
              commitSha: detail.sha,
              triggerActor: detail.user?.username,
              url: detail.web_url,
              durationSeconds: detail.duration,
              startedAt: detail.created_at,
              finishedAt: detail.updated_at,
              connectorId: this.id,
            });
            pipelinesCount++;
          }
        } catch { }
      }
      logger.info({ connector: this.name, projects: projects.length, pipelines: pipelinesCount }, "GitLab sync completed");
      return { success: true, itemsSynced: projects.length + pipelinesCount, message: `Synced ${projects.length} projects, ${pipelinesCount} pipelines` };
    } catch (err: any) {
      return { success: false, itemsSynced: 0, message: err.message, errors: [err.message] };
    }
  }
}
