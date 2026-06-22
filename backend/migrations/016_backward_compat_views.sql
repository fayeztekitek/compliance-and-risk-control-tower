-- ============================================================================
-- Migration 016: Backward-Compatible Views
-- Creates views that mimic the old table shapes so existing queries still work
-- during the transition period.
-- ============================================================================

CREATE OR REPLACE VIEW vulnerabilities_view AS
SELECT
  id,
  created_at,
  updated_at,
  title,
  unified_severity AS severity,
  CASE status
    WHEN 'OPEN' THEN 'OPEN'::vuln_status
    WHEN 'FALSE_POSITIVE' THEN 'FALSE_POSITIVE'::vuln_status
    WHEN 'WAIVED' THEN 'WAIVED'::vuln_status
    WHEN 'FIXED' THEN 'REMEDIATED'::vuln_status
    ELSE 'OPEN'::vuln_status
  END AS status,
  CASE source_tool
    WHEN 'VERACODE' THEN 'VERACODE'::scanner_source
    WHEN 'NEXPOSE' THEN 'NEXPOSE'::scanner_source
    WHEN 'PEN_TEST' THEN 'PEN_TEST'::scanner_source
    ELSE 'PEN_TEST'::scanner_source
  END AS source_scanner,
  detected_date,
  remediated_date,
  sla_due_date,
  (metadata->>'is_false_positive')::boolean AS is_false_positive,
  metadata->>'explanation_false_positive' AS explanation_false_positive,
  target_product,
  metadata->>'owner' AS owner,
  waiver_id,
  risk_acceptance_id,
  deleted_at
FROM unified_findings
WHERE source_tool IN ('VERACODE', 'NEXPOSE', 'PEN_TEST', 'INTERNAL')
  AND deleted_at IS NULL;

CREATE OR REPLACE VIEW nexus_vulnerabilities_view AS
SELECT
  uf.id,
  uf.created_at,
  uf.updated_at,
  uf.source_id AS vulnerability_id,
  uf.metadata->>'ref_id' AS ref_id,
  uf.cvss_score,
  uf.cvss_vector,
  uf.unified_severity AS severity,
  uf.component_name,
  uf.component_version,
  uf.package_url,
  uf.dependency_type,
  uf.reachability AS reachable,
  uf.recommended_version,
  uf.fix_available,
  uf.exploitability,
  uf.age_in_days,
  uf.first_seen_date,
  uf.last_seen_date,
  CASE uf.status
    WHEN 'OPEN' THEN 'Open'::nexus_vuln_status
    WHEN 'FIXED' THEN 'Fixed'::nexus_vuln_status
    WHEN 'ACCEPTED' THEN 'Accepted'::nexus_vuln_status
    WHEN 'WAIVED' THEN 'Waived'::nexus_vuln_status
    WHEN 'FALSE_POSITIVE' THEN 'False Positive'::nexus_vuln_status
    ELSE 'Open'::nexus_vuln_status
  END AS status,
  uf.application_id,
  uf.scan_id
FROM unified_findings uf
WHERE uf.source_tool = 'NEXUS'::finding_source
  AND uf.deleted_at IS NULL;
