-- ============================================================================
-- Seed Data: Nexus IQ — corrected for actual normalized schema
-- ============================================================================

DO $$
DECLARE
  pid_palmyra varchar := 'PRD-PALMYRA';
  pid_colline varchar := 'PRD-COLLINE';
  pid_soliam varchar := 'PRD-SOLIAM';
  pid_digital varchar := 'PRD-DIGITAL';
  pid_megara varchar := 'PRD-MEGARA';
  aid_palm_api varchar := 'APP-PALM-API';
  aid_palm_web varchar := 'APP-PALM-WEB';
  aid_coll_crm varchar := 'APP-COLL-CRM';
  aid_soli_api varchar := 'APP-SOLI-API';
  aid_dig_onb varchar := 'APP-DIG-ONB';
  aid_meg_token varchar := 'APP-MEG-TOKEN';
BEGIN

  INSERT INTO nexus_organizations (organization_id, organization_name) VALUES
    ('org-vermeg', 'Vermeg International')
  ON CONFLICT (organization_id) DO NOTHING;

  INSERT INTO nexus_products (product_id, name, status, business_criticality, security_owner, product_owner) VALUES
    (pid_palmyra, 'Palmyra Platform', 'ORANGE', 'CRITICAL', 'Thomas Lemaire', 'Sarah Laroche'),
    (pid_colline, 'Colline Regulatory Cloud', 'ORANGE', 'CRITICAL', 'Thomas Lemaire', 'Marc-Antoine Dubois'),
    (pid_soliam, 'Soliam Pension & Insurance', 'GREEN', 'HIGH', 'Thomas Lemaire', 'Robert Martin'),
    (pid_digital, 'DIG Digital Banking', 'GREEN', 'HIGH', 'Thomas Lemaire', 'Clara Besson'),
    (pid_megara, 'Megara Security Services', 'GREEN', 'CRITICAL', 'Thomas Lemaire', 'Jean Dupont')
  ON CONFLICT (product_id) DO NOTHING;

  INSERT INTO nexus_applications (application_id, application_public_id, application_name, organization_id, business_criticality, security_owner, product_owner, tags) VALUES
    (aid_palm_api, 'palm-api-gw', 'Palmyra API Gateway', 'org-vermeg', 'CRITICAL', 'Thomas Lemaire', 'Sarah Laroche', ARRAY['gateway', 'nodejs']),
    (aid_palm_web, 'palm-web-portal', 'Palmyra Web Portal', 'org-vermeg', 'HIGH', 'Thomas Lemaire', 'Sarah Laroche', ARRAY['frontend', 'react']),
    (aid_coll_crm, 'colline-crm', 'Colline CRM', 'org-vermeg', 'CRITICAL', 'Thomas Lemaire', 'Marc-Antoine Dubois', ARRAY['crm', 'java']),
    (aid_soli_api, 'soliam-pension-api', 'Soliam Pension API', 'org-vermeg', 'HIGH', 'Thomas Lemaire', 'Robert Martin', ARRAY['api', 'python']),
    (aid_dig_onb, 'dig-onboarding', 'DIG Onboarding Service', 'org-vermeg', 'HIGH', 'Thomas Lemaire', 'Clara Besson', ARRAY['onboarding', 'nodejs']),
    (aid_meg_token, 'megara-token-svc', 'Megara Token Service', 'org-vermeg', 'CRITICAL', 'Thomas Lemaire', 'Jean Dupont', ARRAY['security', 'rust'])
  ON CONFLICT (application_id) DO NOTHING;

  INSERT INTO product_application_mapping (product_id, application_id) VALUES
    (pid_palmyra, aid_palm_api), (pid_palmyra, aid_palm_web),
    (pid_colline, aid_coll_crm),
    (pid_soliam, aid_soli_api),
    (pid_digital, aid_dig_onb),
    (pid_megara, aid_meg_token)
  ON CONFLICT DO NOTHING;

  INSERT INTO nexus_vulnerabilities (vulnerability_id, ref_id, cvss_score, severity, component_name, component_version, recommended_version, fix_available, exploitability, first_seen_date, last_seen_date, status, application_id) VALUES
    ('NX-CRIT-001', 'SONAR-2026-001', 9.4, 'CRITICAL', 'lodash', '4.17.20', '4.17.21', true, 'EASY', '2026-06-01', '2026-06-15', 'Open', aid_palm_api),
    ('NX-CRIT-002', 'SNYK-2026-002', 9.0, 'CRITICAL', 'ojdbc8', '19.3', '19.8', true, 'EASY', '2026-05-28', '2026-06-15', 'Open', aid_coll_crm),
    ('NX-HIGH-003', 'SONAR-2026-003', 7.8, 'HIGH', 'marked', '4.0.0', '5.0.0', true, 'MEDIUM', '2026-06-03', '2026-06-15', 'Open', aid_palm_web),
    ('NX-HIGH-004', 'DEP-2026-004', 7.5, 'HIGH', 'openssl', '1.1.1', '3.0.0', true, 'EASY', '2026-05-15', '2026-06-10', 'Fixed', aid_soli_api),
    ('NX-HIGH-005', 'SNYK-2026-005', 8.1, 'HIGH', 'jackson-databind', '2.13.0', '2.14.0', true, 'MEDIUM', '2026-06-05', '2026-06-15', 'Open', aid_dig_onb),
    ('NX-MED-006', 'SONAR-2026-006', 5.5, 'MEDIUM', 'jest', '29.0.0', '29.5.0', false, 'HARD', '2026-05-20', '2026-05-25', 'False Positive', aid_meg_token),
    ('NX-HIGH-007', 'SNYK-2026-007', 8.2, 'HIGH', 'file-upload', '3.0.0', '3.1.0', true, 'MEDIUM', '2026-06-02', '2026-06-15', 'Open', aid_coll_crm),
    ('NX-MED-008', 'DEP-2026-008', 5.3, 'MEDIUM', 'bcryptjs', '2.3.0', '2.4.3', true, 'MEDIUM', '2026-06-07', '2026-06-15', 'Open', aid_palm_api),
    ('NX-CRIT-009', 'SONAR-2026-009', 10.0, 'CRITICAL', 'log4j-core', '2.14.1', '2.17.0', true, 'EASY', '2026-04-01', '2026-04-05', 'Fixed', aid_soli_api),
    ('NX-HIGH-010', 'SNYK-2026-010', 7.3, 'HIGH', 'express', '4.17.1', '4.18.0', true, 'MEDIUM', '2026-06-06', '2026-06-15', 'Open', aid_dig_onb),
    ('NX-MED-011', 'SONAR-2026-011', 4.9, 'MEDIUM', 'express-rate-limit', '5.0.0', '6.0.0', true, 'HARD', '2026-05-25', '2026-06-01', 'Fixed', aid_meg_token),
    ('NX-HIGH-012', 'DEP-2026-012', 7.7, 'HIGH', 'merge-deep', '3.0.2', '4.0.0', true, 'MEDIUM', '2026-06-08', '2026-06-15', 'Open', aid_dig_onb),
    ('NX-CRIT-013', 'SNYK-2026-013', 9.8, 'CRITICAL', 'xerces', '2.12.0', '2.12.1', true, 'EASY', '2026-06-04', '2026-06-15', 'Open', aid_coll_crm),
    ('NX-HIGH-014', 'SONAR-2026-014', 7.1, 'HIGH', 'serve-static', '1.14.1', '1.15.0', true, 'MEDIUM', '2026-06-09', '2026-06-15', 'Open', aid_palm_api),
    ('NX-LOW-015', 'DEP-2026-015', 3.2, 'LOW', 'moment', '2.29.1', '2.29.4', true, 'THEORETICAL', '2026-06-10', '2026-06-15', 'Open', aid_palm_web);

  INSERT INTO nexus_sync_logs (batch_id, source_system, start_time, end_time, executed_by, status, summary, target_url) VALUES
    ('SYNC-2026-0615-001', 'Sonatype', '2026-06-15 06:00:00+00', '2026-06-15 06:05:20+00', 'system', 'SUCCESS', '{"sources":["Sonatype","Snyk","DependencyCheck"],"products_synced":5,"vulnerabilities_found":15,"errors":0}', 'https://nexus-iq.vermeg.com'),
    ('SYNC-2026-0614-001', 'Snyk', '2026-06-14 06:00:00+00', '2026-06-14 06:04:10+00', 'system', 'SUCCESS', '{"sources":["Snyk"],"products_synced":3,"vulnerabilities_found":8,"errors":1}', 'https://nexus-iq.vermeg.com'),
    ('SYNC-2026-0613-001', 'DependencyCheck', '2026-06-13 06:00:00+00', '2026-06-13 06:03:45+00', 'system', 'FAILED', '{"sources":["DependencyCheck"],"products_synced":0,"vulnerabilities_found":0,"errors":1,"error":"Connection timeout to OSS Index"}', 'https://nexus-iq.vermeg.com');

  INSERT INTO nexus_kpi_snapshots (snapshot_date, global_security_risk_score, total_vulnerabilities, critical_vulnerabilities, high_vulnerabilities, new_vulnerabilities, fixed_vulnerabilities, accepted_risk_count, expired_waivers_count, products_red_count, products_orange_count, products_green_count, security_debt_score, compliance_score) VALUES
    ('2026-06-15', 72, 28, 5, 9, 3, 2, 2, 1, 0, 2, 3, 1450, 82.5),
    ('2026-06-14', 74, 29, 5, 10, 4, 1, 2, 1, 0, 2, 3, 1520, 81.0),
    ('2026-06-13', 73, 29, 5, 10, 2, 1, 2, 1, 0, 2, 3, 1480, 81.5),
    ('2026-06-12', 71, 28, 4, 10, 2, 2, 2, 1, 0, 2, 3, 1410, 83.0),
    ('2026-06-11', 70, 27, 4, 9, 1, 1, 2, 0, 0, 2, 3, 1380, 83.5),
    ('2026-06-10', 68, 26, 4, 9, 3, 2, 2, 0, 0, 2, 3, 1320, 84.0),
    ('2026-06-09', 67, 25, 3, 9, 2, 1, 2, 0, 0, 2, 3, 1280, 84.5),
    ('2026-06-08', 65, 24, 3, 8, 2, 3, 2, 0, 0, 2, 3, 1220, 85.0),
    ('2026-06-07', 66, 24, 3, 8, 1, 0, 2, 0, 0, 2, 3, 1240, 85.0),
    ('2026-06-06', 63, 23, 3, 7, 2, 1, 1, 0, 0, 2, 3, 1180, 86.0),
    ('2026-06-05', 62, 22, 2, 7, 1, 2, 1, 0, 0, 2, 3, 1120, 86.5),
    ('2026-06-04', 60, 21, 2, 6, 1, 1, 1, 0, 0, 2, 3, 1080, 87.0),
    ('2026-06-03', 61, 21, 2, 6, 2, 0, 1, 0, 0, 2, 3, 1100, 87.0),
    ('2026-06-02', 59, 20, 2, 5, 1, 2, 1, 0, 0, 2, 3, 1050, 87.5),
    ('2026-06-01', 58, 19, 1, 5, 0, 1, 1, 0, 0, 2, 3, 980, 88.0)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO nexus_alerts (alert_type, message, product_id, application_id, timestamp, archived) VALUES
    ('CRITICAL_VULNERABILITY', 'Critical RCE in lodash@4.17.20 affecting Palmyra API Gateway. CVSS 9.4. Patch available: upgrade to 4.17.21.', pid_palmyra, aid_palm_api, '2026-06-15 08:30:00+00', false),
    ('SCORE_DEGRADED', 'Global security risk score increased from 70 to 72. Critical vulns up by 1. High vulns up by 1.', null, null, '2026-06-15 06:05:00+00', false),
    ('WAIVER_EXPIRING', 'TLS 1.0 waiver for legacy-api.vermeg.com expires in 60 days. Begin migration planning.', null, null, '2026-06-15 06:05:00+00', false),
    ('HIGH_VULN_INCREASE', 'High severity vulnerability count increased in DIG Onboarding Service (6 → 8). Review required.', pid_digital, aid_dig_onb, '2026-06-14 06:05:00+00', false),
    ('OUTDATED_SCAN', 'Soliam Pension API last scanned 15 days ago. Recommended scan interval is 7 days.', pid_soliam, aid_soli_api, '2026-06-14 06:05:00+00', false)
  ON CONFLICT (id) DO NOTHING;

END $$;
