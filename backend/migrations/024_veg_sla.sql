-- Migration 024: VEG SLA Tracking
-- Adds due_date to veg_requests and SLA breach tracking

ALTER TABLE veg_requests
ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_veg_due_date ON veg_requests(due_date);
