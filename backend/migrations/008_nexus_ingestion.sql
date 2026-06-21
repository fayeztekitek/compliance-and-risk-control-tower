-- ============================================================================
-- Nexus IQ Ingestion Schema (migrated from existing nexus_schema.sql)
-- ============================================================================

CREATE TYPE product_grade AS ENUM ('RED', 'ORANGE', 'GREEN');
CREATE TYPE business_criticality AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');
CREATE TYPE scan_stage AS ENUM ('develop', 'build', 'release', 'operate');
CREATE TYPE dependency_type AS ENUM ('direct', 'transitive');
CREATE TYPE reachability AS ENUM ('REACHABLE', 'NOT_REACHABLE', 'UNKNOWN');
CREATE TYPE exploitability AS ENUM ('EASY', 'MEDIUM', 'HARD', 'THEORETICAL');
CREATE TYPE nexus_vuln_status AS ENUM ('Open', 'Fixed', 'Accepted', 'Waived', 'False Positive');
CREATE TYPE nexus_waiver_status AS ENUM ('active', 'expired', 'stale');
CREATE TYPE threat_level_type AS ENUM ('NONE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE license_risk AS ENUM ('RED', 'YELLOW', 'GREEN', 'NONE');
CREATE TYPE alert_type AS ENUM (
  'CRITICAL_VULNERABILITY', 'HIGH_VULN_INCREASE', 'WAIVER_EXPIRING',
  'WAIVER_EXPIRED', 'PRODUCT_GRADE_RED', 'OUTDATED_SCAN',
  'SCORE_DEGRADED', 'DUAL_PRODUCT_COMPONENT'
);
CREATE TYPE sync_status AS ENUM ('SUCCESS', 'FAILED', 'WARNING', 'IN_PROGRESS');

CREATE TABLE nexus_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  source_system VARCHAR(100) DEFAULT 'sonatype_nexus_iq',
  sync_batch_id VARCHAR(100),
  product_id VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  status product_grade DEFAULT 'GREEN',
  business_criticality business_criticality DEFAULT 'MEDIUM',
  security_owner VARCHAR(255),
  product_owner VARCHAR(255)
);

CREATE TABLE nexus_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  source_system VARCHAR(100) DEFAULT 'sonatype_nexus_iq',
  sync_batch_id VARCHAR(100),
  organization_id VARCHAR(100) UNIQUE NOT NULL,
  organization_name VARCHAR(255) NOT NULL,
  parent_organization_id VARCHAR(100) REFERENCES nexus_organizations(organization_id)
);

CREATE TABLE nexus_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  source_system VARCHAR(100) DEFAULT 'sonatype_nexus_iq',
  sync_batch_id VARCHAR(100),
  application_id VARCHAR(100) UNIQUE NOT NULL,
  application_public_id VARCHAR(100) UNIQUE NOT NULL,
  application_name VARCHAR(255) NOT NULL,
  organization_id VARCHAR(100) REFERENCES nexus_organizations(organization_id),
  tags TEXT[] DEFAULT '{}',
  categories TEXT[] DEFAULT '{}',
  business_criticality business_criticality DEFAULT 'MEDIUM',
  security_owner VARCHAR(255),
  product_owner VARCHAR(255)
);

CREATE TABLE product_application_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  source_system VARCHAR(100) DEFAULT 'sonatype_nexus_iq',
  sync_batch_id VARCHAR(100),
  product_id VARCHAR(100) REFERENCES nexus_products(product_id) ON DELETE CASCADE,
  organization_id VARCHAR(100) REFERENCES nexus_organizations(organization_id) ON DELETE SET NULL,
  application_id VARCHAR(100) REFERENCES nexus_applications(application_id) ON DELETE SET NULL,
  CONSTRAINT uq_mapping UNIQUE (product_id, organization_id, application_id)
);

CREATE TABLE nexus_scan_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  source_system VARCHAR(100) DEFAULT 'sonatype_nexus_iq',
  sync_batch_id VARCHAR(100),
  scan_id VARCHAR(100) UNIQUE NOT NULL,
  application_id VARCHAR(100) REFERENCES nexus_applications(application_id) ON DELETE CASCADE,
  application_public_id VARCHAR(100),
  stage scan_stage NOT NULL,
  scan_date DATE NOT NULL,
  report_url TEXT,
  policy_evaluation_date TIMESTAMPTZ,
  total_components INTEGER DEFAULT 0,
  affected_components INTEGER DEFAULT 0,
  critical_count INTEGER DEFAULT 0,
  high_count INTEGER DEFAULT 0,
  medium_count INTEGER DEFAULT 0,
  low_count INTEGER DEFAULT 0
);

