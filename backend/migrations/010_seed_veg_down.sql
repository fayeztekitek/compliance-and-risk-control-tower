-- Rollback VEG seed data
DELETE FROM contracts WHERE title IN (
  'BNP Colline SaaS Agreement', 'Credit Agricole DIG Suite Contract',
  'BPCE Security Token Maintenance', 'La Poste Regulatory Engine Support',
  'Orange Infrastructure SLA', 'Generali DRP Framework Contract',
  'Schneider Electric Privacy Assessment', 'TotalEnergies Palmyra License & Support',
  'Renault Production Assurance', 'Thales SLA Management Platform',
  'Michelin Encryption Standards', 'LVMH Executive Dashboard'
);
DELETE FROM opportunities WHERE name IN (
  'Colline Cloud Migration Phase 2 — BNP', 'Soliam Pension API — SG',
  'DIG Suite — Credit Agricole', 'Palmyra Mobile — AXA',
  'Megara Security Token — BPCE', 'Reg Reporting Engine — La Poste',
  'Infra De-risking — Orange', 'SaaS Onboarding — Amundi',
  'DRP Testing — Generali', 'Pen Testing Suite — MAIF',
  'Chronos Integration — Caisse des Depots', 'SaaS PIA — Schneider',
  'Palmyra v8 — TotalEnergies', 'Token Registry — Airbus',
  'Go/No-Go Production — Renault', 'Risk Arbitration — Vinci',
  'SLA Monitoring — Thales', 'Pen Test Framework — Bouygues',
  'Encryption Policy — Michelin', 'Cloud Security — Hermes',
  'Dashboard & KPI — LVMH'
);
DELETE FROM veg_requests WHERE client IN (
  'BNP Paribas', 'Societe Generale', 'Allianz France', 'Credit Agricole',
  'AXA France', 'BPCE', 'La Poste', 'CNP Assurances', 'EDF', 'Orange',
  'Amundi', 'Generali France', 'MAIF', 'Groupama', 'Caisse des Depots',
  'Natixis', 'Schneider Electric', 'L''Oreal', 'TotalEnergies', 'Airbus',
  'Renault', 'Saint-Gobain', 'Vinci', 'Sanofi', 'Thales', 'Veolia',
  'Bouygues Telecom', 'Michelin', 'Danone', 'Engie', 'Accor', 'Hermes', 'LVMH'
);
