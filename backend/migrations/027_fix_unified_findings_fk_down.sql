-- Down: 027_fix_unified_findings_fk
ALTER TABLE unified_findings DROP CONSTRAINT IF EXISTS unified_findings_application_id_fkey;
ALTER TABLE unified_findings DROP CONSTRAINT IF EXISTS unified_findings_organization_id_fkey;
