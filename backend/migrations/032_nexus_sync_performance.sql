-- 032: Nexus Sync Performance
-- Adds unique constraint on unified_findings to fix duplicate insertion bug,
-- plus performance indexes for sync operations.

-- 1. Clean duplicates from unified_findings (keep most recent row per source_tool+source_id)
WITH dups AS (
  SELECT id, source_tool, source_id, created_at,
         ROW_NUMBER() OVER (PARTITION BY source_tool, source_id ORDER BY created_at DESC) AS rn
  FROM unified_findings
  WHERE source_tool IS NOT NULL AND source_id IS NOT NULL
)
DELETE FROM unified_findings WHERE id IN (
  SELECT id FROM dups WHERE rn > 1
);

-- 2. Add unique constraint on unified_findings to prevent future duplicates
DROP INDEX IF EXISTS idx_uf_source_tool_id;
CREATE UNIQUE INDEX IF NOT EXISTS idx_uf_source_tool_id ON unified_findings (source_tool, source_id)
  WHERE source_tool IS NOT NULL AND source_id IS NOT NULL;

-- 3. Index for sync log listing (ORDER BY start_time DESC)
CREATE INDEX IF NOT EXISTS idx_nexus_sync_logs_start_time ON nexus_sync_logs (start_time DESC);

-- 4. Index for application lookups by organization (used during KPI recalc and filtering)
CREATE INDEX IF NOT EXISTS idx_nexus_apps_org_id ON nexus_applications (organization_id);

-- 5. Composite index for latest scan lookups per application
CREATE INDEX IF NOT EXISTS idx_nexus_scans_aid_date ON nexus_scan_reports (application_id, scan_date DESC);

-- 6. Composite index for vulnerability lookups by scan+app (used during KPI recalc)
CREATE INDEX IF NOT EXISTS idx_nexus_vulns_scan_app ON nexus_vulnerabilities (scan_id, application_id);
