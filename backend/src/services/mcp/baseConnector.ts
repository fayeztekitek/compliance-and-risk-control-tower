import { mcpRegistryService, McpConnector } from "./mcpRegistry.service.js";
import { logger } from "../../core/logger.js";

export interface ConnectorSyncResult {
  success: boolean;
  itemsSynced: number;
  message: string;
  errors?: string[];
}

export abstract class BaseMcpConnector {
  protected connector: McpConnector;

  constructor(connector: McpConnector) {
    this.connector = connector;
  }

  abstract testConnection(): Promise<{ success: boolean; message: string }>;

  abstract sync(): Promise<ConnectorSyncResult>;

  get id() { return this.connector.id; }
  get type() { return this.connector.connectorType; }
  get name() { return this.connector.name; }

  protected getConfig(key: string): any {
    return this.connector.config[key];
  }

  protected async updateStatus(status: string, error?: string) {
    await mcpRegistryService.updateStatus(this.connector.id, status, error);
    this.connector.status = status;
    if (error) this.connector.lastError = error;
  }

  protected async updateSyncResult(result: ConnectorSyncResult) {
    await mcpRegistryService.updateSyncStatus(
      this.connector.id,
      result.success ? "success" : "error",
      result.success ? undefined : result.errors?.join("; ")
    );
  }

  async runSync(): Promise<ConnectorSyncResult> {
    logger.info({ connector: this.name, type: this.type }, "MCP sync started");
    await this.updateStatus("syncing");
    try {
      const result = await this.sync();
      await this.updateSyncResult(result);
      logger.info({ connector: this.name, type: this.type, result }, "MCP sync completed");
      return result;
    } catch (err: any) {
      logger.error({ err, connector: this.name, type: this.type }, "MCP sync failed");
      const result: ConnectorSyncResult = { success: false, itemsSynced: 0, message: err.message, errors: [err.message] };
      await this.updateSyncResult(result);
      return result;
    }
  }
}
