-- ============================================================================
-- Migration 014: Migrate security.vulnerabilities → unified_findings
-- Maps each vulnerability record to unified_findings with source_tool
-- determined by source_scanner.
-- ============================================================================

INSERT INTO unified_findings (
  source_tool, source_id, source_table,
  target_product, title, description,
  unified_severity, native_severity, cvss_score, cvss_vector, cve_id, cwe_id,
  status, detected_date, remediated_date, sla_due_date,
  risk_score,
  waiver_id, risk_acceptance_id,
  deleted_at,
  metadata
)
SELECT
  CASE source_scanner
    WHEN 'VERACODE' THEN 'VERACODE'::finding_source
    WHEN 'NEXPOSE' THEN 'NEXPOSE'::finding_source
    WHEN 'PEN_TEST' THEN 'PEN_TEST'::finding_source
    ELSE 'INTERNAL'::finding_source
  END,
  id::text,
  'vulnerabilities',
  target_product,
  title,
  NULL::text,
  severity,
  severity::text,
  NULL::numeric,
  NULL::text,
  NULL::text,
  NULL::text,
  CASE status
    WHEN 'OPEN' THEN 'OPEN'::unified_finding_status
    WHEN 'FALSE_POSITIVE' THEN 'FALSE_POSITIVE'::unified_finding_status
    WHEN 'WAIVED' THEN 'WAIVED'::unified_finding_status
    WHEN 'REMEDIATED' THEN 'FIXED'::unified_finding_status
  END,
  detected_date,
  remediated_date,
  sla_due_date,
  CASE severity
    WHEN 'CRITICAL' THEN 70
    WHEN 'HIGH' THEN 50
    WHEN 'MEDIUM' THEN 30
    ELSE 10
  END,
  waiver_id,
  risk_acceptance_id,
  deleted_at,
  jsonb_build_object(
    'source_scanner', source_scanner,
    'explanation_false_positive', explanation_false_positive,
    'owner', owner,
    'is_false_positive', is_false_positive
  )
FROM vulnerabilities;
