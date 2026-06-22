DROP TRIGGER IF EXISTS update_vulnerability_enrichments_updated_at ON vulnerability_enrichments;
DROP TRIGGER IF EXISTS update_unified_findings_updated_at ON unified_findings;
DROP TABLE IF EXISTS vulnerability_enrichments;
DROP TABLE IF EXISTS unified_findings;
DROP TYPE IF EXISTS regulatory_framework;
DROP TYPE IF EXISTS unified_finding_status;
DROP TYPE IF EXISTS finding_source;
