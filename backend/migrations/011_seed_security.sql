-- ============================================================================
-- Seed Data: Security & Vulnerability Governance (corrected schema)
-- ============================================================================

DO $$
DECLARE
  v1 uuid; v2 uuid; v3 uuid; v4 uuid; v5 uuid;
  v6 uuid; v7 uuid; v8 uuid; v9 uuid; v10 uuid;
  v11 uuid; v12 uuid; v13 uuid; v14 uuid; v15 uuid;
  v16 uuid; v17 uuid; v18 uuid; v19 uuid; v20 uuid;
  w1 uuid; w2 uuid; w3 uuid; w4 uuid; w5 uuid;
  r1 uuid; r2 uuid; r3 uuid; r4 uuid; r5 uuid;
BEGIN

  -- Vulnerabilities (20 records matching actual schema)
  v1 := gen_random_uuid(); v2 := gen_random_uuid(); v3 := gen_random_uuid(); v4 := gen_random_uuid(); v5 := gen_random_uuid();
  v6 := gen_random_uuid(); v7 := gen_random_uuid(); v8 := gen_random_uuid(); v9 := gen_random_uuid(); v10 := gen_random_uuid();
  v11 := gen_random_uuid(); v12 := gen_random_uuid(); v13 := gen_random_uuid(); v14 := gen_random_uuid(); v15 := gen_random_uuid();
  v16 := gen_random_uuid(); v17 := gen_random_uuid(); v18 := gen_random_uuid(); v19 := gen_random_uuid(); v20 := gen_random_uuid();
  w1 := gen_random_uuid(); w2 := gen_random_uuid(); w3 := gen_random_uuid(); w4 := gen_random_uuid(); w5 := gen_random_uuid();
  r1 := gen_random_uuid(); r2 := gen_random_uuid(); r3 := gen_random_uuid(); r4 := gen_random_uuid(); r5 := gen_random_uuid();

  INSERT INTO vulnerabilities (id, title, severity, status, source_scanner, detected_date, remediated_date, sla_due_date, is_false_positive, target_product, owner) VALUES
    (v1,  'CVE-2026-00123 — RCE in Palmyra API Gateway', 'CRITICAL', 'OPEN', 'VERACODE', '2026-06-01', null, '2026-06-15', false, 'palmyra-api-gw.prod.vermeg.com', 'Thomas Lemaire'),
    (v2,  'CVE-2026-00456 — SQL Injection in Colline CRM', 'CRITICAL', 'OPEN', 'NEXPOSE', '2026-05-20', null, '2026-06-10', false, 'colline-crm.vermeg.com', 'Thomas Lemaire'),
    (v3,  'CVE-2026-00789 — SSRF in DIG Onboarding Portal', 'HIGH', 'OPEN', 'VERACODE', '2026-06-05', null, '2026-06-19', false, 'dig-onboarding.vermeg.com', 'Thomas Lemaire'),
    (v4,  'CVE-2026-00134 — Auth Bypass in Soliam API', 'HIGH', 'OPEN', 'PEN_TEST', '2026-05-15', '2026-06-20', '2026-06-05', false, 'soliam-api.vermeg.com', 'Thomas Lemaire'),
    (v5,  'CVE-2026-00567 — Stored XSS in SaaS Dashboard', 'HIGH', 'OPEN', 'VERACODE', '2026-06-08', null, '2026-06-22', false, 'saas-dashboard.vermeg.com', 'Thomas Lemaire'),
    (v6,  'Weak Crypto in Token Service', 'HIGH', 'OPEN', 'NEXPOSE', '2026-06-10', null, '2026-06-24', false, 'megara-token-svc.vermeg.com', 'Thomas Lemaire'),
    (v7,  'LFI in Report Generator', 'MEDIUM', 'OPEN', 'PEN_TEST', '2026-05-25', null, '2026-07-09', true, 'reports.vermeg.com', 'Thomas Lemaire'),
    (v8,  'IDOR in Contract API', 'MEDIUM', 'OPEN', 'PEN_TEST', '2026-06-02', null, '2026-06-16', false, 'contracts-api.vermeg.com', 'Thomas Lemaire'),
    (v9,  'Open S3 Bucket — Colline Backups', 'HIGH', 'OPEN', 'NEXPOSE', '2026-06-12', null, '2026-06-26', false, 's3://colline-backups', 'Thomas Lemaire'),
    (v10, 'Prototype Pollution in Axios', 'MEDIUM', 'REMEDIATED', 'VERACODE', '2026-05-10', '2026-05-12', '2026-06-10', false, 'frontend-node-modules', 'Thomas Lemaire'),
    (v11, 'Redis No Auth', 'CRITICAL', 'REMEDIATED', 'NEXPOSE', '2026-04-20', '2026-04-21', '2026-05-05', false, 'redis-cache.vermeg.com', 'Thomas Lemaire'),
    (v12, 'Log4Shell Variant in Legacy Service', 'CRITICAL', 'REMEDIATED', 'VERACODE', '2026-03-15', '2026-03-16', '2026-04-01', false, 'legacy-logging-svc.vermeg.com', 'Thomas Lemaire'),
    (v13, 'Host Header Injection', 'MEDIUM', 'OPEN', 'NEXPOSE', '2026-06-03', null, '2026-07-03', false, '*.vermeg.com', 'Thomas Lemaire'),
    (v14, 'XXE in Document Parser', 'HIGH', 'OPEN', 'PEN_TEST', '2026-05-30', null, '2026-06-13', false, 'doc-parser.vermeg.com', 'Thomas Lemaire'),
    (v15, 'Path Traversal in File API', 'MEDIUM', 'OPEN', 'PEN_TEST', '2026-06-07', null, '2026-07-07', false, 'files-api.vermeg.com', 'Thomas Lemaire'),
    (v16, 'Hardcoded API Key in Source', 'HIGH', 'REMEDIATED', 'VERACODE', '2026-04-05', '2026-04-06', '2026-04-20', false, 'colline-integration.vermeg.com', 'Thomas Lemaire'),
    (v17, 'CSRF Token Bypass', 'MEDIUM', 'OPEN', 'PEN_TEST', '2026-06-09', null, '2026-07-09', false, 'admin.vermeg.com', 'Thomas Lemaire'),
    (v18, 'TLS 1.0 Deprecated', 'LOW', 'OPEN', 'NEXPOSE', '2026-05-28', null, '2026-08-28', false, 'legacy-api.vermeg.com', 'Thomas Lemaire'),
    (v19, 'Debug Endpoint Exposed', 'MEDIUM', 'REMEDIATED', 'NEXPOSE', '2026-04-18', '2026-04-19', '2026-05-03', false, 'nexus-sync.vermeg.com', 'Thomas Lemaire'),
    (v20, 'Subdomain Takeover — CDN CNAME', 'HIGH', 'OPEN', 'PEN_TEST', '2026-06-11', null, '2026-06-25', false, 'cdn.vermeg.com', 'Thomas Lemaire')
  ON CONFLICT (id) DO NOTHING;

  -- Waivers
  INSERT INTO waivers (id, vulnerability_id, title, rationale, status, request_date, expiry_date, approved_by) VALUES
    (w1, v7, 'Waiver — LFI Report Generator (FP declared)', 'Confirmed false positive. WAF rule added as defense-in-depth. Report generator is VPN-restricted.', 'APPROVED', '2026-05-26', '2026-08-15', 'Fayez Tekitek'),
    (w2, v15, 'Waiver — Path Traversal File API', 'Internal API only, IP-restricted. Fix planned for Q3. WAF blocks ../ patterns.', 'APPROVED', '2026-06-08', '2026-09-01', 'Fayez Tekitek'),
    (w3, v18, 'Waiver — TLS 1.0 Grace Period', 'Legacy client applications need migration. TLS 1.0 disabled once all clients upgraded by Q4.', 'PENDING', '2026-05-29', '2026-08-28', null),
    (w4, v13, 'Waiver — Host Header Injection', 'CDN-level mitigation deployed. Header validation added at ingress. Accepting residual risk for 60 days.', 'PENDING', '2026-06-04', '2026-08-04', null),
    (w5, v17, 'Waiver — CSRF Bypass', 'All sensitive endpoints require JWT in headers. CSRF is defense-in-depth only. Accepting until Q3 rewrite.', 'APPROVED', '2026-06-10', '2026-09-10', 'Fayez Tekitek')
  ON CONFLICT (id) DO NOTHING;

  -- Risk Acceptances
  INSERT INTO risk_acceptances (id, vulnerability_id, title, business_impact, mitigation_plan, status, request_date, expiry_date, approved_by) VALUES
    (r1, v6, 'Accept Weak Crypto Risk', 'Token service disruption for 3 client integrations during rewrite', 'Token service rewrite scheduled for Q3. SHA-256 replaces MD5. Monitoring for abuse.', 'APPROVED', '2026-06-11', '2026-09-30', 'Fayez Tekitek'),
    (r2, v9, 'S3 Bucket Public Access Risk', 'Potential data exposure of production backups', 'Immediate: Block all public access. Short-term: S3 Block Public Access. Long-term: VPC endpoint with encryption.', 'APPROVED', '2026-06-13', '2026-07-31', 'Fayez Tekitek'),
    (r3, v20, 'Subdomain Takeover Risk', 'Phishing attack surface via unclaimed CDN CNAME', 'Domain registrar updated. CDN endpoint claimed. DNS TTL reduced. Monitoring 30 days.', 'PENDING', '2026-06-12', '2026-07-31', null),
    (r4, v9, 'S3 Backup Encryption Gap', 'Unencrypted backups in S3 — compliance risk', 'Server-side encryption with KMS enabled. Existing objects being re-encrypted.', 'APPROVED', '2026-06-01', '2026-06-30', 'Fayez Tekitek'),
    (r5, v4, 'Auth Bypass Mitigation', 'Soliam API vulnerable to JWT algorithm confusion', 'Library updated to reject none algorithm. Forced RS256. Pen test confirmed fix. Remediated.', 'APPROVED', '2026-05-16', '2026-06-15', 'Fayez Tekitek')
  ON CONFLICT (id) DO NOTHING;

END $$;
