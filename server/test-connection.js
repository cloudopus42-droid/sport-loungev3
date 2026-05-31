const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL || 'https://haemdfhteicygsidftqp.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'sb_secret_V9gEDtPTvq8XlJuefmVPAg_PoO4pWp_';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    console.log('🔗 Testing connection to Supabase...');
    console.log('URL:', supabaseUrl);

    // 1. Пингуем пользователей
    const { data: users, error: usersError, count: userCount } = await supabase
      .from('users')
      .select('id, email, name, role', { count: 'exact' });

    if (usersError) {
      throw new Error(`Users table error: ${usersError.message}`);
    }

    console.log('\n✅ SUCCESS! Connected to Supabase PostgreSQL!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`👤 Users found: ${users.length} (exact count: ${userCount})`);
    if (users.length > 0) {
      users.forEach(u => console.log(`  - [${u.role.toUpperCase()}] ${u.name} (${u.email})`));
    }

    // 2. Проверяем другие таблицы
    const tables = ['bookings', 'posts', 'mixes', 'promos', 'showcases', 'invitations', 'stories', 'seat_configs'];
    console.log('\n📊 Checking other tables:');
    
    for (const table of tables) {
      const { data, error, count } = await supabase
        .from(table)
        .select('id', { count: 'exact', head: true });
      
      if (error) {
        console.error(`  ❌ Table "${table}": Error -> ${error.message}`);
      } else {
        console.log(`  ✅ Table "${table}": Responsive (${count} rows)`);
      }
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (err) {
    console.error('❌ Supabase connection failed:', err.message);
  }
}

run();
