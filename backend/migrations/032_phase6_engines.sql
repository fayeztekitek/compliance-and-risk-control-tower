-- Phase 6: Backend Engines Infrastructure
-- Workflow Engine, Notification Engine, Reporting Engine, KPI Engine, Event Store

-- ============================================================================
-- 1. DOMAIN EVENT STORE
-- ============================================================================
CREATE TABLE IF NOT EXISTS event_store (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  event_type VARCHAR(255) NOT NULL,
  aggregate_type VARCHAR(100) NOT NULL,
  aggregate_id UUID NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_es_event_type ON event_store(event_type);
CREATE INDEX IF NOT EXISTS idx_es_aggregate ON event_store(aggregate_type, aggregate_id);
CREATE INDEX IF NOT EXISTS idx_es_created ON event_store(created_at);

-- ============================================================================
-- 2. WORKFLOW ENGINE
-- ============================================================================
CREATE TABLE IF NOT EXISTS workflow_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  entity_type VARCHAR(100) NOT NULL,
  states JSONB NOT NULL,
  transitions JSONB NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS workflow_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  definition_id UUID NOT NULL REFERENCES workflow_definitions(id) ON DELETE CASCADE,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID NOT NULL,
  current_state VARCHAR(100) NOT NULL,
  context JSONB NOT NULL DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'TERMINATED')),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_wi_definition ON workflow_instances(definition_id);
CREATE INDEX IF NOT EXISTS idx_wi_entity ON workflow_instances(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_wi_status ON workflow_instances(status);

CREATE TABLE IF NOT EXISTS workflow_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  instance_id UUID NOT NULL REFERENCES workflow_instances(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  from_state VARCHAR(100) NOT NULL,
  to_state VARCHAR(100) NOT NULL,
  actor_id UUID REFERENCES users(id),
  comment TEXT
);

CREATE INDEX IF NOT EXISTS idx_wa_instance ON workflow_actions(instance_id);

-- ============================================================================
-- 3. NOTIFICATION ENGINE
-- ============================================================================
CREATE TABLE IF NOT EXISTS notification_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  name VARCHAR(255) NOT NULL,
  event_type VARCHAR(255) NOT NULL,
  channels TEXT[] NOT NULL DEFAULT '{}',
  recipients TEXT[] NOT NULL DEFAULT '{}',
  subject_template TEXT,
  body_template TEXT,
  conditions JSONB NOT NULL DEFAULT '{}',
  enabled BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_nr_event ON notification_rules(event_type);
CREATE INDEX IF NOT EXISTS idx_nr_enabled ON notification_rules(enabled) WHERE enabled = true;

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  rule_id UUID REFERENCES notification_rules(id) ON DELETE SET NULL,
  channel VARCHAR(20) NOT NULL CHECK (channel IN ('EMAIL', 'SLACK', 'IN_APP')),
  recipient VARCHAR(255) NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'FAILED', 'READ')),
  read_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notif_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notif_recipient ON notifications(recipient);

-- ============================================================================
-- 4. REPORTING ENGINE
-- ============================================================================
CREATE TABLE IF NOT EXISTS report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  config JSONB NOT NULL DEFAULT '{}',
  enabled BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS report_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  template_id UUID REFERENCES report_templates(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  format VARCHAR(10) NOT NULL CHECK (format IN ('CSV', 'PDF', 'XLSX', 'HTML')),
  params JSONB NOT NULL DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'GENERATING', 'COMPLETED', 'FAILED')),
  file_path TEXT,
  error_message TEXT,
  generated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ri_template ON report_instances(template_id);
CREATE INDEX IF NOT EXISTS idx_ri_status ON report_instances(status);

-- ============================================================================
-- 5. KPI / KRI DEFINITIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS kpi_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(50) NOT NULL CHECK (category IN ('SECURITY', 'COMPLIANCE', 'RISK', 'GOVERNANCE', 'VEG', 'SAAS', 'AUDIT')),
  unit VARCHAR(50),
  formula TEXT,
  refresh_interval INTEGER NOT NULL DEFAULT 15,
  enabled BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS kri_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(50) NOT NULL CHECK (category IN ('SECURITY', 'COMPLIANCE', 'RISK', 'GOVERNANCE', 'VEG', 'SAAS', 'AUDIT')),
  threshold NUMERIC(10,2),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  enabled BOOLEAN NOT NULL DEFAULT true
);

-- Seed default notification rule
INSERT INTO notification_rules (name, event_type, channels, recipients, subject_template, body_template, conditions, enabled)
VALUES
  ('SLA Breach Alert', 'sla.breach.detected', ARRAY['EMAIL', 'SLACK'], ARRAY['admin@vermeg.com'], 'SLA Breach: {{title}}', 'An SLA breach has been detected for {{title}} on contract {{contract_id}}. Severity: {{severity}}', '{}', true)
ON CONFLICT DO NOTHING;
