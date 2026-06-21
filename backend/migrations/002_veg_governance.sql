CREATE TYPE veg_request_type AS ENUM (
  'RFI', 'RFP', 'NEW_CLIENT_REQUEST', 'BD_REQUEST', 'ACC_CODE_CREATION', 'BID_COMMITTEE_OVERSIGHT'
);

CREATE TYPE veg_request_status AS ENUM (
  'DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CONTRACT_SIGNATURE'
);

CREATE TYPE department_state AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TYPE bid_decision AS ENUM ('BID', 'NO_BID', 'PENDING');
CREATE TYPE go_nogo_decision AS ENUM ('GO', 'NO_GO', 'PENDING');

CREATE TABLE veg_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  title VARCHAR(255) NOT NULL,
  type veg_request_type NOT NULL,
  status veg_request_status NOT NULL DEFAULT 'DRAFT',
  client VARCHAR(255) NOT NULL,
  margin_estimate NUMERIC(5,2) CHECK (margin_estimate >= 0 AND margin_estimate <= 100),
  workload_md INTEGER CHECK (workload_md > 0),
  code_acc VARCHAR(50),
  bid_decision bid_decision DEFAULT 'PENDING',
  go_nogo_decision go_nogo_decision DEFAULT 'PENDING',
  finance_state department_state DEFAULT 'PENDING',
  sales_state department_state DEFAULT 'PENDING',
  product_state department_state DEFAULT 'PENDING',
  legal_state department_state DEFAULT 'PENDING',
  owner_id UUID REFERENCES users(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_veg_status ON veg_requests(status);
CREATE INDEX idx_veg_type ON veg_requests(type);
CREATE INDEX idx_veg_client ON veg_requests(client);
CREATE INDEX idx_veg_owner ON veg_requests(owner_id);

CREATE TYPE sales_stage AS ENUM (
  'PROSPECTING', 'QUALIFICATION', 'BID_PREPARATION',
  'PROPOSAL_SUBMITTED', 'NEGOTIATION', 'WON', 'LOST'
);

CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  veg_request_id UUID REFERENCES veg_requests(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  value NUMERIC(12,2) NOT NULL DEFAULT 0,
  sales_stage sales_stage DEFAULT 'PROSPECTING',
  contract_signed BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_opp_veg ON opportunities(veg_request_id);

CREATE TYPE compliance_status AS ENUM ('COMPLIANT', 'NON_COMPLIANT', 'WARNING');

CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  sla_commitments TEXT,
  compliance_status compliance_status DEFAULT 'COMPLIANT',
  maintenance_saas BOOLEAN DEFAULT FALSE,
  CHECK (end_date > start_date)
);

CREATE INDEX idx_contract_opp ON contracts(opportunity_id);

CREATE TRIGGER update_veg_requests_updated_at
  BEFORE UPDATE ON veg_requests
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_opportunities_updated_at
  BEFORE UPDATE ON opportunities
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();
