CREATE TABLE IF NOT EXISTS floor_maps (
  id TEXT PRIMARY KEY DEFAULT 'default',
  tables JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Only one active map at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_floor_maps_active ON floor_maps(is_active) WHERE is_active = true;
