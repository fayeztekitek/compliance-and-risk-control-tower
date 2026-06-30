-- ============================================================================
-- Migration 045: SteerCo Management
-- Steering committee meetings linked to projects
-- ============================================================================

CREATE TABLE steerco_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TIME,
  status VARCHAR(50) DEFAULT 'SCHEDULED',
  notes TEXT,
  participants TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE steerco_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES steerco_meetings(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  owner VARCHAR(255),
  due_date DATE,
  status VARCHAR(50) DEFAULT 'OPEN',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE steerco_action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES steerco_meetings(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  assignee VARCHAR(255),
  due_date DATE,
  status VARCHAR(50) DEFAULT 'OPEN',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_steerco_meetings_project ON steerco_meetings(project_id);
CREATE INDEX IF NOT EXISTS idx_steerco_meetings_date ON steerco_meetings(date);
CREATE INDEX IF NOT EXISTS idx_steerco_decisions_meeting ON steerco_decisions(meeting_id);
CREATE INDEX IF NOT EXISTS idx_steerco_actions_meeting ON steerco_action_items(meeting_id);
