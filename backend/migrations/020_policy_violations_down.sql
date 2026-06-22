-- ============================================================================
-- Migration 020 Down: Policy Violation Tracking
-- ============================================================================

DROP TABLE IF EXISTS policy_rules;

ALTER TABLE scan_reports
  DROP COLUMN IF EXISTS total_policy_violations,
  DROP COLUMN IF EXISTS critical_violations,
  DROP COLUMN IF EXISTS high_violations,
  DROP COLUMN IF EXISTS medium_violations,
  DROP COLUMN IF EXISTS low_violations;
