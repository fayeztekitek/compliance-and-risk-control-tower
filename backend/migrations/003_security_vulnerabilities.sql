CREATE TYPE severity AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');
CREATE TYPE vuln_status AS ENUM ('OPEN', 'FALSE_POSITIVE', 'WAIVED', 'REMEDIATED');
CREATE TYPE scanner_source AS ENUM ('VERACODE', 'NEXPOSE', 'PEN_TEST');

CREATE TABLE vulnerabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  title TEXT NOT NULL,
  severity severity NOT NULL,
  status vuln_status NOT NULL DEFAULT 'OPEN',
  source_scanner scanner_source NOT NULL,
  detected_date DATE NOT NULL DEFAULT CURRENT_DATE,
  remediated_date DATE,
  sla_due_date DATE NOT NULL,
  is_false_positive BOOLEAN DEFAULT FALSE,
  explanation_false_positive TEXT,
  target_product VARCHAR(255),
  owner VARCHAR(255),
  waiver_id UUID,
  risk_acceptance_id UUID,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_vuln_severity ON vulnerabilities(severity);
CREATE INDEX idx_vuln_status ON vulnerabilities(status);
CREATE INDEX idx_vuln_scanner ON vulnerabilities(source_scanner);
CREATE INDEX idx_vuln_product ON vulnerabilities(target_product);
CREATE INDEX idx_vuln_sla ON vulnerabilities(sla_due_date);

CREATE TYPE waiver_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

CREATE TABLE waivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  vulnerability_id UUID REFERENCES vulnerabilities(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  rationale TEXT NOT NULL,
  status waiver_status NOT NULL DEFAULT 'PENDING',
  request_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE NOT NULL,
  approved_by VARCHAR(255)
);

CREATE INDEX idx_waiver_status ON waivers(status);
CREATE INDEX idx_waiver_vuln ON waivers(vulnerability_id);
CREATE INDEX idx_waiver_expiry ON waivers(expiry_date);

CREATE TYPE ra_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

CREATE TABLE risk_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  vulnerability_id UUID REFERENCES vulnerabilities(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  business_impact TEXT NOT NULL,
  mitigation_plan TEXT NOT NULL,
  status ra_status NOT NULL DEFAULT 'PENDING',
  request_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE NOT NULL,
  approved_by VARCHAR(255)
);

CREATE INDEX idx_ra_status ON risk_acceptances(status);
CREATE INDEX idx_ra_vuln ON risk_acceptances(vulnerability_id);

CREATE TYPE sla_incident_status AS ENUM ('OPEN', 'BREACHED', 'RESOLVED');

CREATE TABLE sla_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  title VARCHAR(255) NOT NULL,
  contract_id VARCHAR(255),
  project_name VARCHAR(255),
  breach_time TIMESTAMPTZ NOT NULL,
  resolution_time TIMESTAMPTZ,
  max_allowed_resolution_hours INTEGER NOT NULL,
  actual_duration_hours NUMERIC(10,2),
  status sla_incident_status NOT NULL DEFAULT 'OPEN',
  penalty_cost NUMERIC(12,2)
);

CREATE INDEX idx_sla_status ON sla_incidents(status);

CREATE TRIGGER update_vulnerabilities_updated_at
  BEFORE UPDATE ON vulnerabilities
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_waivers_updated_at
  BEFORE UPDATE ON waivers
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_risk_acceptances_updated_at
  BEFORE UPDATE ON risk_acceptances
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_sla_incidents_updated_at
  BEFORE UPDATE ON sla_incidents
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();
