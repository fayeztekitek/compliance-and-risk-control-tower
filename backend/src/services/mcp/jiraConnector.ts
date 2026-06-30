import { BaseMcpConnector, ConnectorSyncResult } from "./baseConnector.js";
import { logger } from "../../core/logger.js";

export class JiraMcpConnector extends BaseMcpConnector {
  private get baseUrl() { return this.getConfig("url") || ""; }
  private get token() { return this.getConfig("token") || ""; }

  private async request<T>(endpoint: string): Promise<T> {
    const res = await fetch(`${this.baseUrl.replace(/\/$/, "")}/rest/api/3${endpoint}`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`:${this.token}`).toString("base64")}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) throw new Error(`Jira API error: ${res.status} ${res.statusText}`);
    return res.json() as Promise<T>;
  }

  async testConnection() {
    try {
      await this.request<any>("/myself");
      await this.updateStatus("connected");
      return { success: true, message: "Connected to Jira" };
    } catch (err: any) {
      await this.updateStatus("error", err.message);
      return { success: false, message: err.message };
    }
  }

  async sync() {
    try {
      const projects = await this.request<any[]>("/project/search");
      const issues = await this.request<any>(`/search?jql=updated > -7d&maxResults=50`);
      logger.info({ connector: this.name, projects: projects.length, issues: issues.total }, "Jira sync completed");
      return { success: true, itemsSynced: projects.length + (issues.issues?.length || 0), message: `Synced ${projects.length} projects and ${issues.total} issues from Jira` };
    } catch (err: any) {
      return { success: false, itemsSynced: 0, message: err.message, errors: [err.message] };
    }
  }
}
