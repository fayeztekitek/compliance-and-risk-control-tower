import { BaseMcpConnector, ConnectorSyncResult } from "./baseConnector.js";
import { FortifyHttpClient } from "../fortifyHttpClient.js";

export class FortifyMcpConnector extends BaseMcpConnector {
  private createClient() {
    const url = this.getConfig("url") || "";
    const token = this.getConfig("token") || "";
    if (!url || !token) throw new Error("Fortify URL and token are required");
    return new FortifyHttpClient({ url, authHeader: token });
  }

  async testConnection() {
    try {
      const client = this.createClient();
      await client.getProjects();
      await this.updateStatus("connected");
      return { success: true, message: "Connected to Fortify" };
    } catch (err: any) {
      await this.updateStatus("error", err.message);
      return { success: false, message: err.message };
    }
  }

  async sync() {
    try {
      const client = this.createClient();
      const { fortifySyncService } = await import("../fortifySyncService.js");
      const result = await fortifySyncService.sync(client);
      const count = result?.findings || 0;
      return { success: true, itemsSynced: count, message: `Synced ${count} Fortify vulnerabilities` };
    } catch (err: any) {
      return { success: false, itemsSynced: 0, message: err.message, errors: [err.message] };
    }
  }
}
