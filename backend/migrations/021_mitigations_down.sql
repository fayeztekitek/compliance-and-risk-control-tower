-- ============================================================================
-- Migration 021 Down: Mitigation & Accepted Risk Workflow
-- ============================================================================

ALTER TABLE unified_findings DROP COLUMN IF EXISTS mitigation_id;
DROP TABLE IF EXISTS mitigations;
