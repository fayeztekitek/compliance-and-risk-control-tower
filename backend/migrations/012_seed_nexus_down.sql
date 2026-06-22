-- Rollback Nexus seed data
DELETE FROM nexus_alerts;
DELETE FROM nexus_kpi_snapshots;
DELETE FROM nexus_sync_logs;
DELETE FROM nexus_vulnerabilities;
DELETE FROM product_application_mapping;
DELETE FROM nexus_applications;
DELETE FROM nexus_products;
DELETE FROM nexus_config;
