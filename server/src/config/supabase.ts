import { createClient } from '@supabase/supabase-js';
import { config } from './env';

// Use service_role key to bypass RLS — server is trusted backend
export const supabase = createClient(config.supabaseUrl, config.supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
