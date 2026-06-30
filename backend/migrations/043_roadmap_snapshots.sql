-- ============================================================================
-- Migration 043: Roadmap Snapshot Engine
-- Stores immutable monthly/ad-hoc snapshots of roadmap state for delta analysis
-- ============================================================================

CREATE TABLE roadmap_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  label VARCHAR(255),
  roadmap_id UUID REFERENCES roadmaps(id) ON DELETE CASCADE,
  -- Roadmap-level snapshot data
  progress NUMERIC(5,2),
  milestone_status VARCHAR(50),
  total_projects INTEGER DEFAULT 0,
  on_track_count INTEGER DEFAULT 0,
  deviating_count INTEGER DEFAULT 0,
  high_risk_count INTEGER DEFAULT 0,
  total_budget NUMERIC(12,2) DEFAULT 0,
  total_consumed NUMERIC(12,2) DEFAULT 0,
  avg_rtd NUMERIC(10,2) DEFAULT 0,
  avg_rtd_deviation NUMERIC(5,2) DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  immutable BOOLEAN DEFAULT TRUE
);

CREATE TABLE roadmap_snapshot_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id UUID REFERENCES roadmap_snapshots(id) ON DELETE CASCADE,
  project_id UUID,
  project_name VARCHAR(255),
  project_code VARCHAR(50),
  status VARCHAR(50),
  rtd_value NUMERIC(10,2) DEFAULT 0,
  rtd_deviation NUMERIC(5,2) DEFAULT 0,
  slippage_md NUMERIC(10,2) DEFAULT 0,
  test_automation_rate NUMERIC(5,2) DEFAULT 0,
  go_live_readiness_state VARCHAR(50),
  initial_budget NUMERIC(12,2) DEFAULT 0,
  consumed_budget NUMERIC(12,2) DEFAULT 0
);

CREATE INDEX idx_snapshot_roadmap ON roadmap_snapshots(roadmap_id);
CREATE INDEX idx_snapshot_date ON roadmap_snapshots(snapshot_date);
CREATE INDEX idx_snapshot_items_snapshot ON roadmap_snapshot_items(snapshot_id);
