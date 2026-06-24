-- Sprint 14: Nexus Report Drill-Down Enhancements
-- Migration 030
-- Adds columns to nexus_scan_reports, nexus_policy_violations, nexus_components
-- and creates new tables for evolution tracking and component impact.

BEGIN;

-- ============================================================================
-- 1. Enhance nexus_scan_reports — add metadata columns from Nexus IQ API
-- ============================================================================
ALTER TABLE nexus_scan_reports
  ADD COLUMN IF NOT EXISTS report_title VARCHAR(500),
  ADD COLUMN IF NOT EXISTS commit_hash VARCHAR(255),
  ADD COLUMN IF NOT EXISTS initiator VARCHAR(255),
  ADD COLUMN IF NOT EXISTS embeddable_report_html_url TEXT,
  ADD COLUMN IF NOT EXISTS report_pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS report_data_url TEXT,
  ADD COLUMN IF NOT EXISTS total_violations INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS policy_evaluation_status VARCHAR(50)
      DEFAULT 'UNKNOWN'
      CHECK (policy_evaluation_status IN ('OPEN', 'WAIVED', 'ALL_PASSED', 'UNKNOWN')),
  ADD COLUMN IF NOT EXISTS application_uuid UUID REFERENCES nexus_applications(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS component_hashes TEXT[] DEFAULT '{}';

-- ============================================================================
-- 2. Enhance nexus_policy_violations — full violation metadata
-- ============================================================================
ALTER TABLE nexus_policy_violations
  ADD COLUMN IF NOT EXISTS report_id VARCHAR(100) REFERENCES nexus_scan_reports(scan_id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS policy_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS constraint_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS component_hash VARCHAR(255),
  ADD COLUMN IF NOT EXISTS component_format VARCHAR(50),
  ADD COLUMN IF NOT EXISTS component_coordinates JSONB,
  ADD COLUMN IF NOT EXISTS display_name VARCHAR(500),
  ADD COLUMN IF NOT EXISTS proprietary BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS match_state VARCHAR(50),
  ADD COLUMN IF NOT EXISTS security_issue_ref_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS security_issue_severity NUMERIC(3,1),
  ADD COLUMN IF NOT EXISTS cve_id VARCHAR(20),
  ADD COLUMN IF NOT EXISTS threat_category VARCHAR(50),
  ADD COLUMN IF NOT EXISTS open_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS waive_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS fix_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_waived BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_legacy BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- 3. Enhance nexus_components — Nexus IQ component identifiers
-- ============================================================================
ALTER TABLE nexus_components
  ADD COLUMN IF NOT EXISTS component_hash VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS format VARCHAR(50),
  ADD COLUMN IF NOT EXISTS coordinates JSONB,
  ADD COLUMN IF NOT EXISTS display_name VARCHAR(500),
  ADD COLUMN IF NOT EXISTS proprietary BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS match_state VARCHAR(50);

-- ============================================================================
-- 4. Evolution snapshots — per-scan denormalized summary
-- ============================================================================
CREATE TABLE IF NOT EXISTS nexus_evolution_snapshots (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    application_id      VARCHAR(100) REFERENCES nexus_applications(application_id) ON DELETE CASCADE,
    report_id           VARCHAR(100) REFERENCES nexus_scan_reports(scan_id) ON DELETE CASCADE,
    scan_date           DATE NOT NULL,
    stage               scan_stage,
    total_violations    INTEGER DEFAULT 0,
    critical_count      INTEGER DEFAULT 0,
    high_count          INTEGER DEFAULT 0,
    medium_count        INTEGER DEFAULT 0,
    low_count           INTEGER DEFAULT 0,
    total_components    INTEGER DEFAULT 0,
    affected_components INTEGER DEFAULT 0,
    component_churn     JSONB,
    new_violations      INTEGER DEFAULT 0,
    fixed_violations    INTEGER DEFAULT 0,
    CONSTRAINT uq_evolution_report UNIQUE (report_id)
);

-- ============================================================================
-- 5. Component impact — per-app/per-component aggregate metrics
-- ============================================================================
CREATE TABLE IF NOT EXISTS nexus_component_impact (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    application_id      VARCHAR(100) REFERENCES nexus_applications(application_id) ON DELETE CASCADE,
    component_hash      VARCHAR(255) REFERENCES nexus_components(component_hash) ON DELETE CASCADE,
    first_seen          DATE NOT NULL,
    last_seen           DATE NOT NULL,
    reports_affected    INTEGER DEFAULT 0,
    violation_count     INTEGER DEFAULT 0,
    max_threat_level    INTEGER DEFAULT 0,
    versions_seen       TEXT[] DEFAULT '{}',
    CONSTRAINT uq_app_component UNIQUE (application_id, component_hash)
);

-- ============================================================================
-- 6. Indexes for performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_npv_report_id ON nexus_policy_violations(report_id);
CREATE INDEX IF NOT EXISTS idx_npv_component_hash ON nexus_policy_violations(component_hash);
CREATE INDEX IF NOT EXISTS idx_npv_policy_id ON nexus_policy_violations(policy_id);
CREATE INDEX IF NOT EXISTS idx_npv_cve_id ON nexus_policy_violations(cve_id);
CREATE INDEX IF NOT EXISTS idx_npv_security_ref ON nexus_policy_violations(security_issue_ref_id);
CREATE INDEX IF NOT EXISTS idx_nsr_app_uuid ON nexus_scan_reports(application_uuid);
CREATE INDEX IF NOT EXISTS idx_nsr_scan_date ON nexus_scan_reports(scan_date DESC);
CREATE INDEX IF NOT EXISTS idx_nc_hash ON nexus_components(component_hash);
CREATE INDEX IF NOT EXISTS idx_nes_app_date ON nexus_evolution_snapshots(application_id, scan_date DESC);
CREATE INDEX IF NOT EXISTS idx_nci_app_hash ON nexus_component_impact(application_id, component_hash);

-- ============================================================================
-- 7. Triggers for updated_at
-- ============================================================================
DROP TRIGGER IF EXISTS update_nexus_evolution_snapshots_updated_at ON nexus_evolution_snapshots;
CREATE TRIGGER update_nexus_evolution_snapshots_updated_at
    BEFORE UPDATE ON nexus_evolution_snapshots
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_nexus_component_impact_updated_at ON nexus_component_impact;
CREATE TRIGGER update_nexus_component_impact_updated_at
    BEFORE UPDATE ON nexus_component_impact
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

COMMIT;
