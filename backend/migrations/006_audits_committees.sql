CREATE TYPE audit_type AS ENUM (
  'SAAS_CONTRACTUAL', 'ACCESS_AUDIT', 'BACKUP_DRP',
  'VULNERABILITY', 'ENCRYPTION', 'STAFF_REVIEW'
);
CREATE TYPE audit_status AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED');
CREATE TYPE finding_severity AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');
CREATE TYPE finding_status AS ENUM ('OPEN', 'CLOSED', 'UNDER_REVIEW');
CREATE TYPE capa_status AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE');
CREATE TYPE evidence_model AS ENUM ('AUDIT', 'VULNERABILITY', 'VEG_REQUEST', 'SAAS_APPLICATION');

CREATE TABLE audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  title VARCHAR(255) NOT NULL,
  type audit_type NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status audit_status NOT NULL DEFAULT 'PLANNED',
  lead_auditor VARCHAR(255),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE audit_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  audit_id UUID REFERENCES audits(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  severity finding_severity NOT NULL,
  status finding_status NOT NULL DEFAULT 'OPEN',
  target_entity VARCHAR(255)
);

CREATE INDEX idx_findings_audit ON audit_findings(audit_id);
CREATE INDEX idx_findings_severity ON audit_findings(severity);

CREATE TABLE corrective_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  finding_id UUID REFERENCES audit_findings(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  owner VARCHAR(255),
  due_date DATE NOT NULL,
  status capa_status NOT NULL DEFAULT 'NOT_STARTED',
  completion_date DATE,
  evidence_description TEXT
);

CREATE INDEX idx_capa_finding ON corrective_actions(finding_id);

CREATE TYPE committee_type AS ENUM (
  'VEG_COMMITTEE', 'VULNERABILITY_COMMITTEE', 'SAAS_STEERING',
  'EXECUTIVE_SECURITY', 'EXECUTIVE_ARBITRATION'
);
CREATE TYPE committee_status AS ENUM ('PLANNED', 'HELD', 'CANCELLED');
CREATE TYPE decision_outcome AS ENUM ('APPROVED', 'REJECTED', 'DEFERRED');

CREATE TABLE committees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  time TIME,
  type committee_type NOT NULL,
  status committee_status NOT NULL DEFAULT 'PLANNED',
  participants TEXT[] DEFAULT '{}',
  agenda TEXT[] DEFAULT '{}',
  minutes TEXT
);

CREATE TABLE committee_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  committee_id UUID REFERENCES committees(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  context TEXT,
  outcome decision_outcome NOT NULL,
  owner VARCHAR(255),
  comments TEXT
);

CREATE INDEX idx_decisions_committee ON committee_decisions(committee_id);

CREATE TABLE contractual_obligations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  title VARCHAR(255) NOT NULL,
  source_contract VARCHAR(255),
  requirement TEXT NOT NULL,
  frequency VARCHAR(20) CHECK (frequency IN ('MONTHLY', 'QUARTERLY', 'SEMI_ANNUALLY', 'ANNUALLY')),
  last_verified_date DATE,
  status compliance_status DEFAULT 'COMPLIANT',
  verified_by VARCHAR(255),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  model_type evidence_model NOT NULL,
  model_id VARCHAR(100) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_by VARCHAR(255),
  uploaded_date DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE INDEX idx_evidence_model ON evidence(model_type, model_id);

CREATE TRIGGER update_audits_updated_at
  BEFORE UPDATE ON audits
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_audit_findings_updated_at
  BEFORE UPDATE ON audit_findings
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_corrective_actions_updated_at
  BEFORE UPDATE ON corrective_actions
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_committees_updated_at
  BEFORE UPDATE ON committees
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_committee_decisions_updated_at
  BEFORE UPDATE ON committee_decisions
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_contractual_obligations_updated_at
  BEFORE UPDATE ON contractual_obligations
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();
