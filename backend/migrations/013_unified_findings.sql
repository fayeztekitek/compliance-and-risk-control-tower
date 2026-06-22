-- ============================================================================
-- Migration 013: Unified Findings Table
-- Creates the unified_findings table to replace vulnerabilities and
-- nexus_vulnerabilities with a single cross-tool finding store.
-- ============================================================================

CREATE TYPE finding_source AS ENUM (
  'NEXUS', 'FORTIFY', 'SONARQUBE', 'VERACODE', 'INTERNAL', 'PEN_TEST', 'NEXPOSE'
);

CREATE TYPE unified_finding_status AS ENUM (
  'OPEN', 'FIXED', 'ACCEPTED', 'WAIVED', 'FALSE_POSITIVE', 'UNDER_REVIEW'
);

CREATE TYPE regulatory_framework AS ENUM (
  'GDPR', 'DORA', 'SOX', 'PCI_DSS', 'ISO_27001', 'NIST_800_53', 'NONE'
);

CREATE TABLE unified_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  source_tool finding_source NOT NULL,
  source_id VARCHAR(255),
  source_table VARCHAR(50),

  product_id UUID REFERENCES nexus_products(id) ON DELETE SET NULL,
  application_id UUID REFERENCES nexus_applications(id) ON DELETE SET NULL,
  target_product VARCHAR(255),

  title TEXT NOT NULL,
  description TEXT,
  unified_severity severity NOT NULL,
  native_severity VARCHAR(50),
  cvss_score NUMERIC(3,1),
  cvss_vector VARCHAR(255),
  cve_id VARCHAR(20),
  cwe_id VARCHAR(20),

  status unified_finding_status NOT NULL DEFAULT 'OPEN',
  remediation TEXT,
  fix_available BOOLEAN DEFAULT FALSE,
  recommended_version VARCHAR(100),
  detected_date DATE NOT NULL DEFAULT CURRENT_DATE,
  remediated_date DATE,
  sla_due_date DATE,

  epss_score NUMERIC(6,5) DEFAULT 0,
  cisa_kev BOOLEAN DEFAULT FALSE,
  risk_score NUMERIC(5,2),

  component_name VARCHAR(255),
  component_version VARCHAR(100),
  package_url TEXT,
  dependency_type dependency_type,
  reachability reachability,
  exploitability exploitability,
  age_in_days INTEGER DEFAULT 0,
  first_seen_date DATE,
  last_seen_date DATE,
  scan_id VARCHAR(100),

  regulatory_tags regulatory_framework[] DEFAULT '{}',
  pii_impact BOOLEAN DEFAULT FALSE,

  waiver_id UUID,
  risk_acceptance_id UUID,
  audit_finding_id UUID,

  deleted_at TIMESTAMPTZ,

  metadata JSONB
);

CREATE INDEX idx_uf_source ON unified_findings(source_tool);
CREATE INDEX idx_uf_severity ON unified_findings(unified_severity);
CREATE INDEX idx_uf_status ON unified_findings(status);
CREATE INDEX idx_uf_product ON unified_findings(product_id);
CREATE INDEX idx_uf_cve ON unified_findings(cve_id);
CREATE INDEX idx_uf_cvss ON unified_findings(cvss_score);
CREATE INDEX idx_uf_epss ON unified_findings(epss_score);
CREATE INDEX idx_uf_sla ON unified_findings(sla_due_date);
CREATE INDEX idx_uf_regulatory ON unified_findings USING GIN(regulatory_tags);
CREATE INDEX idx_uf_risk ON unified_findings(risk_score);
CREATE INDEX idx_uf_deleted ON unified_findings(deleted_at);

CREATE TABLE vulnerability_enrichments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  cve_id VARCHAR(20) UNIQUE NOT NULL,
  epss_score NUMERIC(6,5) DEFAULT 0,
  epss_percentile NUMERIC(6,5) DEFAULT 0,
  cisa_kev BOOLEAN DEFAULT FALSE,
  cisa_kev_date DATE,
  cisa_kev_description TEXT,
  last_fetched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_enrich_cve ON vulnerability_enrichments(cve_id);
CREATE INDEX idx_enrich_epss ON vulnerability_enrichments(epss_score);

CREATE TRIGGER update_unified_findings_updated_at
  BEFORE UPDATE ON unified_findings
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_vulnerability_enrichments_updated_at
  BEFORE UPDATE ON vulnerability_enrichments
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();
