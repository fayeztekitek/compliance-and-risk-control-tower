CREATE TABLE IF NOT EXISTS agent_recommendations (
  id VARCHAR(100) PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  agent_type VARCHAR(50) NOT NULL,
  run_id VARCHAR(100) REFERENCES agent_run_logs(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  severity VARCHAR(20) NOT NULL DEFAULT 'info',
  category VARCHAR(50),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  is_dismissed BOOLEAN NOT NULL DEFAULT FALSE,
  action_url VARCHAR(500),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_arec_agent ON agent_recommendations(agent_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_arec_unread ON agent_recommendations(is_read, is_dismissed) WHERE is_read = FALSE AND is_dismissed = FALSE;
CREATE INDEX IF NOT EXISTS idx_arec_severity ON agent_recommendations(severity);
