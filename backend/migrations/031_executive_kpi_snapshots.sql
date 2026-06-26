-- ============================================================================
-- Migration 031: Executive KPI Snapshots
-- Expands nexus_kpi_snapshots with all executive dashboard KPI columns
-- Creates organization_kpi_snapshots and application_kpi_snapshots
-- ============================================================================

-- 1. Expand nexus_kpi_snapshots with all executive KPI columns
ALTER TABLE nexus_kpi_snapshots ADD COLUMN IF NOT EXISTS total_organizations INTEGER DEFAULT 0;
ALTER TABLE nexus_kpi_snapshots ADD COLUMN IF NOT EXISTS total_applications INTEGER DEFAULT 0;
ALTER TABLE nexus_kpi_snapshots ADD COLUMN IF NOT EXISTS active_applications INTEGER DEFAULT 0;
ALTER TABLE nexus_kpi_snapshots ADD COLUMN IF NOT EXISTS inactive_applications INTEGER DEFAULT 0;
ALTER TABLE nexus_kpi_snapshots ADD COLUMN IF NOT EXISTS never_scanned INTEGER DEFAULT 0;
ALTER TABLE nexus_kpi_snapshots ADD COLUMN IF NOT EXISTS scan_coverage_rate NUMERIC(5,2) DEFAULT 0;
ALTER TABLE nexus_kpi_snapshots ADD COLUMN IF NOT EXISTS average_scan_age_days NUMERIC(8,1) DEFAULT 0;
ALTER TABLE nexus_kpi_snapshots ADD COLUMN IF NOT EXISTS open_critical INTEGER DEFAULT 0;
ALTER TABLE nexus_kpi_snapshots ADD COLUMN IF NOT EXISTS open_high INTEGER DEFAULT 0;
ALTER TABLE nexus_kpi_snapshots ADD COLUMN IF NOT EXISTS open_medium INTEGER DEFAULT 0;
ALTER TABLE nexus_kpi_snapshots ADD COLUMN IF NOT EXISTS open_low INTEGER DEFAULT 0;
ALTER TABLE nexus_kpi_snapshots ADD COLUMN IF NOT EXISTS total_open_vulnerabilities INTEGER DEFAULT 0;
ALTER TABLE nexus_kpi_snapshots ADD COLUMN IF NOT EXISTS distinct_vulnerabilities INTEGER DEFAULT 0;
ALTER TABLE nexus_kpi_snapshots ADD COLUMN IF NOT EXISTS occurrences INTEGER DEFAULT 0;
ALTER TABLE nexus_kpi_snapshots ADD COLUMN IF NOT EXISTS mitigated_vulnerabilities INTEGER DEFAULT 0;
ALTER TABLE nexus_kpi_snapshots ADD COLUMN IF NOT EXISTS accepted_risks INTEGER DEFAULT 0;
ALTER TABLE nexus_kpi_snapshots ADD COLUMN IF NOT EXISTS false_positives INTEGER DEFAULT 0;
ALTER TABLE nexus_kpi_snapshots ADD COLUMN IF NOT EXISTS new_vulnerabilities_30d INTEGER DEFAULT 0;
ALTER TABLE nexus_kpi_snapshots ADD COLUMN IF NOT EXISTS fixed_vulnerabilities_30d INTEGER DEFAULT 0;
ALTER TABLE nexus_kpi_snapshots ADD COLUMN IF NOT EXISTS recurring_vulnerabilities INTEGER DEFAULT 0;
ALTER TABLE nexus_kpi_snapshots ADD COLUMN IF NOT EXISTS mttr_days NUMERIC(8,1) DEFAULT 0;
ALTER TABLE nexus_kpi_snapshots ADD COLUMN IF NOT EXISTS avg_time_to_close_days NUMERIC(8,1) DEFAULT 0;
ALTER TABLE nexus_kpi_snapshots ADD COLUMN IF NOT EXISTS closed_this_month INTEGER DEFAULT 0;
ALTER TABLE nexus_kpi_snapshots ADD COLUMN IF NOT EXISTS applications_out_of_sla INTEGER DEFAULT 0;
ALTER TABLE nexus_kpi_snapshots ADD COLUMN IF NOT EXISTS accepted_risks_expiring_soon INTEGER DEFAULT 0;
ALTER TABLE nexus_kpi_snapshots ADD COLUMN IF NOT EXISTS expired_accepted_risks INTEGER DEFAULT 0;
ALTER TABLE nexus_kpi_snapshots ADD COLUMN IF NOT EXISTS applications_without_recent_scan INTEGER DEFAULT 0;
ALTER TABLE nexus_kpi_snapshots ADD COLUMN IF NOT EXISTS critical_apps_without_scan INTEGER DEFAULT 0;
ALTER TABLE nexus_kpi_snapshots ADD COLUMN IF NOT EXISTS compliance_rate NUMERIC(5,2) DEFAULT 100;
ALTER TABLE nexus_kpi_snapshots ADD COLUMN IF NOT EXISTS sla_compliance_rate NUMERIC(5,2) DEFAULT 100;
ALTER TABLE nexus_kpi_snapshots ADD COLUMN IF NOT EXISTS apps_with_critical_vulns INTEGER DEFAULT 0;
ALTER TABLE nexus_kpi_snapshots ADD COLUMN IF NOT EXISTS apps_with_high_vulns INTEGER DEFAULT 0;
ALTER TABLE nexus_kpi_snapshots ADD COLUMN IF NOT EXISTS average_risk_score NUMERIC(5,2) DEFAULT 0;
ALTER TABLE nexus_kpi_snapshots ADD COLUMN IF NOT EXISTS previous_total INTEGER DEFAULT 0;
ALTER TABLE nexus_kpi_snapshots ADD COLUMN IF NOT EXISTS previous_critical INTEGER DEFAULT 0;
ALTER TABLE nexus_kpi_snapshots ADD COLUMN IF NOT EXISTS previous_high INTEGER DEFAULT 0;
ALTER TABLE nexus_kpi_snapshots ADD COLUMN IF NOT EXISTS previous_risk_score NUMERIC(5,2) DEFAULT 0;
ALTER TABLE nexus_kpi_snapshots ADD COLUMN IF NOT EXISTS trend_direction VARCHAR(10) DEFAULT 'stable';
ALTER TABLE nexus_kpi_snapshots ADD COLUMN IF NOT EXISTS snapshot_type VARCHAR(20) DEFAULT 'manual';

