-- ============================================================================
-- Migration 027: Fix FK constraints from waivers/risk_acceptances to
-- point to unified_findings instead of the old vulnerabilities table
-- ============================================================================

-- Fix waivers FK
ALTER TABLE waivers DROP CONSTRAINT IF EXISTS waivers_vulnerability_id_fkey;
UPDATE waivers w SET vulnerability_id = uf.id
FROM unified_findings uf
WHERE uf.source_id = w.vulnerability_id::text
  AND uf.source_table IN ('vulnerabilities', 'nexus_vulnerabilities');
ALTER TABLE waivers ADD CONSTRAINT waivers_vulnerability_id_fkey
  FOREIGN KEY (vulnerability_id) REFERENCES unified_findings(id) ON DELETE CASCADE;

-- Fix risk_acceptances FK
ALTER TABLE risk_acceptances DROP CONSTRAINT IF EXISTS risk_acceptances_vulnerability_id_fkey;
UPDATE risk_acceptances ra SET vulnerability_id = uf.id
FROM unified_findings uf
WHERE uf.source_id = ra.vulnerability_id::text
  AND uf.source_table IN ('vulnerabilities', 'nexus_vulnerabilities');
ALTER TABLE risk_acceptances ADD CONSTRAINT risk_acceptances_vulnerability_id_fkey
  FOREIGN KEY (vulnerability_id) REFERENCES unified_findings(id) ON DELETE CASCADE;
