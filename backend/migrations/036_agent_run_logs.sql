CREATE TABLE IF NOT EXISTS agent_run_logs (
  id VARCHAR(100) PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  agent_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  duration_ms INT,
  trigger_type VARCHAR(20) NOT NULL DEFAULT 'manual',
  input_summary VARCHAR(500),
  output_summary TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_arl_agent ON agent_run_logs(agent_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_arl_status ON agent_run_logs(status);
CREATE INDEX IF NOT EXISTS idx_arl_created ON agent_run_logs(created_at DESC);
