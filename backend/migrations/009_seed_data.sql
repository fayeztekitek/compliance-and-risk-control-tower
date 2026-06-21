-- ============================================================================
-- Seed Data: Populate reference tables with initial mock data
-- ============================================================================

-- VA: Users will be created via registration or seed script (bcrypt hashes).
-- This SQL file seeds non-sensitive reference data only.

-- Committees
INSERT INTO committees (name, date, time, type, status, participants, agenda)
VALUES
  ('VEG Steering Committee - June', '2026-06-15', '10:00', 'VEG_COMMITTEE', 'PLANNED', ARRAY['Fayez Tekitek', 'Amandine Rousset', 'Sarah Laroche'], ARRAY['Review Q2 pipeline', 'Approve pending bids', 'Discuss margin targets']),
  ('Vulnerability Review Board', '2026-06-18', '14:00', 'VULNERABILITY_COMMITTEE', 'PLANNED', ARRAY['Thomas Lemaire', 'Marc-Antoine Dubois', 'Fayez Tekitek'], ARRAY['Critical CVE review', 'Waiver approval requests', 'SLA breach analysis']),
  ('SaaS Steering Committee', '2026-06-20', '11:00', 'SAAS_STEERING', 'PLANNED', ARRAY['Amandine Rousset', 'Sarah Laroche', 'Thomas Lemaire'], ARRAY['GDPR compliance status', 'New SaaS onboarding review', 'Offboarding schedule']),
  ('Executive Security Council', '2026-06-25', '09:00', 'EXECUTIVE_SECURITY', 'PLANNED', ARRAY['Fayez Tekitek', 'Thomas Lemaire', 'Marc-Antoine Dubois'], ARRAY['Security posture review', 'Budget for remediation', 'Risk acceptance review']);

-- SaaS Applications
INSERT INTO saas_applications (name, lifecycle_stage, go_live_readiness_score, privacy_design_status, steering_check_passed, data_category, gdpr_risk_impact, owner)
VALUES
  ('Salesforce CRM', 'GO_LIVE', 92, 'COMPLIANT', TRUE, 'PII_COMMON', 'MEDIUM', 'Sarah Laroche'),
  ('Jira Cloud', 'GO_LIVE', 88, 'COMPLIANT', TRUE, 'NON_PII', 'LOW', 'Robert Martin'),
  ('Confluence Cloud', 'GO_LIVE', 85, 'COMPLIANT', TRUE, 'NON_PII', 'LOW', 'Robert Martin'),
  ('Workday HR', 'ONBOARDING', 45, 'PENDING', FALSE, 'PII_SENSITIVE', 'HIGH', 'Amandine Rousset'),
  ('Datadog', 'GO_LIVE', 78, 'COMPLIANT', TRUE, 'NON_PII', 'LOW', 'Thomas Lemaire'),
  ('New SaaS Tool', 'ONBOARDING', 30, 'PENDING', FALSE, 'PII_COMMON', 'MEDIUM', 'Amandine Rousset');

-- Contractual Obligations
INSERT INTO contractual_obligations (title, source_contract, requirement, frequency, last_verified_date, status, verified_by)
VALUES
  ('SOC2 Type II Report Submission', 'Master Services Agreement', 'Submit annual SOC2 Type II report within 30 days of completion', 'ANNUALLY', '2026-01-15', 'COMPLIANT', 'Julien Mercer'),
  ('Quarterly Access Review', 'Colline SaaS Agreement', 'Perform quarterly access review for all production systems', 'QUARTERLY', '2026-04-01', 'COMPLIANT', 'Julien Mercer'),
  ('GDPR Data Processing Record', 'GDPR Compliance Addendum', 'Maintain up-to-date records of processing activities', 'MONTHLY', '2026-06-01', 'COMPLIANT', 'Amandine Rousset'),
  ('Penetration Test Report', 'Security Schedule', 'Annual penetration test of all internet-facing systems', 'ANNUALLY', '2025-11-15', 'COMPLIANT', 'Thomas Lemaire'),
  ('BCP/DRP Test Results', 'Business Continuity Agreement', 'Semi-annual disaster recovery test with documented results', 'SEMI_ANNUALLY', '2026-03-01', 'COMPLIANT', 'Marc-Antoine Dubois'),
  ('Vulnerability Scan Reports', 'Colline SaaS Agreement', 'Weekly vulnerability scans with remediation tracking', 'MONTHLY', '2026-06-10', 'COMPLIANT', 'Thomas Lemaire'),
  ('Subprocessor List Update', 'GDPR Compliance Addendum', 'Notify and update subprocessor list annually', 'ANNUALLY', '2026-01-01', 'NON_COMPLIANT', 'Amandine Rousset'),
  ('Employee Security Training Records', 'Security Schedule', 'Annual security awareness training for all employees', 'ANNUALLY', '2025-12-01', 'NON_COMPLIANT', 'Thomas Lemaire'),
  ('Patch Management Report', 'Colline SaaS Agreement', 'Monthly patch compliance report for infrastructure', 'MONTHLY', '2026-05-15', 'WARNING', 'Robert Martin'),
  ('Third Party Risk Assessment', 'Master Services Agreement', 'Annual third-party risk assessment for critical vendors', 'ANNUALLY', '2025-10-01', 'OVERDUE', 'Marc-Antoine Dubois');

-- Audits
INSERT INTO audits (title, type, date, status, lead_auditor) VALUES
  ('SaaS Contractual Compliance Audit Q2 2026', 'SAAS_CONTRACTUAL', '2026-06-01', 'IN_PROGRESS', 'Julien Mercer'),
  ('User Access Review - Production Systems', 'ACCESS_AUDIT', '2026-05-15', 'COMPLETED', 'Julien Mercer'),
  ('Disaster Recovery Plan Test - Q2', 'BACKUP_DRP', '2026-04-20', 'COMPLETED', 'Marc-Antoine Dubois'),
  ('Vulnerability Management Process Audit', 'VULNERABILITY', '2026-06-10', 'IN_PROGRESS', 'Julien Mercer'),
  ('Encryption Standards Review', 'ENCRYPTION', '2026-03-01', 'COMPLETED', 'Thomas Lemaire');

-- Some audit findings
INSERT INTO audit_findings (audit_id, title, description, severity, status, target_entity)
SELECT id, 'Incomplete access revocation for terminated employees', 'Three terminated employees still had active database access 30 days after termination', 'HIGH', 'OPEN', 'HR Systems'
FROM audits WHERE title = 'User Access Review - Production Systems'
UNION ALL
SELECT id, 'No encryption at rest for backup tapes', 'Backup tapes stored offsite are not encrypted', 'CRITICAL', 'CLOSED', 'Backup Infrastructure'
FROM audits WHERE title = 'Encryption Standards Review'
UNION ALL
SELECT id, 'Missing DRP documentation for Soliam Cloud', 'Soliam Cloud migration DRP documentation has not been updated since 2024', 'MEDIUM', 'OPEN', 'Soliam Cloud Migration'
FROM audits WHERE title = 'Disaster Recovery Plan Test - Q2';
