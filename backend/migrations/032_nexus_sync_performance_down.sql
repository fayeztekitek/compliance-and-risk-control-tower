-- Down: 032_nexus_sync_performance
DROP INDEX IF EXISTS idx_nexus_vulns_scan_app;
DROP INDEX IF EXISTS idx_nexus_scans_aid_date;
DROP INDEX IF EXISTS idx_nexus_apps_org_id;
DROP INDEX IF EXISTS idx_nexus_sync_logs_start_time;
DROP INDEX IF EXISTS idx_uf_source_tool_id;
