ALTER TABLE nexus_kpi_snapshots ADD COLUMN IF NOT EXISTS previous_organizations INTEGER NOT NULL DEFAULT 0;
ALTER TABLE nexus_kpi_snapshots ADD COLUMN IF NOT EXISTS previous_applications INTEGER NOT NULL DEFAULT 0;
