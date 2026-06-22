-- ============================================================================
-- Migration 021: Mitigation & Accepted Risk Workflow
-- Creates mitigations table and links to unified_findings for full
-- proposal → approval → verification → closure lifecycle.
-- ============================================================================

CREATE TABLE IF NOT EXISTS mitigations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  finding_id UUID NOT NULL REFERENCES unified_findings(id) ON DELETE CASCADE,
  mitigation_type VARCHAR(50) NOT NULL DEFAULT 'FIX',
  target_component_version VARCHAR(100),
  target_release VARCHAR(100),
  owner VARCHAR(255),
  due_date DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'PROPOSED',
  evidence TEXT,
  verified_by VARCHAR(255),
  verified_date TIMESTAMPTZ,
  notes TEXT
);

-- Status constraint
ALTER TABLE mitigations DROP CONSTRAINT IF EXISTS ck_mitigation_status;
ALTER TABLE mitigations ADD CONSTRAINT ck_mitigation_status
  CHECK (status IN ('PROPOSED', 'IN_PROGRESS', 'VERIFIED', 'CLOSED', 'REJECTED'));

-- Mitigation type constraint
ALTER TABLE mitigations DROP CONSTRAINT IF EXISTS ck_mitigation_type;
ALTER TABLE mitigations ADD CONSTRAINT ck_mitigation_type
  CHECK (mitigation_type IN ('UPGRADE', 'PATCH', 'WORKAROUND', 'ACCEPT', 'FIX'));

-- Link mitigations to unified_findings
ALTER TABLE unified_findings
  ADD COLUMN IF NOT EXISTS mitigation_id UUID REFERENCES mitigations(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mit_finding ON mitigations(finding_id);
CREATE INDEX IF NOT EXISTS idx_mit_status ON mitigations(status);
CREATE INDEX IF NOT EXISTS idx_mit_owner ON mitigations(owner);
CREATE INDEX IF NOT EXISTS idx_mit_due_date ON mitigations(due_date);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_mitigations_updated_at ON mitigations;
CREATE TRIGGER update_mitigations_updated_at
  BEFORE UPDATE ON mitigations
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();
