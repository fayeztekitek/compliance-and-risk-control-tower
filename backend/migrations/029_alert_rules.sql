-- Sprint 14: Alert Rules + Notifications
-- Migration 029

BEGIN;

CREATE TYPE alert_channel AS ENUM ('EMAIL', 'SLACK', 'BOTH');
CREATE TYPE alert_condition AS ENUM ('SEVERITY', 'EPSS_SCORE', 'CISA_KEV', 'SLA_BREACH', 'MITIGATION_OVERDUE');

CREATE TABLE IF NOT EXISTS alert_rules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    source_tool     finding_source,
    severity_threshold severity,
    condition       alert_condition NOT NULL DEFAULT 'SEVERITY',
    condition_value VARCHAR(100),
    channel         alert_channel NOT NULL DEFAULT 'EMAIL',
    recipients      TEXT[] DEFAULT '{}',
    enabled         BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_alert_rules_enabled ON alert_rules (enabled);
CREATE INDEX idx_alert_rules_source ON alert_rules (source_tool);

ALTER TABLE nexus_alerts ADD COLUMN IF NOT EXISTS rule_id UUID REFERENCES alert_rules(id) ON DELETE SET NULL;
ALTER TABLE nexus_alerts ADD COLUMN IF NOT EXISTS channel alert_channel;
ALTER TABLE nexus_alerts ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
ALTER TABLE nexus_alerts ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(50) DEFAULT 'PENDING';

CREATE INDEX IF NOT EXISTS idx_nexus_alerts_delivery ON nexus_alerts (delivery_status);

COMMIT;
