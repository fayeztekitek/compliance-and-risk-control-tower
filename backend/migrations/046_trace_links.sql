-- ============================================================================
-- Migration 046: Cross-Traceability Links
-- Generic relationship model linking any two entity types across domains
-- ============================================================================

CREATE TABLE trace_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type VARCHAR(100) NOT NULL,
  source_id UUID NOT NULL,
  target_type VARCHAR(100) NOT NULL,
  target_id UUID NOT NULL,
  relationship_type VARCHAR(100) DEFAULT 'RELATED_TO',
  label VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_type, source_id, target_type, target_id, relationship_type)
);

CREATE INDEX idx_trace_source ON trace_links(source_type, source_id);
CREATE INDEX idx_trace_target ON trace_links(target_type, target_id);
