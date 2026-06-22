-- ============================================================================
-- Migration 015: Migrate nexus_vulnerabilities → unified_findings
-- Maps each nexus vulnerability record with full context preservation.
-- ============================================================================

INSERT INTO unified_findings (
  source_tool, source_id, source_table,
  product_id, application_id,
  title, description,
  unified_severity, native_severity, cvss_score, cvss_vector, cve_id, cwe_id,
  status, detected_date, remediated_date, sla_due_date,
  epss_score, cisa_kev, risk_score,
  component_name, component_version, package_url,
  dependency_type, reachability, exploitability, age_in_days,
  first_seen_date, last_seen_date, scan_id, fix_available,
  recommended_version,
  metadata
)
SELECT
  'NEXUS'::finding_source,
  vulnerability_id,
  'nexus_vulnerabilities',
  NULL,
  NULL,  -- application_id type mismatch (varchar vs uuid); resolved via new sync pipeline
  component_name || ':' || component_version,
  NULL::text,
  severity,
  severity::text,
  cvss_score,
  cvss_vector,
  NULL::text,
  NULL::text,
  CASE status
    WHEN 'Open' THEN 'OPEN'::unified_finding_status
    WHEN 'Fixed' THEN 'FIXED'::unified_finding_status
    WHEN 'Accepted' THEN 'ACCEPTED'::unified_finding_status
    WHEN 'Waived' THEN 'WAIVED'::unified_finding_status
    WHEN 'False Positive' THEN 'FALSE_POSITIVE'::unified_finding_status
  END,
  first_seen_date,
  NULL::date,
  NULL::date,
  0,
  FALSE,
  CASE severity
    WHEN 'CRITICAL' THEN 70
    WHEN 'HIGH' THEN 50
    WHEN 'MEDIUM' THEN 30
    ELSE 10
  END * 1.0,
  component_name,
  component_version,
  package_url,
  dependency_type,
  reachable,
  exploitability,
  age_in_days,
  first_seen_date,
  last_seen_date,
  scan_id,
  fix_available,
  recommended_version,
  jsonb_build_object(
    'ref_id', ref_id,
    'original_vulnerability_id', vulnerability_id
  )
FROM nexus_vulnerabilities;
