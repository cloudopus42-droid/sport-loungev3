-- 012_restock_requests.sql
-- Create the restock_requests table for tobacco restock workflow

CREATE TABLE IF NOT EXISTS restock_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tobacco_id UUID NOT NULL REFERENCES mixes(id) ON DELETE CASCADE,
  tobacco_name TEXT NOT NULL DEFAULT '',
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed', 'rejected')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_restock_requests_status ON restock_requests(status);
CREATE INDEX IF NOT EXISTS idx_restock_requests_tobacco_id ON restock_requests(tobacco_id);
CREATE INDEX IF NOT EXISTS idx_restock_requests_created_at ON restock_requests(created_at DESC);
