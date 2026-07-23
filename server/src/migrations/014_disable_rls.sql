-- Disable RLS on mixes table (server handles auth via middleware)
-- Supabase enables RLS by default on new tables, blocking all inserts
ALTER TABLE mixes DISABLE ROW LEVEL SECURITY;

-- Also ensure other tables we write to have RLS disabled or proper policies
ALTER TABLE tobacco_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE restock_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_mixes DISABLE ROW LEVEL SECURITY;