-- 2. Create organization_kpi_snapshots table
CREATE TABLE IF NOT EXISTS organization_kpi_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  organization_id VARCHAR(100) REFERENCES nexus_organizations(organization_id) ON DELETE CASCADE,
  organization_name VARCHAR(255) NOT NULL,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_applications INTEGER DEFAULT 0,
  active_applications INTEGER DEFAULT 0,
  inactive_applications INTEGER DEFAULT 0,
  never_scanned INTEGER DEFAULT 0,
  open_critical INTEGER DEFAULT 0,
  open_high INTEGER DEFAULT 0,
  open_medium INTEGER DEFAULT 0,
  open_low INTEGER DEFAULT 0,
  distinct_vulnerabilities INTEGER DEFAULT 0,
  occurrences INTEGER DEFAULT 0,
  accepted_risks INTEGER DEFAULT 0,
  risk_score NUMERIC(5,2) DEFAULT 0,
  compliance_score NUMERIC(5,2) DEFAULT 100,
  posture_grade VARCHAR(10) DEFAULT 'GREEN',
  scan_coverage_rate NUMERIC(5,2) DEFAULT 0,
  mttr_days NUMERIC(8,1) DEFAULT 0,
  applications_out_of_sla INTEGER DEFAULT 0,
  critical_apps_without_scan INTEGER DEFAULT 0,
  CONSTRAINT uq_org_snapshot UNIQUE (organization_id, snapshot_date)
);

-- 3. Create application_kpi_snapshots table
CREATE TABLE IF NOT EXISTS application_kpi_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  application_id VARCHAR(100) REFERENCES nexus_applications(application_id) ON DELETE CASCADE,
  application_name VARCHAR(255) NOT NULL,
  organization_id VARCHAR(100) REFERENCES nexus_organizations(organization_id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  open_critical INTEGER DEFAULT 0,
  open_high INTEGER DEFAULT 0,
  open_medium INTEGER DEFAULT 0,
  open_low INTEGER DEFAULT 0,
  distinct_vulnerabilities INTEGER DEFAULT 0,
  occurrences INTEGER DEFAULT 0,
  risk_score NUMERIC(5,2) DEFAULT 0,
  scan_count INTEGER DEFAULT 0,
  last_scan_date DATE,
  last_scan_age_days INTEGER DEFAULT 0,
  scan_coverage_status VARCHAR(20) DEFAULT 'never_scanned',
  business_criticality VARCHAR(20) DEFAULT 'MEDIUM',
  accepted_risks INTEGER DEFAULT 0,
  CONSTRAINT uq_app_snapshot UNIQUE (application_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_org_snapshot_date ON organization_kpi_snapshots(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_app_snapshot_date ON application_kpi_snapshots(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_org_snapshot_org ON organization_kpi_snapshots(organization_id);
CREATE INDEX IF NOT EXISTS idx_app_snapshot_app ON application_kpi_snapshots(application_id);
