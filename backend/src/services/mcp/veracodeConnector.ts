import { BaseMcpConnector, ConnectorSyncResult } from "./baseConnector.js";
import { VeracodeHttpClient } from "../veracodeHttpClient.js";

export class VeracodeMcpConnector extends BaseMcpConnector {
  private createClient() {
    const url = this.getConfig("url") || "";
    const token = this.getConfig("token") || "";
    if (!url || !token) throw new Error("Veracode URL and token are required");
    return new VeracodeHttpClient({ url, authHeader: token });
  }

  async testConnection() {
    try {
      const client = this.createClient();
      await client.getApplications();
      await this.updateStatus("connected");
      return { success: true, message: "Connected to Veracode" };
    } catch (err: any) {
      await this.updateStatus("error", err.message);
      return { success: false, message: err.message };
    }
  }

  async sync() {
    try {
      const client = this.createClient();
      const { veracodeSyncService } = await import("../veracodeSyncService.js");
      const result = await veracodeSyncService.sync(client);
      const count = result?.findings || 0;
      return { success: true, itemsSynced: count, message: `Synced ${count} Veracode findings` };
    } catch (err: any) {
      return { success: false, itemsSynced: 0, message: err.message, errors: [err.message] };
    }
  }
}
