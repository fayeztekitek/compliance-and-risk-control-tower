-- ============================================================================
-- Migration 017 DOWN: Revert org & app enhancements
-- ============================================================================

DROP TRIGGER IF EXISTS update_org_compliance_posture_updated_at ON org_compliance_posture;
DROP INDEX IF EXISTS idx_org_posture_org;
DROP INDEX IF EXISTS idx_org_posture_grade;
DROP INDEX IF EXISTS idx_nexus_products_org;
DROP INDEX IF EXISTS idx_nexus_products_owner;
DROP INDEX IF EXISTS idx_nexus_apps_owner;
DROP TABLE IF EXISTS org_compliance_posture;

ALTER TABLE nexus_applications
  DROP COLUMN IF EXISTS business_owner,
  DROP COLUMN IF EXISTS technical_owner;

ALTER TABLE nexus_products
  DROP COLUMN IF EXISTS business_owner,
  DROP COLUMN IF EXISTS technical_owner,
  DROP COLUMN IF EXISTS organization_id;

ALTER TABLE nexus_organizations
  DROP COLUMN IF EXISTS description,
  DROP COLUMN IF EXISTS compliance_officer;
