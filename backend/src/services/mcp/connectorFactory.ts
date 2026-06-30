import { BaseMcpConnector } from "./baseConnector.js";
import { McpConnector, ConnectorType } from "./mcpRegistry.service.js";
import { SonarqubeMcpConnector } from "./sonarqubeConnector.js";
import { NexusMcpConnector } from "./nexusConnector.js";
import { VeracodeMcpConnector } from "./veracodeConnector.js";
import { FortifyMcpConnector } from "./fortifyConnector.js";
import { JiraMcpConnector } from "./jiraConnector.js";
import { GithubMcpConnector } from "./githubConnector.js";
import { GitlabMcpConnector } from "./gitlabConnector.js";
import { ConfluenceMcpConnector } from "./confluenceConnector.js";
import { SlackMcpConnector } from "./slackConnector.js";
import { logger } from "../../core/logger.js";

const CONNECTOR_MAP: Record<ConnectorType, new (connector: McpConnector) => BaseMcpConnector> = {
  sonarqube: SonarqubeMcpConnector,
  nexus: NexusMcpConnector,
  veracode: VeracodeMcpConnector,
  fortify: FortifyMcpConnector,
  jira: JiraMcpConnector,
  github: GithubMcpConnector,
  gitlab: GitlabMcpConnector,
  confluence: ConfluenceMcpConnector,
  slack: SlackMcpConnector,
};

export function createConnector(connector: McpConnector): BaseMcpConnector {
  const Cls = CONNECTOR_MAP[connector.connectorType];
  if (!Cls) {
    throw new Error(`No connector implementation for type: ${connector.connectorType}`);
  }
  return new Cls(connector);
}

export async function testConnectorById(id: string) {
  const { mcpRegistryService } = await import("./mcpRegistry.service.js");
  const connector = await mcpRegistryService.getById(id);
  const instance = createConnector(connector);
  return instance.testConnection();
}

export async function syncConnectorById(id: string) {
  const { mcpRegistryService } = await import("./mcpRegistry.service.js");
  const connector = await mcpRegistryService.getById(id);
  const instance = createConnector(connector);
  return instance.runSync();
}

export async function testAllConnectors() {
  const { mcpRegistryService } = await import("./mcpRegistry.service.js");
  const connectors = await mcpRegistryService.list({ enabled: true });
  const results: { id: string; name: string; type: string; success: boolean; message: string }[] = [];

  for (const conn of connectors) {
    try {
      const instance = createConnector(conn);
      const result = await instance.testConnection();
      results.push({ id: conn.id, name: conn.name, type: conn.connectorType, success: result.success, message: result.message });
    } catch (err: any) {
      results.push({ id: conn.id, name: conn.name, type: conn.connectorType, success: false, message: err.message });
    }
  }

  return results;
}