CREATE TABLE nexus_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  source_system VARCHAR(100) DEFAULT 'sonatype_nexus_iq',
  sync_batch_id VARCHAR(100),
  component_name VARCHAR(255) NOT NULL,
  current_version VARCHAR(100) NOT NULL,
  latest_version VARCHAR(100),
  recommended_version VARCHAR(100),
  remediation_path TEXT,
  security_risk threat_level_type DEFAULT 'NONE',
  license_risk license_risk DEFAULT 'NONE',
  popularity INTEGER DEFAULT 0,
  age VARCHAR(100),
  number_of_affected_applications INTEGER DEFAULT 0
);

CREATE TABLE nexus_vulnerabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  source_system VARCHAR(100) DEFAULT 'sonatype_nexus_iq',
  sync_batch_id VARCHAR(100),
  vulnerability_id VARCHAR(100) NOT NULL,
  ref_id VARCHAR(100),
  cvss_score NUMERIC(3,1) NOT NULL,
  cvss_vector VARCHAR(255),
  severity severity NOT NULL,
  component_name VARCHAR(255) NOT NULL,
  component_version VARCHAR(100) NOT NULL,
  package_url TEXT,
  dependency_type dependency_type DEFAULT 'direct',
  reachable reachability DEFAULT 'UNKNOWN',
  recommended_version VARCHAR(100),
  fix_available BOOLEAN DEFAULT FALSE,
  exploitability exploitability DEFAULT 'THEORETICAL',
  age_in_days INTEGER DEFAULT 0,
  first_seen_date DATE,
  last_seen_date DATE,
  status nexus_vuln_status DEFAULT 'Open',
  application_id VARCHAR(100) REFERENCES nexus_applications(application_id) ON DELETE CASCADE,
  scan_id VARCHAR(100) REFERENCES nexus_scan_reports(scan_id) ON DELETE CASCADE
);

CREATE INDEX idx_nexus_vuln_cvss ON nexus_vulnerabilities(cvss_score);
CREATE INDEX idx_nexus_vuln_severity ON nexus_vulnerabilities(severity);
CREATE INDEX idx_nexus_vuln_app ON nexus_vulnerabilities(application_id);
CREATE INDEX idx_nexus_vuln_status ON nexus_vulnerabilities(status);

CREATE TABLE nexus_policy_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  source_system VARCHAR(100) DEFAULT 'sonatype_nexus_iq',
  sync_batch_id VARCHAR(100),
  violation_id VARCHAR(100) UNIQUE NOT NULL,
  policy_name VARCHAR(255) NOT NULL,
  constraint_name VARCHAR(255),
  threat_level INTEGER CHECK (threat_level BETWEEN 1 AND 10),
  application_id VARCHAR(100) REFERENCES nexus_applications(application_id) ON DELETE CASCADE,
  product_mapping VARCHAR(100) REFERENCES nexus_products(product_id) ON DELETE SET NULL,
  component_name VARCHAR(255),
  stage scan_stage,
  created_date DATE,
  status VARCHAR(20) DEFAULT 'OPEN',
  waiver_status VARCHAR(20) DEFAULT 'NONE',
  business_impact TEXT
);

CREATE TABLE nexus_waivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  source_system VARCHAR(100) DEFAULT 'sonatype_nexus_iq',
  sync_batch_id VARCHAR(100),
  waiver_id VARCHAR(100) UNIQUE NOT NULL,
  violation_id VARCHAR(100) REFERENCES nexus_policy_violations(violation_id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  approver VARCHAR(255),
  requester VARCHAR(255),
  creation_date DATE NOT NULL,
  expiration_date DATE,
  status nexus_waiver_status DEFAULT 'active',
  product_id VARCHAR(100) REFERENCES nexus_products(product_id) ON DELETE CASCADE,
  application_id VARCHAR(100) REFERENCES nexus_applications(application_id) ON DELETE CASCADE,
  component_name VARCHAR(255),
  risk_acceptance_comment TEXT
);

