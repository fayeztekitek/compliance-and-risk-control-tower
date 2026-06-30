import { BaseMcpConnector, ConnectorSyncResult } from "./baseConnector.js";
import { logger } from "../../core/logger.js";

export class SlackMcpConnector extends BaseMcpConnector {
  private get token() { return this.getConfig("token") || ""; }

  private async request<T>(endpoint: string): Promise<T> {
    const res = await fetch(`https://slack.com/api${endpoint}`, {
      headers: { Authorization: `Bearer ${this.token}`, Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`Slack API error: ${res.status}`);
    const data = await res.json() as any;
    if (!data.ok) throw new Error(`Slack API error: ${data.error}`);
    return data as T;
  }

  async testConnection() {
    try {
      await this.request<any>("/auth.test");
      await this.updateStatus("connected");
      return { success: true, message: "Connected to Slack" };
    } catch (err: any) {
      await this.updateStatus("error", err.message);
      return { success: false, message: err.message };
    }
  }

  async sync() {
    try {
      const channels = await this.request<any[]>("/conversations.list?types=public_channel&limit=50");
      const channelCount = channels?.length || 0;
      logger.info({ connector: this.name, channels: channelCount }, "Slack sync completed");
      return { success: true, itemsSynced: channelCount, message: `Listed ${channelCount} Slack channels` };
    } catch (err: any) {
      return { success: false, itemsSynced: 0, message: err.message, errors: [err.message] };
    }
  }
}
