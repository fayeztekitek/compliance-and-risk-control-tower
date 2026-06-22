-- ============================================================================
-- Seed Data: VEG Governance — 30+ realistic VEG requests with opportunities and contracts
-- ============================================================================

-- VEG Requests
DO $$
DECLARE
  v1 uuid; v2 uuid; v3 uuid; v4 uuid; v5 uuid;
  v6 uuid; v7 uuid; v8 uuid; v9 uuid; v10 uuid;
  v11 uuid; v12 uuid; v13 uuid; v14 uuid; v15 uuid;
  v16 uuid; v17 uuid; v18 uuid; v19 uuid; v20 uuid;
  v21 uuid; v22 uuid; v23 uuid; v24 uuid; v25 uuid;
  v26 uuid; v27 uuid; v28 uuid; v29 uuid; v30 uuid;
  v31 uuid; v32 uuid; v33 uuid; v34 uuid; v35 uuid;
  admin_id uuid; po_id uuid; co_id uuid;
BEGIN

  SELECT id INTO admin_id FROM users WHERE email = 'fayez.tekitek@vermeg.com' LIMIT 1;
  SELECT id INTO po_id FROM users WHERE email = 's.laroche@vermeg.com' LIMIT 1;
  SELECT id INTO co_id FROM users WHERE email = 'amandine.rousset@vermeg.com' LIMIT 1;

  IF admin_id IS NULL THEN RETURN; END IF;

  v1 := gen_random_uuid(); v2 := gen_random_uuid(); v3 := gen_random_uuid(); v4 := gen_random_uuid(); v5 := gen_random_uuid();
  v6 := gen_random_uuid(); v7 := gen_random_uuid(); v8 := gen_random_uuid(); v9 := gen_random_uuid(); v10 := gen_random_uuid();
  v11 := gen_random_uuid(); v12 := gen_random_uuid(); v13 := gen_random_uuid(); v14 := gen_random_uuid(); v15 := gen_random_uuid();
  v16 := gen_random_uuid(); v17 := gen_random_uuid(); v18 := gen_random_uuid(); v19 := gen_random_uuid(); v20 := gen_random_uuid();
  v21 := gen_random_uuid(); v22 := gen_random_uuid(); v23 := gen_random_uuid(); v24 := gen_random_uuid(); v25 := gen_random_uuid();
  v26 := gen_random_uuid(); v27 := gen_random_uuid(); v28 := gen_random_uuid(); v29 := gen_random_uuid(); v30 := gen_random_uuid();
  v31 := gen_random_uuid(); v32 := gen_random_uuid(); v33 := gen_random_uuid(); v34 := gen_random_uuid(); v35 := gen_random_uuid();

  INSERT INTO veg_requests (id, title, type, status, client, margin_estimate, workload_md, code_acc, bid_decision, go_nogo_decision, finance_state, sales_state, product_state, legal_state, owner_id, date) VALUES
    (v1,  'BNP Paribas — Colline Cloud Migration Phase 2', 'RFI', 'APPROVED', 'BNP Paribas', 22.5, 480, 'ACC-2026-001', 'BID', 'GO', 'APPROVED', 'APPROVED', 'APPROVED', 'APPROVED', po_id, '2026-01-15'),
    (v2,  'Societe Generale — Soliam Pension API Expansion', 'RFP', 'SUBMITTED', 'Societe Generale', 18.0, 320, 'ACC-2026-002', 'PENDING', 'PENDING', 'APPROVED', 'APPROVED', 'PENDING', 'PENDING', po_id, '2026-02-03'),
    (v3,  'Allianz France — Solife Client Portal v2', 'NEW_CLIENT_REQUEST', 'DRAFT', 'Allianz France', null, null, null, 'PENDING', 'PENDING', 'PENDING', 'PENDING', 'PENDING', 'PENDING', co_id, '2026-06-10'),
    (v4,  'Credit Agricole — DIG Digital Banking Suite', 'RFI', 'APPROVED', 'Credit Agricole', 15.0, 200, 'ACC-2026-003', 'BID', 'GO', 'APPROVED', 'APPROVED', 'APPROVED', 'APPROVED', po_id, '2026-01-20'),
    (v5,  'AXA France — Palmyra Mobile Hybrid App', 'RFP', 'SUBMITTED', 'AXA France', 20.0, 150, 'ACC-2026-004', 'BID', 'PENDING', 'APPROVED', 'APPROVED', 'APPROVED', 'PENDING', co_id, '2026-03-01'),
    (v6,  'BPCE — Megara Security Token Registry', 'RFP', 'CONTRACT_SIGNATURE', 'BPCE', 25.0, 280, 'ACC-2026-005', 'BID', 'GO', 'APPROVED', 'APPROVED', 'APPROVED', 'APPROVED', admin_id, '2025-11-10'),
    (v7,  'La Poste — Regulatory Reporting Engine v12', 'RFI', 'APPROVED', 'La Poste', 12.0, 90, 'ACC-2026-006', 'BID', 'GO', 'APPROVED', 'APPROVED', 'APPROVED', 'APPROVED', admin_id, '2026-02-15'),
    (v8,  'CNP Assurances — Palmyra API Gateway Refactor', 'NEW_CLIENT_REQUEST', 'DRAFT', 'CNP Assurances', null, null, null, 'PENDING', 'PENDING', 'PENDING', 'PENDING', 'PENDING', 'PENDING', po_id, '2026-06-12'),
    (v9,  'EDF — GDPR SaaS Isolation Review', 'BD_REQUEST', 'SUBMITTED', 'EDF', 10.0, 60, null, 'PENDING', 'PENDING', 'PENDING', 'APPROVED', 'APPROVED', 'PENDING', co_id, '2026-04-20'),
    (v10, 'Orange — FY26 Infrastructure De-risking', 'ACC_CODE_CREATION', 'APPROVED', 'Orange', 30.0, 500, 'ACC-2026-007', 'BID', 'GO', 'APPROVED', 'APPROVED', 'APPROVED', 'APPROVED', admin_id, '2026-01-05'),
    (v11, 'BNP Paribas — Data Encryption Review', 'RFI', 'SUBMITTED', 'BNP Paribas', 8.0, 40, null, 'NO_BID', 'PENDING', 'PENDING', 'PENDING', 'PENDING', 'PENDING', po_id, '2026-05-10'),
    (v12, 'Societe Generale — Vulnerability Management Platform', 'RFP', 'DRAFT', 'Societe Generale', null, null, null, 'PENDING', 'PENDING', 'PENDING', 'PENDING', 'PENDING', 'PENDING', admin_id, '2026-06-15'),
    (v13, 'Amundi — SaaS Onboarding Workflow Automation', 'BID_COMMITTEE_OVERSIGHT', 'SUBMITTED', 'Amundi', 16.0, 120, 'ACC-2026-008', 'BID', 'PENDING', 'APPROVED', 'APPROVED', 'PENDING', 'PENDING', co_id, '2026-04-05'),
    (v14, 'Generali France — DRP Testing Framework', 'RFI', 'APPROVED', 'Generali France', 14.0, 75, 'ACC-2026-009', 'BID', 'GO', 'APPROVED', 'APPROVED', 'APPROVED', 'APPROVED', po_id, '2026-03-20'),
    (v15, 'MAIF — Cloud Penetration Testing Suite', 'RFP', 'SUBMITTED', 'MAIF', 19.0, 110, 'ACC-2026-010', 'PENDING', 'PENDING', 'APPROVED', 'APPROVED', 'PENDING', 'PENDING', admin_id, '2026-05-25'),
    (v16, 'Groupama — Identity & Access Management Review', 'RFI', 'APPROVED', 'Groupama', 11.0, 55, 'ACC-2026-011', 'NO_BID', 'NO_GO', 'REJECTED', 'PENDING', 'PENDING', 'APPROVED', co_id, '2026-02-28'),
    (v17, 'Caisse des Depots — Chronos Timesheet Integration', 'NEW_CLIENT_REQUEST', 'DRAFT', 'Caisse des Depots', null, null, null, 'PENDING', 'PENDING', 'PENDING', 'PENDING', 'PENDING', 'PENDING', po_id, '2026-06-18'),
    (v18, 'Natixis — Contractual Compliance Dashboard', 'BD_REQUEST', 'SUBMITTED', 'Natixis', 13.0, 85, null, 'PENDING', 'PENDING', 'PENDING', 'APPROVED', 'PENDING', 'PENDING', admin_id, '2026-05-30'),
    (v19, 'Schneider Electric — SaaS Privacy Impact Assessment', 'RFI', 'APPROVED', 'Schneider Electric', 9.0, 35, 'ACC-2026-012', 'BID', 'GO', 'APPROVED', 'APPROVED', 'APPROVED', 'APPROVED', co_id, '2026-04-12'),
    (v20, 'L''Oreal — Access Audit Automation', 'RFP', 'DRAFT', 'L''Oreal', null, null, null, 'PENDING', 'PENDING', 'PENDING', 'PENDING', 'PENDING', 'PENDING', po_id, '2026-06-20'),
    (v21, 'TotalEnergies — Palmyra Core v8 Upgrade', 'BID_COMMITTEE_OVERSIGHT', 'CONTRACT_SIGNATURE', 'TotalEnergies', 28.0, 600, 'ACC-2026-013', 'BID', 'GO', 'APPROVED', 'APPROVED', 'APPROVED', 'APPROVED', admin_id, '2025-09-15'),
    (v22, 'Airbus — Security Token Registry Evaluation', 'RFI', 'SUBMITTED', 'Airbus', 17.0, 130, 'ACC-2026-014', 'PENDING', 'PENDING', 'APPROVED', 'APPROVED', 'PENDING', 'PENDING', po_id, '2026-05-05'),
    (v23, 'Renault — Go/No-Go Production Readiness', 'ACC_CODE_CREATION', 'APPROVED', 'Renault', 21.0, 180, 'ACC-2026-015', 'BID', 'GO', 'APPROVED', 'APPROVED', 'APPROVED', 'APPROVED', admin_id, '2026-03-10'),
    (v24, 'Saint-Gobain — Vulnerability Risk Register Deployment', 'NEW_CLIENT_REQUEST', 'DRAFT', 'Saint-Gobain', null, null, null, 'PENDING', 'PENDING', 'PENDING', 'PENDING', 'PENDING', 'PENDING', co_id, '2026-06-22'),
    (v25, 'Vinci — Executive Risk Arbitration Platform', 'RFP', 'SUBMITTED', 'Vinci', 24.0, 220, 'ACC-2026-016', 'BID', 'PENDING', 'APPROVED', 'APPROVED', 'PENDING', 'APPROVED', admin_id, '2026-04-28'),
    (v26, 'Sanofi — GDPR Data Processing Inventory', 'BD_REQUEST', 'SUBMITTED', 'Sanofi', 7.0, 45, null, 'PENDING', 'PENDING', 'APPROVED', 'PENDING', 'PENDING', 'PENDING', co_id, '2026-05-15'),
    (v27, 'Thales — SLA Monitoring & Breach Detection', 'RFI', 'APPROVED', 'Thales', 10.0, 70, 'ACC-2026-017', 'BID', 'GO', 'APPROVED', 'APPROVED', 'APPROVED', 'APPROVED', po_id, '2026-04-02'),
    (v28, 'Veolia — Corrective Action Tracking System', 'RFP', 'DRAFT', 'Veolia', null, null, null, 'PENDING', 'PENDING', 'PENDING', 'PENDING', 'PENDING', 'PENDING', admin_id, '2026-06-24'),
    (v29, 'Bouygues Telecom — Penetration Test Framework', 'BID_COMMITTEE_OVERSIGHT', 'SUBMITTED', 'Bouygues Telecom', 15.0, 95, 'ACC-2026-018', 'BID', 'PENDING', 'APPROVED', 'APPROVED', 'APPROVED', 'PENDING', po_id, '2026-05-20'),
    (v30, 'Michelin — Data Encryption Policy Implementation', 'RFI', 'APPROVED', 'Michelin', 6.0, 30, 'ACC-2026-019', 'BID', 'GO', 'APPROVED', 'APPROVED', 'APPROVED', 'APPROVED', co_id, '2026-04-18'),
    (v31, 'Danone — Waiver Management Workflow', 'NEW_CLIENT_REQUEST', 'DRAFT', 'Danone', null, null, null, 'PENDING', 'PENDING', 'PENDING', 'PENDING', 'PENDING', 'PENDING', admin_id, '2026-06-25'),
    (v32, 'Engie — RTD Review Automation', 'BD_REQUEST', 'SUBMITTED', 'Engie', 12.0, 50, null, 'PENDING', 'PENDING', 'PENDING', 'APPROVED', 'PENDING', 'PENDING', po_id, '2026-06-01'),
    (v33, 'Accor — Committee Decision Tracking Portal', 'RFP', 'DRAFT', 'Accor', null, null, null, 'PENDING', 'PENDING', 'PENDING', 'PENDING', 'PENDING', 'PENDING', co_id, '2026-06-26'),
    (v34, 'Hermes — Cloud Security Posture Review', 'RFI', 'SUBMITTED', 'Hermes', 11.0, 65, 'ACC-2026-020', 'PENDING', 'PENDING', 'APPROVED', 'PENDING', 'APPROVED', 'PENDING', admin_id, '2026-06-05'),
    (v35, 'LVMH — Executive Dashboard & KPI Reporting', 'ACC_CODE_CREATION', 'APPROVED', 'LVMH', 20.0, 160, 'ACC-2026-021', 'BID', 'GO', 'APPROVED', 'APPROVED', 'APPROVED', 'APPROVED', admin_id, '2026-02-10')
  ON CONFLICT (id) DO NOTHING;

  -- Opportunities (linked to VEG requests)
  INSERT INTO opportunities (id, veg_request_id, name, value, sales_stage, contract_signed) VALUES
    (gen_random_uuid(), v1,  'Colline Cloud Migration Phase 2 — BNP', 450000, 'WON', true),
    (gen_random_uuid(), v2,  'Soliam Pension API — SG', 320000, 'NEGOTIATION', false),
    (gen_random_uuid(), v4,  'DIG Suite — Credit Agricole', 280000, 'WON', true),
    (gen_random_uuid(), v5,  'Palmyra Mobile — AXA', 180000, 'NEGOTIATION', false),
    (gen_random_uuid(), v6,  'Megara Security Token — BPCE', 520000, 'WON', true),
    (gen_random_uuid(), v7,  'Reg Reporting Engine — La Poste', 150000, 'WON', true),
    (gen_random_uuid(), v10, 'Infra De-risking — Orange', 780000, 'WON', true),
    (gen_random_uuid(), v13, 'SaaS Onboarding — Amundi', 200000, 'PROPOSAL_SUBMITTED', false),
    (gen_random_uuid(), v14, 'DRP Testing — Generali', 120000, 'WON', true),
    (gen_random_uuid(), v15, 'Pen Testing Suite — MAIF', 170000, 'PROPOSAL_SUBMITTED', false),
    (gen_random_uuid(), v17, 'Chronos Integration — Caisse des Depots', 95000, 'QUALIFICATION', false),
    (gen_random_uuid(), v19, 'SaaS PIA — Schneider', 80000, 'WON', true),
    (gen_random_uuid(), v21, 'Palmyra v8 — TotalEnergies', 920000, 'WON', true),
    (gen_random_uuid(), v22, 'Token Registry — Airbus', 210000, 'BID_PREPARATION', false),
    (gen_random_uuid(), v23, 'Go/No-Go Production — Renault', 290000, 'WON', true),
    (gen_random_uuid(), v25, 'Risk Arbitration — Vinci', 350000, 'PROPOSAL_SUBMITTED', false),
    (gen_random_uuid(), v27, 'SLA Monitoring — Thales', 130000, 'WON', true),
    (gen_random_uuid(), v29, 'Pen Test Framework — Bouygues', 160000, 'BID_PREPARATION', false),
    (gen_random_uuid(), v30, 'Encryption Policy — Michelin', 70000, 'WON', true),
    (gen_random_uuid(), v34, 'Cloud Security — Hermes', 110000, 'BID_PREPARATION', false),
    (gen_random_uuid(), v35, 'Dashboard & KPI — LVMH', 260000, 'WON', true)
  ON CONFLICT (id) DO NOTHING;

  -- Contracts (linked to won opportunities)
  INSERT INTO contracts (id, opportunity_id, title, start_date, end_date, sla_commitments, compliance_status, maintenance_saas) VALUES
    (gen_random_uuid(), (SELECT id FROM opportunities WHERE name LIKE 'Colline Cloud%' LIMIT 1), 'BNP Colline SaaS Agreement', '2026-03-01', '2028-02-28', '99.9% uptime, 4h response for critical incidents, quarterly vulnerability scans', 'COMPLIANT', true),
    (gen_random_uuid(), (SELECT id FROM opportunities WHERE name LIKE 'DIG Suite%' LIMIT 1), 'Credit Agricole DIG Suite Contract', '2026-04-01', '2029-03-31', '99.5% uptime, 8h response, monthly SLA reporting', 'COMPLIANT', false),
    (gen_random_uuid(), (SELECT id FROM opportunities WHERE name LIKE 'Megara Security%' LIMIT 1), 'BPCE Security Token Maintenance', '2026-01-01', '2028-12-31', '24/7 security monitoring, 1h critical response, weekly scans', 'COMPLIANT', true),
    (gen_random_uuid(), (SELECT id FROM opportunities WHERE name LIKE 'Reg Reporting%' LIMIT 1), 'La Poste Regulatory Engine Support', '2026-03-15', '2027-03-14', '99.9% uptime during reporting windows, 2h response', 'COMPLIANT', false),
    (gen_random_uuid(), (SELECT id FROM opportunities WHERE name LIKE 'Infra De-risking%' LIMIT 1), 'Orange Infrastructure SLA', '2026-02-01', '2028-01-31', '99.95% uptime, 15min critical response, daily backups', 'COMPLIANT', true),
    (gen_random_uuid(), (SELECT id FROM opportunities WHERE name LIKE 'DRP Testing%' LIMIT 1), 'Generali DRP Framework Contract', '2026-05-01', '2027-10-31', 'Semi-annual DRP testing, 4h RTO, 24h RPO', 'WARNING', false),
    (gen_random_uuid(), (SELECT id FROM opportunities WHERE name LIKE 'SaaS PIA%' LIMIT 1), 'Schneider Electric Privacy Assessment', '2026-06-01', '2026-12-31', 'Quarterly privacy reviews, annual DPIA updates', 'COMPLIANT', false),
    (gen_random_uuid(), (SELECT id FROM opportunities WHERE name LIKE 'Palmyra v8%' LIMIT 1), 'TotalEnergies Palmyra License & Support', '2025-11-01', '2028-10-31', '99.99% uptime, 15min response, 24/7 support, quarterly upgrades', 'COMPLIANT', true),
    (gen_random_uuid(), (SELECT id FROM opportunities WHERE name LIKE 'Go/No-Go%' LIMIT 1), 'Renault Production Assurance', '2026-05-15', '2027-05-14', 'Monthly readiness reviews, pre-deployment security validation', 'COMPLIANT', false),
    (gen_random_uuid(), (SELECT id FROM opportunities WHERE name LIKE 'SLA Monitoring%' LIMIT 1), 'Thales SLA Management Platform', '2026-06-01', '2028-05-31', 'Real-time SLA monitoring, automated breach alerts, monthly reports', 'NON_COMPLIANT', true),
    (gen_random_uuid(), (SELECT id FROM opportunities WHERE name LIKE 'Encryption Policy%' LIMIT 1), 'Michelin Encryption Standards', '2026-06-15', '2027-06-14', 'Annual encryption audit, policy compliance verification', 'COMPLIANT', false),
    (gen_random_uuid(), (SELECT id FROM opportunities WHERE name LIKE 'Dashboard%' LIMIT 1), 'LVMH Executive Dashboard', '2026-03-01', '2028-02-28', '99.9% uptime, daily KPI refresh, quarterly feature updates', 'COMPLIANT', true)
  ON CONFLICT (id) DO NOTHING;

END $$;
