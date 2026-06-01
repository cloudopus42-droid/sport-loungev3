const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const { Client } = require('pg');

async function test(port) {
  console.log(`Testing port ${port}...`);
  const client = new Client({
    host: 'aws-0-eu-west-2.pooler.supabase.com',
    port: port,
    database: 'postgres',
    user: 'postgres.haemdfhteicygsidftqp',
    password: 'sb_secret_V9gEDtPTvq8XlJuefmVPAg_PoO4pWp_',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000
  });

  try {
    await client.connect();
    console.log(`🎉🎉🎉 SUCCESS on port ${port}!`);
    const res = await client.query('SELECT NOW()');
    console.log('Time:', res.rows[0].now);
    await client.end();
    return true;
  } catch (err) {
    console.log(`  ❌ Port ${port} failed: ${err.message}`);
    return false;
  }
}

async function run() {
  await test(5432);
  await test(6543);
}

run();
