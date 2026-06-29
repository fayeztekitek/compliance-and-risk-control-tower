CREATE TABLE IF NOT EXISTS prompt_library (
  id VARCHAR(100) PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'general',
  domain VARCHAR(50),
  tags TEXT[] DEFAULT '{}',
  created_by VARCHAR(100),
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  usage_count INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_pl_category ON prompt_library(category);
CREATE INDEX IF NOT EXISTS idx_pl_domain ON prompt_library(domain);
CREATE INDEX IF NOT EXISTS idx_pl_favorite ON prompt_library(is_favorite) WHERE is_favorite = TRUE;
CREATE INDEX IF NOT EXISTS idx_pl_tags ON prompt_library USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_pl_created_at ON prompt_library(created_at DESC);
