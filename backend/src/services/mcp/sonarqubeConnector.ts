import { BaseMcpConnector, ConnectorSyncResult } from "./baseConnector.js";
import { SonarqubeHttpClient } from "../sonarqubeHttpClient.js";
import { sonarqubePollService } from "../sonarqubePollService.js";
import { mcpRegistryService } from "./mcpRegistry.service.js";
import { logger } from "../../core/logger.js";

export class SonarqubeMcpConnector extends BaseMcpConnector {
  private createClient() {
    const url = this.getConfig("url") || "";
    const token = this.getConfig("token") || "";
    if (!url || !token) throw new Error("SonarQube URL and token are required");
    return new SonarqubeHttpClient(url, token);
  }

  async testConnection() {
    try {
      const client = this.createClient();
      await client.getProjects();
      await this.updateStatus("connected");
      return { success: true, message: "Connected to SonarQube successfully" };
    } catch (err: any) {
      await this.updateStatus("error", err.message);
      return { success: false, message: `Connection failed: ${err.message}` };
    }
  }

  async sync() {
    const client = this.createClient();
    const result = await sonarqubePollService.sync(client);
    const errors: string[] = [];
    let synced = 0;
    if (Array.isArray(result)) synced = result.length;
    const success = true;
    return { success, itemsSynced: synced, message: `Synced ${synced} SonarQube findings`, errors };
  }

  static async fromEnv() {
    const { env } = await import("../../config/env.js");
    if (!env.SONARQUBE_URL || !env.SONARQUBE_TOKEN) return null;

    const existing = await mcpRegistryService.list({ connectorType: "sonarqube" });
    if (existing.length > 0) return existing[0];

    return mcpRegistryService.create({
      name: "SonarQube (auto)",
      connectorType: "sonarqube",
      description: "Auto-registered from environment variables",
      config: { url: env.SONARQUBE_URL, token: env.SONARQUBE_TOKEN },
    });
  }
}
