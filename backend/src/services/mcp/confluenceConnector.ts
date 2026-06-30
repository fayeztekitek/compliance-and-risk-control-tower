import { BaseMcpConnector, ConnectorSyncResult } from "./baseConnector.js";
import { logger } from "../../core/logger.js";

export class ConfluenceMcpConnector extends BaseMcpConnector {
  private get baseUrl() { return this.getConfig("url") || ""; }
  private get token() { return this.getConfig("token") || ""; }

  private async request<T>(endpoint: string): Promise<T> {
    const res = await fetch(`${this.baseUrl.replace(/\/$/, "")}/rest/api${endpoint}`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`:${this.token}`).toString("base64")}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) throw new Error(`Confluence API error: ${res.status}`);
    return res.json() as Promise<T>;
  }

  async testConnection() {
    try {
      await this.request<any>("/space");
      await this.updateStatus("connected");
      return { success: true, message: "Connected to Confluence" };
    } catch (err: any) {
      await this.updateStatus("error", err.message);
      return { success: false, message: err.message };
    }
  }

  async sync() {
    try {
      const spaces = await this.request<any>("/space?limit=50");
      const spaceCount = spaces.results?.length || 0;
      logger.info({ connector: this.name, spaces: spaceCount }, "Confluence sync completed");
      return { success: true, itemsSynced: spaceCount, message: `Synced ${spaceCount} spaces from Confluence` };
    } catch (err: any) {
      return { success: false, itemsSynced: 0, message: err.message, errors: [err.message] };
    }
  }
}
