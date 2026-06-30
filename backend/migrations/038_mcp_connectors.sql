CREATE TABLE IF NOT EXISTS mcp_connectors (
  id VARCHAR(100) PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name VARCHAR(255) NOT NULL,
  connector_type VARCHAR(50) NOT NULL,
  description TEXT,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR(20) NOT NULL DEFAULT 'disconnected',
  last_sync_at TIMESTAMPTZ,
  last_sync_status VARCHAR(20),
  last_error TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_mcp_type ON mcp_connectors(connector_type);
CREATE INDEX IF NOT EXISTS idx_mcp_status ON mcp_connectors(status);
CREATE INDEX IF NOT EXISTS idx_mcp_enabled ON mcp_connectors(is_enabled) WHERE is_enabled = TRUE;

-- Webhook events
CREATE TABLE IF NOT EXISTS mcp_webhook_events (
  id VARCHAR(100) PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  connector_id VARCHAR(100) REFERENCES mcp_connectors(id) ON DELETE CASCADE,
  source VARCHAR(50) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR(20) NOT NULL DEFAULT 'received',
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_mcp_wh_connector ON mcp_webhook_events(connector_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mcp_wh_status ON mcp_webhook_events(status);
