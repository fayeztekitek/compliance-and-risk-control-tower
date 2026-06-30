import { BaseMcpConnector, ConnectorSyncResult } from "./baseConnector.js";

export class NexusMcpConnector extends BaseMcpConnector {
  async testConnection() {
    try {
      const { nexusService } = await import("../nexus.service.js");
      const result = await nexusService.testConnection();
      await this.updateStatus(result ? "connected" : "error");
      return { success: !!result, message: result ? "Connected to Nexus IQ" : "Connection failed" };
    } catch (err: any) {
      await this.updateStatus("error", err.message);
      return { success: false, message: err.message };
    }
  }

  async sync() {
    try {
      const { nexusService } = await import("../nexus.service.js");
      const result = await nexusService.fullSync();
      const count = result?.vulnsCount || 0;
      return { success: true, itemsSynced: count, message: `Synced ${count} Nexus IQ items` };
    } catch (err: any) {
      return { success: false, itemsSynced: 0, message: err.message, errors: [err.message] };
    }
  }
}
