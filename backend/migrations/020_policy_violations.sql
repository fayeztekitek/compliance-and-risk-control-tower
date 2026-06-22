-- ============================================================================
-- Migration 020: Policy Violation Tracking
-- Creates policy_rules reference table and augments scan_reports with
-- policy violation summary columns for trend analysis.
-- ============================================================================

-- Policy rules reference table
CREATE TABLE IF NOT EXISTS policy_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  policy_id VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  threat_level VARCHAR(50) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  CONSTRAINT uq_policy_id UNIQUE (policy_id)
);

-- Augment scan_reports with policy violation summary columns
ALTER TABLE scan_reports
  ADD COLUMN IF NOT EXISTS total_policy_violations INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS critical_violations INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS high_violations INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS medium_violations INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS low_violations INTEGER DEFAULT 0;

-- Indexes for trend queries
CREATE INDEX IF NOT EXISTS idx_sr_policy_violations ON scan_reports(total_policy_violations);
CREATE INDEX IF NOT EXISTS idx_pr_threat ON policy_rules(threat_level);
CREATE INDEX IF NOT EXISTS idx_pr_category ON policy_rules(category);
