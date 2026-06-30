ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS embedding JSONB;
CREATE INDEX IF NOT EXISTS idx_knowledge_base_embedding ON knowledge_base USING GIN (embedding);
