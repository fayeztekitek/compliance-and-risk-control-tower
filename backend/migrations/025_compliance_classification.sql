-- ============================================================================
-- Migration 025: Compliance Classification & Regulatory Mapping
-- Creates compliance_classification table for mapping findings to regulations
-- and regulatory_mapping table for severity-based SLA rules.
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'regulatory_framework') THEN
    CREATE TYPE regulatory_framework AS ENUM ('GDPR', 'DORA', 'SOX', 'PCI_DSS', 'ISO_27001', 'NIST_800_53');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS compliance_classification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  finding_id UUID REFERENCES unified_findings(id) ON DELETE CASCADE,
  framework regulatory_framework NOT NULL,
  control_id VARCHAR(50),
  requirement TEXT,
  impact_assessment TEXT,
  sla_deadline TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'BREACHED', 'REMEDIATED')),
  UNIQUE (finding_id, framework, control_id)
);

CREATE TABLE IF NOT EXISTS regulatory_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  framework regulatory_framework NOT NULL,
  severity VARCHAR(20) NOT NULL,
  control_id VARCHAR(50) NOT NULL,
  requirement_description TEXT,
  sla_days INTEGER NOT NULL,
  UNIQUE (framework, severity)
);

-- Seed default regulatory mappings
INSERT INTO regulatory_mapping (framework, severity, control_id, requirement_description, sla_days) VALUES
  ('GDPR', 'CRITICAL', 'ART.32', 'Security of processing – personal data breach notification', 3),
  ('GDPR', 'HIGH', 'ART.33', 'Notification of a personal data breach to supervisory authority', 3),
  ('DORA', 'CRITICAL', 'ART.12', 'ICT risk management – critical functions', 1),
  ('DORA', 'HIGH', 'ART.13', 'ICT risk management – important functions', 1),
  ('SOX', 'CRITICAL', 'SEC.302', 'Corporate responsibility for financial reports', 30),
  ('SOX', 'HIGH', 'SEC.404', 'Internal control over financial reporting', 30),
  ('PCI_DSS', 'CRITICAL', 'REQ.6.1', 'Install security-critical patches within 30 days', 30),
  ('PCI_DSS', 'HIGH', 'REQ.11.2', 'Run internal and external network vulnerability scans', 90),
  ('ISO_27001', 'CRITICAL', 'A.12.6.1', 'Management of technical vulnerabilities', 30),
  ('ISO_27001', 'HIGH', 'A.12.6.1', 'Management of technical vulnerabilities', 60),
  ('ISO_27001', 'MEDIUM', 'A.12.6.1', 'Management of technical vulnerabilities', 90),
  ('ISO_27001', 'LOW', 'A.12.6.1', 'Management of technical vulnerabilities', 90),
  ('NIST_800_53', 'CRITICAL', 'RA-5', 'Vulnerability scanning and remediation', 30),
  ('NIST_800_53', 'HIGH', 'RA-5', 'Vulnerability scanning and remediation', 60),
  ('NIST_800_53', 'MEDIUM', 'RA-5', 'Vulnerability scanning and remediation', 90),
  ('NIST_800_53', 'LOW', 'RA-5', 'Vulnerability scanning and remediation', 120)
ON CONFLICT (framework, severity) DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cc_finding ON compliance_classification(finding_id);
CREATE INDEX IF NOT EXISTS idx_cc_framework ON compliance_classification(framework);
CREATE INDEX IF NOT EXISTS idx_cc_status ON compliance_classification(status);
CREATE INDEX IF NOT EXISTS idx_cc_sla ON compliance_classification(sla_deadline) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_rm_framework ON regulatory_mapping(framework);
