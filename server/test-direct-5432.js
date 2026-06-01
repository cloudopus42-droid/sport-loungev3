const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const { Client } = require('pg');

const client = new Client({
  host: 'db.haemdfhteicygsidftqp.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'sb_secret_V9gEDtPTvq8XlJuefmVPAg_PoO4pWp_',
  ssl: {
    rejectUnauthorized: false
  }
});

async function run() {
  try {
    console.log('Connecting to db.haemdfhteicygsidftqp.supabase.co on port 5432...');
    await client.connect();
    console.log('✅ SUCCESS! Connected directly on port 5432.');
    const res = await client.query('SELECT NOW()');
    console.log('Time:', res.rows[0].now);
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    console.error(err.stack);
  } finally {
    await client.end();
  }
}

run();
