-- Add stock management fields to mixes
ALTER TABLE mixes ADD COLUMN IF NOT EXISTS min_stock_threshold INTEGER DEFAULT 5;
ALTER TABLE mixes ADD COLUMN IF NOT EXISTS auto_reorder_enabled BOOLEAN DEFAULT false;

-- Create restock requests table
CREATE TABLE IF NOT EXISTS restock_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tobacco_id UUID REFERENCES mixes(id) ON DELETE CASCADE,
  tobacco_name VARCHAR(255),
  quantity INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed', 'rejected')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_restock_requests_status ON restock_requests (status);
CREATE INDEX IF NOT EXISTS idx_restock_requests_tobacco ON restock_requests (tobacco_id);
