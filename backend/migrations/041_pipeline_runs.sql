CREATE TABLE IF NOT EXISTS pipeline_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  source VARCHAR(50) NOT NULL CHECK (source IN ('github_actions', 'gitlab_ci', 'manual')),
  source_run_id VARCHAR(255),
  project VARCHAR(255) NOT NULL,
  pipeline_name VARCHAR(255),
  status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'success', 'failure', 'cancelled', 'skipped', 'error')),
  branch VARCHAR(255),
  commit_sha VARCHAR(255),
  commit_message TEXT,
  trigger_actor VARCHAR(255),
  url TEXT,
  duration_seconds INT,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  connector_id VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_pipeline_runs_source ON pipeline_runs (source, status);
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_project ON pipeline_runs (project, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_created ON pipeline_runs (created_at DESC);

CREATE TABLE IF NOT EXISTS pipeline_policy_gates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  pipeline_run_id UUID NOT NULL REFERENCES pipeline_runs(id) ON DELETE CASCADE,
  policy_rule_id UUID REFERENCES policy_rules(id) ON DELETE SET NULL,
  gate_name VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'pass', 'fail', 'error', 'skipped')),
  result JSONB DEFAULT '{}'::jsonb,
  evaluated_at TIMESTAMPTZ,
  evaluated_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_pipeline_gates_run ON pipeline_policy_gates (pipeline_run_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_gates_status ON pipeline_policy_gates (status);
