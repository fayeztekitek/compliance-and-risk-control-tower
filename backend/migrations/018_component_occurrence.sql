-- ============================================================================
-- Migration 018: Component & Occurrence Registry
-- Creates tables for tracking components and vulnerability occurrences
-- separately from unified_findings, enabling distinct vs occurrence counting.
-- ============================================================================

-- Component registry: tracks unique component identities across all scanners
CREATE TABLE IF NOT EXISTS finding_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  group_id VARCHAR(255),
  artifact_id VARCHAR(255),
  version VARCHAR(100) NOT NULL,
  package_url TEXT,
  hash VARCHAR(255),
  license_type VARCHAR(100),
  component_name VARCHAR(255),
  CONSTRAINT uq_component_coordinates UNIQUE (group_id, artifact_id, version)
);

-- Vulnerability occurrences: each path/module where a vulnerability was found
CREATE TABLE IF NOT EXISTS finding_occurrences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  finding_id UUID NOT NULL REFERENCES unified_findings(id) ON DELETE CASCADE,
  component_id UUID REFERENCES finding_components(id) ON DELETE SET NULL,
  path TEXT,
  module VARCHAR(255),
  scope VARCHAR(50),
  first_detected_date DATE DEFAULT CURRENT_DATE,
  last_detected_date DATE DEFAULT CURRENT_DATE,
  occurrence_status VARCHAR(50) DEFAULT 'ACTIVE'
);

-- Scan reports: unified scan report tracking across all scanners
CREATE TABLE IF NOT EXISTS scan_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  application_id VARCHAR(100),
  scanner_source finding_source NOT NULL,
  report_date DATE NOT NULL,
  report_version VARCHAR(50),
  scan_type VARCHAR(50),
  raw_report_id VARCHAR(255),
  imported_at TIMESTAMPTZ DEFAULT NOW(),
  total_findings INTEGER DEFAULT 0,
  total_occurrences INTEGER DEFAULT 0,
  metadata JSONB
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fo_finding ON finding_occurrences(finding_id);
CREATE INDEX IF NOT EXISTS idx_fo_component ON finding_occurrences(component_id);
CREATE INDEX IF NOT EXISTS idx_fo_path ON finding_occurrences(path);
CREATE INDEX IF NOT EXISTS idx_fo_status ON finding_occurrences(occurrence_status);
CREATE INDEX IF NOT EXISTS idx_fc_coordinates ON finding_components(group_id, artifact_id);
CREATE INDEX IF NOT EXISTS idx_fc_purl ON finding_components(package_url);
CREATE INDEX IF NOT EXISTS idx_fc_name ON finding_components(component_name);
CREATE INDEX IF NOT EXISTS idx_sr_app ON scan_reports(application_id);
CREATE INDEX IF NOT EXISTS idx_sr_date ON scan_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_sr_source ON scan_reports(scanner_source);

-- Triggers
DROP TRIGGER IF EXISTS update_finding_components_updated_at ON finding_components;
CREATE TRIGGER update_finding_components_updated_at
  BEFORE UPDATE ON finding_components
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_finding_occurrences_updated_at ON finding_occurrences;
CREATE TRIGGER update_finding_occurrences_updated_at
  BEFORE UPDATE ON finding_occurrences
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_scan_reports_updated_at ON scan_reports;
CREATE TRIGGER update_scan_reports_updated_at
  BEFORE UPDATE ON scan_reports
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();
