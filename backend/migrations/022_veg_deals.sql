CREATE TYPE veg_deal_committee_type AS ENUM ('Go n Go', 'Bid n Bid');

CREATE TYPE veg_deal_decision AS ENUM (
  'GO FINAL', 'GO INITIAL', 'GO without Committee', 'BID',
  'Differed', 'No GO', 'NO GO', 'Postponed', 'BACKLOG',
  'GO without Sales', 'WITHDRAWN', 'No Bid', 'CANCELLED'
);

CREATE TYPE veg_deal_sales_status AS ENUM (
  'Won', 'Lost', 'Open', 'Canceled', 'Committed', 'Deferred',
  'BID', 'No Bid'
);

CREATE TYPE veg_deal_type AS ENUM ('NA', 'upSell', 'crossSell', 'newAccount', 'renewal', 'hunting');

CREATE TYPE veg_deal_account_type AS ENUM ('Existing account', 'New account');

CREATE TABLE veg_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veg_id VARCHAR(20) NOT NULL UNIQUE,
  client VARCHAR(255) NOT NULL,
  opportunity_crm TEXT,
  identifier_number VARCHAR(100),
  business_owner VARCHAR(255) NOT NULL,
  region VARCHAR(50) NOT NULL,
  business_line VARCHAR(100) NOT NULL,
  products VARCHAR(255) NOT NULL,
  committee_type veg_deal_committee_type NOT NULL,
  veg_date DATE NOT NULL,
  decision veg_deal_decision NOT NULL,
  tcv NUMERIC(14,2) DEFAULT 0,
  ip_maintenance NUMERIC(14,2) DEFAULT 0,
  saas NUMERIC(14,2) DEFAULT 0,
  ps NUMERIC(14,2) DEFAULT 0,
  wl_ps_md NUMERIC(10,2) DEFAULT 0,
  wl_investment_md NUMERIC(10,2) DEFAULT 0,
  ticket_pp_invest VARCHAR(50),
  minutes TEXT,
  financials_url TEXT,
  templates_url TEXT,
  sales_status veg_deal_sales_status,
  closing_date DATE,
  account_type veg_deal_account_type,
  deal_type veg_deal_type DEFAULT 'NA',
  duration_days INTEGER,
  tcv_crm NUMERIC(14,2) DEFAULT 0,
  id_check VARCHAR(100),
  delta_veg_crm NUMERIC(14,2) DEFAULT 0,
  comments TEXT,
  project_name_chronos VARCHAR(255),
  chronos_wl_md NUMERIC(10,2),
  turnover_chronos NUMERIC(14,2),
  delta_veg_chronos_md NUMERIC(10,2),
  product_abbr VARCHAR(50),
  internal_flag BOOLEAN DEFAULT FALSE,
  veg_year INTEGER NOT NULL,
  duplicate_check BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_veg_deals_client ON veg_deals(client);
CREATE INDEX idx_veg_deals_region ON veg_deals(region);
CREATE INDEX idx_veg_deals_business_line ON veg_deals(business_line);
CREATE INDEX idx_veg_deals_decision ON veg_deals(decision);
CREATE INDEX idx_veg_deals_veg_date ON veg_deals(veg_date);
CREATE INDEX idx_veg_deals_sales_status ON veg_deals(sales_status);
CREATE INDEX idx_veg_deals_business_owner ON veg_deals(business_owner);
CREATE INDEX idx_veg_deals_veg_year ON veg_deals(veg_year);

CREATE TRIGGER update_veg_deals_updated_at
  BEFORE UPDATE ON veg_deals
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();
