CREATE TABLE IF NOT EXISTS knowledge_base (
  id VARCHAR(100) PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  source_url VARCHAR(500),
  source_type VARCHAR(50) DEFAULT 'manual',
  created_by VARCHAR(100),
  file_name VARCHAR(255),
  file_size INT,
  mime_type VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_kb_category ON knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_kb_tags ON knowledge_base USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_kb_created_at ON knowledge_base(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kb_search ON knowledge_base USING GIN(to_tsvector('english', title || ' ' || content));
