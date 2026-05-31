const { Client } = require('pg');

async function run() {
  const host = '2a05:d01c:1b7:9300:a3dc:880a:1e56:806'; // Literal IPv6 of db.haemdfhteicygsidftqp.supabase.co
  console.log(`🔗 Connecting to literal IPv6 host: [${host}] on port 6543 (pooler)...`);
  
  const client = new Client({
    host: host,
    port: 6543,
    database: 'postgres',
    user: 'postgres',
    password: 'sb_secret_V9gEDtPTvq8XlJuefmVPAg_PoO4pWp_',
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 5000
  });

  try {
    await client.connect();
    console.log('✅ SUCCESS! Connected via IPv6 address on port 6543.');
    const res = await client.query('SELECT NOW()');
    console.log('Time:', res.rows[0].now);
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
  } finally {
    await client.end();
  }
}

run();
