const { Client } = require('pg');

const client = new Client({
  host: 'db.haemdfhteicygsidftqp.supabase.co',
  port: 6543,
  database: 'postgres',
  user: 'postgres',
  password: 'sb_secret_V9gEDtPTvq8XlJuefmVPAg_PoO4pWp_',
  ssl: {
    rejectUnauthorized: false
  }
});

async function run() {
  try {
    console.log('Connecting to db.haemdfhteicygsidftqp.supabase.co on port 6543...');
    await client.connect();
    console.log('✅ SUCCESS! Connected on port 6543.');
    const res = await client.query('SELECT NOW()');
    console.log('Time:', res.rows[0].now);
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
  } finally {
    await client.end();
  }
}

run();
