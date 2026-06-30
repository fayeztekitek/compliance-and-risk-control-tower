-- ============================================================================
-- Migration 049: Notification Center
-- Enhance notifications table with type/link columns for frontend display
-- Seed rule-based notification generation
-- ============================================================================

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type VARCHAR(50) NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success'));
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link VARCHAR(500);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS entity_type VARCHAR(100);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS entity_id UUID;

CREATE INDEX IF NOT EXISTS idx_notif_recipient_status ON notifications(recipient, status);
CREATE INDEX IF NOT EXISTS idx_notif_type ON notifications(type);
