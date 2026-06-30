CREATE TABLE IF NOT EXISTS report_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  template_id UUID REFERENCES report_templates(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  cron VARCHAR(100) NOT NULL,
  format VARCHAR(10) NOT NULL DEFAULT 'HTML' CHECK (format IN ('CSV', 'PDF', 'XLSX', 'HTML')),
  params JSONB NOT NULL DEFAULT '{}',
  recipients TEXT[] NOT NULL DEFAULT '{}',
  channels TEXT[] NOT NULL DEFAULT '{"EMAIL"}',
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_report_schedules_enabled ON report_schedules (is_enabled, next_run_at);

CREATE TABLE IF NOT EXISTS report_distribution_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  instance_id UUID REFERENCES report_instances(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES report_schedules(id) ON DELETE SET NULL,
  channel VARCHAR(20) NOT NULL CHECK (channel IN ('EMAIL', 'SLACK', 'IN_APP', 'WEBHOOK')),
  recipient VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'FAILED')),
  delivered_at TIMESTAMPTZ,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_report_distribution_instance ON report_distribution_log (instance_id);
