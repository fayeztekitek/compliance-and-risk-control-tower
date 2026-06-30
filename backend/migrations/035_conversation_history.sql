CREATE TABLE IF NOT EXISTS conversation_history (
  id VARCHAR(100) PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL DEFAULT 'New conversation',
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  page_context JSONB DEFAULT '{}'::jsonb,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_conv_user ON conversation_history(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conv_archived ON conversation_history(is_archived) WHERE is_archived = FALSE;
