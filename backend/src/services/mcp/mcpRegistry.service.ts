import { query } from "../../config/database.js";
import { randomUUID } from "crypto";
import { NotFoundError } from "../../core/errors.js";

export type ConnectorType = "sonarqube" | "nexus" | "veracode" | "fortify" | "jira" | "github" | "gitlab" | "confluence" | "slack";

export interface McpConnector {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  connectorType: ConnectorType;
  description?: string;
  config: Record<string, any>;
  status: string;
  lastSyncAt?: string;
  lastSyncStatus?: string;
  lastError?: string;
  isEnabled: boolean;
}

const COLS = [
  "id", "created_at", "updated_at", "name", "connector_type",
  "description", "config", "status", "last_sync_at",
  "last_sync_status", "last_error", "is_enabled",
];

function row(r: any): McpConnector {
  return {
    id: r.id, createdAt: r.created_at, updatedAt: r.updated_at,
    name: r.name, connectorType: r.connector_type,
    description: r.description,
    config: typeof r.config === "string" ? JSON.parse(r.config) : r.config,
    status: r.status, lastSyncAt: r.last_sync_at,
    lastSyncStatus: r.last_sync_status, lastError: r.last_error,
    isEnabled: r.is_enabled,
  };
}

export const mcpRegistryService = {
  async list(filters?: { connectorType?: string; enabled?: boolean }) {
    const params: any[] = [];
    let idx = 1;
    const conds: string[] = [];
    if (filters?.connectorType) { conds.push(`connector_type = $${idx++}`); params.push(filters.connectorType); }
    if (filters?.enabled !== undefined) { conds.push(`is_enabled = $${idx++}`); params.push(filters.enabled); }
    const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
    const result = await query(`SELECT ${COLS.join(", ")} FROM mcp_connectors ${where} ORDER BY connector_type, name`, params);
    return result.rows.map(row);
  },

  async getById(id: string) {
    const result = await query(`SELECT ${COLS.join(", ")} FROM mcp_connectors WHERE id = $1`, [id]);
    if (!result.rows.length) throw new NotFoundError("Connector not found");
    return row(result.rows[0]);
  },

  async create(payload: { name: string; connectorType: ConnectorType; description?: string; config: Record<string, any> }) {
    const id = `mcp_${randomUUID().slice(0, 8)}`;
    const result = await query(
      `INSERT INTO mcp_connectors (id, name, connector_type, description, config) VALUES ($1, $2, $3, $4, $5) RETURNING ${COLS.join(", ")}`,
      [id, payload.name, payload.connectorType, payload.description || null, JSON.stringify(payload.config)]
    );
    return row(result.rows[0]);
  },

  async update(id: string, payload: Partial<{ name: string; description: string; config: Record<string, any>; isEnabled: boolean }>) {
    const existing = await this.getById(id);
    const fields: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (payload.name !== undefined) { fields.push(`name = $${idx++}`); params.push(payload.name); }
    if (payload.description !== undefined) { fields.push(`description = $${idx++}`); params.push(payload.description); }
    if (payload.config !== undefined) { fields.push(`config = $${idx++}`); params.push(JSON.stringify(payload.config)); }
    if (payload.isEnabled !== undefined) { fields.push(`is_enabled = $${idx++}`); params.push(payload.isEnabled); }

    if (!fields.length) return existing;
    fields.push("updated_at = NOW()");
    params.push(id);

    const result = await query(
      `UPDATE mcp_connectors SET ${fields.join(", ")} WHERE id = $${idx} RETURNING ${COLS.join(", ")}`,
      params
    );
    return row(result.rows[0]);
  },

  async delete(id: string) {
    await this.getById(id);
    await query("DELETE FROM mcp_connectors WHERE id = $1", [id]);
  },

  async updateStatus(id: string, status: string, error?: string) {
    const params: any[] = [status, id];
    if (error) {
      await query("UPDATE mcp_connectors SET status = $1, last_error = $2, updated_at = NOW() WHERE id = $3", [status, error, id]);
    } else {
      await query("UPDATE mcp_connectors SET status = $1, updated_at = NOW() WHERE id = $2", [status, id]);
    }
  },

  async updateSyncStatus(id: string, status: string, error?: string) {
    const now = new Date().toISOString();
    if (error) {
      await query(
        "UPDATE mcp_connectors SET last_sync_at = $1, last_sync_status = $2, last_error = $3, status = $4, updated_at = NOW() WHERE id = $5",
        [now, status, error, status === "error" ? "error" : "connected", id]
      );
    } else {
      await query(
        "UPDATE mcp_connectors SET last_sync_at = $1, last_sync_status = $2, status = 'connected', updated_at = NOW() WHERE id = $3",
        [now, status, id]
      );
    }
  },

  async logWebhookEvent(connectorId: string, source: string, eventType: string, payload: any) {
    const id = `wh_${randomUUID().slice(0, 8)}`;
    await query(
      `INSERT INTO mcp_webhook_events (id, connector_id, source, event_type, payload) VALUES ($1, $2, $3, $4, $5)`,
      [id, connectorId, source, eventType, JSON.stringify(payload)]
    );
    return id;
  },

  async getWebhookEvents(connectorId: string, limit = 20) {
    const result = await query(
      `SELECT id, created_at, source, event_type, status, processed_at FROM mcp_webhook_events WHERE connector_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [connectorId, limit]
    );
    return result.rows.map(r => ({ id: r.id, createdAt: r.created_at, source: r.source, eventType: r.event_type, status: r.status, processedAt: r.processed_at }));
  },
};
