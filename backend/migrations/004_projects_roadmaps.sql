CREATE TYPE project_status AS ENUM ('ON_TRACK', 'DEVIATING', 'HIGH_RISK');
CREATE TYPE go_live_state AS ENUM ('READY', 'RISKY', 'BLOCKED');
CREATE TYPE roadmap_type AS ENUM ('STRATEGIC', 'BUDGETARY', 'REGULATORY');
CREATE TYPE milestone_status AS ENUM ('ON_TIME', 'DELAYED', 'CRITICAL');

CREATE TABLE roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  name VARCHAR(255) NOT NULL,
  type roadmap_type NOT NULL,
  progress NUMERIC(5,2) DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  target_date DATE NOT NULL,
  milestone_status milestone_status DEFAULT 'ON_TIME',
  lead_owner VARCHAR(255),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  manager VARCHAR(255),
  initial_budget NUMERIC(12,2) DEFAULT 0,
  consumed_budget NUMERIC(12,2) DEFAULT 0,
  roadmap_id UUID REFERENCES roadmaps(id) ON DELETE SET NULL,
  status project_status DEFAULT 'ON_TRACK',
  rtd_value NUMERIC(10,2) DEFAULT 0,
  rtd_deviation NUMERIC(5,2) DEFAULT 0,
  slippage_md NUMERIC(10,2) DEFAULT 0,
  test_automation_rate NUMERIC(5,2) DEFAULT 0,
  go_live_readiness_state go_live_state DEFAULT 'READY',
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_roadmap ON projects(roadmap_id);

CREATE TABLE rtd_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  review_month VARCHAR(7) NOT NULL,
  declared_rtd NUMERIC(10,2) NOT NULL,
  actual_consumed NUMERIC(10,2) NOT NULL,
  variance NUMERIC(10,2),
  comments TEXT,
  submitted_by VARCHAR(255),
  reviewer_approved BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_rtd_project ON rtd_reviews(project_id);

CREATE TRIGGER update_roadmaps_updated_at
  BEFORE UPDATE ON roadmaps
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_rtd_reviews_updated_at
  BEFORE UPDATE ON rtd_reviews
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();
