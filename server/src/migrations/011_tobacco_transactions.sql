-- 011_tobacco_transactions.sql
-- Create the tobacco_transactions table for purchase/write-off/adjustment history

CREATE TABLE IF NOT EXISTS tobacco_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mix_id UUID NOT NULL REFERENCES mixes(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('purchase', 'write-off', 'adjustment')),
  quantity INTEGER NOT NULL DEFAULT 0,
  unit VARCHAR(20) NOT NULL DEFAULT 'gram',
  price DECIMAL(10,2) DEFAULT 0,
  notes TEXT DEFAULT '',
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tobacco_transactions_mix_id ON tobacco_transactions(mix_id);
CREATE INDEX IF NOT EXISTS idx_tobacco_transactions_type ON tobacco_transactions(type);
CREATE INDEX IF NOT EXISTS idx_tobacco_transactions_created_at ON tobacco_transactions(created_at DESC);
