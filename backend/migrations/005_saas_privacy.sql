CREATE TYPE lifecycle_stage AS ENUM ('ONBOARDING', 'GO_LIVE', 'OFFBOARDING');
CREATE TYPE data_category AS ENUM ('PII_SENSITIVE', 'PII_COMMON', 'NON_PII');
CREATE TYPE gdpr_risk AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE privacy_design_status AS ENUM ('COMPLIANT', 'PENDING', 'NON_COMPLIANT');

CREATE TABLE saas_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  name VARCHAR(255) NOT NULL,
  lifecycle_stage lifecycle_stage NOT NULL DEFAULT 'ONBOARDING',
  go_live_readiness_score NUMERIC(5,2) DEFAULT 0 CHECK (go_live_readiness_score >= 0 AND go_live_readiness_score <= 100),
  privacy_design_status privacy_design_status DEFAULT 'PENDING',
  steering_check_passed BOOLEAN DEFAULT FALSE,
  data_category data_category DEFAULT 'NON_PII',
  gdpr_risk_impact gdpr_risk DEFAULT 'LOW',
  owner VARCHAR(255),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE privacy_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  saas_application_id UUID REFERENCES saas_applications(id) ON DELETE CASCADE,
  gdpr_ready BOOLEAN DEFAULT FALSE,
  data_protection_officer_review BOOLEAN DEFAULT FALSE,
  commitments TEXT,
  data_processing_objective TEXT,
  checklist JSONB DEFAULT '[]'
);

CREATE INDEX idx_privacy_saas ON privacy_assessments(saas_application_id);

CREATE TABLE data_processing_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  data_name VARCHAR(255) NOT NULL,
  purpose TEXT,
  storage_location VARCHAR(255),
  retention_period VARCHAR(100),
  encryption_standard VARCHAR(100)
);

CREATE TRIGGER update_saas_applications_updated_at
  BEFORE UPDATE ON saas_applications
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_privacy_assessments_updated_at
  BEFORE UPDATE ON privacy_assessments
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_data_processing_inventory_updated_at
  BEFORE UPDATE ON data_processing_inventory
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();