CREATE TABLE nexus_kpi_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  source_system VARCHAR(100) DEFAULT 'sonatype_nexus_iq',
  sync_batch_id VARCHAR(100),
  snapshot_date DATE NOT NULL,
  global_security_risk_score NUMERIC(5,2),
  total_vulnerabilities INTEGER DEFAULT 0,
  critical_vulnerabilities INTEGER DEFAULT 0,
  high_vulnerabilities INTEGER DEFAULT 0,
  new_vulnerabilities INTEGER DEFAULT 0,
  fixed_vulnerabilities INTEGER DEFAULT 0,
  accepted_risk_count INTEGER DEFAULT 0,
  expired_waivers_count INTEGER DEFAULT 0,
  products_red_count INTEGER DEFAULT 0,
  products_orange_count INTEGER DEFAULT 0,
  products_green_count INTEGER DEFAULT 0,
  security_debt_score INTEGER DEFAULT 0,
  compliance_score NUMERIC(5,2) DEFAULT 100.00
);

CREATE TABLE nexus_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  source_system VARCHAR(100) DEFAULT 'sonatype_nexus_iq',
  sync_batch_id VARCHAR(100),
  alert_type alert_type NOT NULL,
  message TEXT NOT NULL,
  product_id VARCHAR(100) REFERENCES nexus_products(product_id) ON DELETE CASCADE,
  application_id VARCHAR(100) REFERENCES nexus_applications(application_id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived BOOLEAN DEFAULT FALSE
);

CREATE TABLE nexus_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  source_system VARCHAR(100) DEFAULT 'sonatype_nexus_iq',
  sync_batch_id VARCHAR(100),
  batch_id VARCHAR(100) NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  executed_by VARCHAR(100),
  status sync_status DEFAULT 'IN_PROGRESS',
  summary TEXT,
  logs TEXT,
  retry_count INTEGER DEFAULT 0,
  target_url TEXT
);

CREATE TABLE nexus_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  url VARCHAR(500) NOT NULL,
  username VARCHAR(255) NOT NULL,
  token_encrypted TEXT,
  timeout_ms INTEGER DEFAULT 5000,
  max_retries INTEGER DEFAULT 3,
  is_active BOOLEAN DEFAULT TRUE
);

-- Performance indexes (from existing nexus_schema.sql)
CREATE INDEX idx_nexus_products_pid ON nexus_products(product_id);
CREATE INDEX idx_nexus_mapping_pid ON product_application_mapping(product_id);
CREATE INDEX idx_nexus_violations_pid ON nexus_policy_violations(product_mapping);
CREATE INDEX idx_nexus_waivers_pid ON nexus_waivers(product_id);
CREATE INDEX idx_nexus_alerts_pid ON nexus_alerts(product_id);
CREATE INDEX idx_nexus_apps_aid ON nexus_applications(application_id);
CREATE INDEX idx_nexus_mapping_aid ON product_application_mapping(application_id);
CREATE INDEX idx_nexus_scans_aid ON nexus_scan_reports(application_id);
CREATE INDEX idx_nexus_vulns_aid ON nexus_vulnerabilities(application_id);
CREATE INDEX idx_nexus_violations_aid ON nexus_policy_violations(application_id);
CREATE INDEX idx_nexus_waivers_aid ON nexus_waivers(application_id);
CREATE INDEX idx_nexus_alerts_aid ON nexus_alerts(application_id);
CREATE INDEX idx_nexus_vulns_sid ON nexus_vulnerabilities(scan_id);
CREATE INDEX idx_nexus_violations_status ON nexus_policy_violations(status);
CREATE INDEX idx_nexus_waivers_status ON nexus_waivers(status);
CREATE INDEX idx_nexus_sync_status ON nexus_sync_logs(status);
CREATE INDEX idx_nexus_vulns_first_seen ON nexus_vulnerabilities(first_seen_date);
CREATE INDEX idx_nexus_waivers_expiration ON nexus_waivers(expiration_date);

-- Triggers
CREATE TRIGGER update_nexus_products_updated_at
  BEFORE UPDATE ON nexus_products FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_nexus_applications_updated_at
  BEFORE UPDATE ON nexus_applications FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_nexus_scan_reports_updated_at
  BEFORE UPDATE ON nexus_scan_reports FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_nexus_vulnerabilities_updated_at
  BEFORE UPDATE ON nexus_vulnerabilities FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_nexus_waivers_updated_at
  BEFORE UPDATE ON nexus_waivers FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_nexus_config_updated_at
  BEFORE UPDATE ON nexus_config FOR EACH ROW EXECUTE FUNCTION update_timestamp();
