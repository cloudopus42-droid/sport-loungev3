import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://haemdfhteicygsidftqp.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_hdjCkqf7FcWJekjombPjWg_OzILJPDE';

export const supabase = createClient(supabaseUrl, supabaseKey);

