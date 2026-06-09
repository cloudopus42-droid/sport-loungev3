const { createClient } = require('@supabase/supabase-js');

try {
  console.log('Initializing Supabase client inside server...');
  const supabaseUrl = 'https://haemdfhteicygsidftqp.supabase.co';
  const supabaseKey = 'sb_publishable_hdjCkqf7FcWJekjombPjWg_OzILJPDE';
  const client = createClient(supabaseUrl, supabaseKey);
  console.log('Supabase client initialized successfully!', !!client);
} catch (err) {
  console.error('Supabase initialization failed:', err);
}
