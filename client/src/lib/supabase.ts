import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://haemdfhteicygsidftqp.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZW1kZmh0ZWljeWdzaWRmdHFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNzQzMTUsImV4cCI6MjA5NTc1MDMxNX0.-SG7eaWU6nO3GBEWc9UBWug7GcqfnDeMAxkYq5k86Rs';

export const supabase = createClient(supabaseUrl, supabaseKey);

