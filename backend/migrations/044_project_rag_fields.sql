-- ============================================================================
-- Migration 044: Project RAG Fields, Milestones, Risks, Status Snapshots
-- ============================================================================

CREATE TYPE rag_level AS ENUM ('GREEN', 'AMBER', 'RED');

ALTER TABLE projects ADD COLUMN IF NOT EXISTS planning rag_level DEFAULT 'GREEN';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS quality rag_level DEFAULT 'GREEN';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS scope rag_level DEFAULT 'GREEN';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS governance rag_level DEFAULT 'GREEN';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS security rag_level DEFAULT 'GREEN';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_mood rag_level DEFAULT 'GREEN';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS resources rag_level DEFAULT 'GREEN';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS global_risk rag_level DEFAULT 'GREEN';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS executive_message TEXT;

-- Trend direction for each RAG field (up = improving, down = deteriorating)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS planning_trend VARCHAR(10) DEFAULT 'stable';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS quality_trend VARCHAR(10) DEFAULT 'stable';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS scope_trend VARCHAR(10) DEFAULT 'stable';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS governance_trend VARCHAR(10) DEFAULT 'stable';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS security_trend VARCHAR(10) DEFAULT 'stable';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_mood_trend VARCHAR(10) DEFAULT 'stable';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS resources_trend VARCHAR(10) DEFAULT 'stable';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS global_risk_trend VARCHAR(10) DEFAULT 'stable';

CREATE TABLE IF NOT EXISTS project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date DATE,
  status VARCHAR(50) DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  severity rag_level DEFAULT 'AMBER',
  category VARCHAR(100),
  status VARCHAR(50) DEFAULT 'OPEN',
  owner VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Immutable snapshots of project RAG status over time
CREATE TABLE IF NOT EXISTS project_status_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  planning rag_level, quality rag_level, scope rag_level,
  governance rag_level, security rag_level, client_mood rag_level,
  resources rag_level, global_risk rag_level,
  executive_message TEXT,
  planning_trend VARCHAR(10), quality_trend VARCHAR(10), scope_trend VARCHAR(10),
  governance_trend VARCHAR(10), security_trend VARCHAR(10), client_mood_trend VARCHAR(10),
  resources_trend VARCHAR(10), global_risk_trend VARCHAR(10),
  metadata JSONB DEFAULT '{}',
  immutable BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_milestones_project ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_risks_project ON project_risks(project_id);
CREATE INDEX IF NOT EXISTS idx_status_snapshots_project ON project_status_snapshots(project_id);
CREATE INDEX IF NOT EXISTS idx_status_snapshots_date ON project_status_snapshots(snapshot_date);
