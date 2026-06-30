-- Teams
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_teams_owner ON teams(owner_id);

CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  UNIQUE(team_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);

-- Audit log
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name VARCHAR(255),
  user_role VARCHAR(50),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id VARCHAR(255),
  details JSONB DEFAULT '{}'::jsonb,
  ip_address VARCHAR(45),
  user_agent TEXT,
  status_code INT
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);

CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();
