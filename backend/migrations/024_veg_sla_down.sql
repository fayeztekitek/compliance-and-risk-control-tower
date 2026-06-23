-- Migration 024 Down: Remove VEG SLA columns

ALTER TABLE veg_requests DROP COLUMN IF EXISTS due_date;
