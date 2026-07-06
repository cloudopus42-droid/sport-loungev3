-- Migration 005: User Saved Mixes (user_mixes)
-- Создаёт таблицу для сохранения пользовательских рецептов из ИИ-Миксолога.

CREATE TABLE IF NOT EXISTS user_mixes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  flavors TEXT[] NOT NULL DEFAULT '{}',
  percentages JSONB DEFAULT '{}',
  strength VARCHAR(50) DEFAULT 'medium',
  notes TEXT DEFAULT '',
  source VARCHAR(50) DEFAULT 'ai',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_mixes_user_id ON user_mixes(user_id);
