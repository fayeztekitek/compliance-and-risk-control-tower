-- ============================================================================
-- Migration 017: Organizations & Applications Model Enhancement
-- Aligns with security.md business model: adds business_owner, technical_owner,
-- organization_id to products, compliance_officer + description to orgs,
-- and creates org_compliance_posture table.
-- ============================================================================

ALTER TABLE nexus_organizations
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS compliance_officer VARCHAR(255);

ALTER TABLE nexus_products
  ADD COLUMN IF NOT EXISTS business_owner VARCHAR(255),
  ADD COLUMN IF NOT EXISTS technical_owner VARCHAR(255),
  ADD COLUMN IF NOT EXISTS organization_id VARCHAR(100) REFERENCES nexus_organizations(organization_id);

ALTER TABLE nexus_applications
  ADD COLUMN IF NOT EXISTS business_owner VARCHAR(255),
  ADD COLUMN IF NOT EXISTS technical_owner VARCHAR(255);

CREATE TABLE IF NOT EXISTS org_compliance_posture (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  organization_id VARCHAR(100) UNIQUE NOT NULL REFERENCES nexus_organizations(organization_id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_findings INTEGER DEFAULT 0,
  critical_findings INTEGER DEFAULT 0,
  high_findings INTEGER DEFAULT 0,
  open_findings INTEGER DEFAULT 0,
  accepted_risks INTEGER DEFAULT 0,
  overdue_findings INTEGER DEFAULT 0,
  avg_risk_score NUMERIC(5,2) DEFAULT 0,
  fix_velocity_pct NUMERIC(5,2) DEFAULT 0,
  sla_breach_pct NUMERIC(5,2) DEFAULT 0,
  compliance_score NUMERIC(5,2) DEFAULT 100.00,
  posture_grade product_grade DEFAULT 'GREEN',
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_org_posture_org ON org_compliance_posture(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_posture_grade ON org_compliance_posture(posture_grade);

DROP TRIGGER IF EXISTS update_org_compliance_posture_updated_at ON org_compliance_posture;
CREATE TRIGGER update_org_compliance_posture_updated_at
  BEFORE UPDATE ON org_compliance_posture
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Index for faster lookups on new columns
CREATE INDEX IF NOT EXISTS idx_nexus_products_org ON nexus_products(organization_id);
CREATE INDEX IF NOT EXISTS idx_nexus_products_owner ON nexus_products(business_owner);
CREATE INDEX IF NOT EXISTS idx_nexus_apps_owner ON nexus_applications(business_owner);
