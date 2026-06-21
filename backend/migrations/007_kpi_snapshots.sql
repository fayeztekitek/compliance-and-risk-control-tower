CREATE TABLE kpi_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category VARCHAR(30) NOT NULL,
  kpi_id VARCHAR(100) NOT NULL,
  kpi_name VARCHAR(255) NOT NULL,
  value NUMERIC(12,2) NOT NULL,
  target NUMERIC(12,2),
  unit VARCHAR(50),
  trend VARCHAR(10) CHECK (trend IN ('UP', 'DOWN', 'STABLE')),
  status VARCHAR(10) CHECK (status IN ('GOOD', 'WARNING', 'CRITICAL'))
);

CREATE INDEX idx_kpi_snapshot_date ON kpi_snapshots(snapshot_date);
CREATE INDEX idx_kpi_category ON kpi_snapshots(category);
CREATE INDEX idx_kpi_id ON kpi_snapshots(kpi_id);

CREATE TABLE kri_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  kri_id VARCHAR(100) NOT NULL,
  kri_name VARCHAR(255) NOT NULL,
  value NUMERIC(12,2) NOT NULL,
  threshold NUMERIC(12,2) NOT NULL,
  unit VARCHAR(50),
  status VARCHAR(10) CHECK (status IN ('GOOD', 'WARNING', 'CRITICAL')),
  category VARCHAR(30) NOT NULL
);

CREATE INDEX idx_kri_date ON kri_records(snapshot_date);
CREATE INDEX idx_kri_category ON kri_records(category);
