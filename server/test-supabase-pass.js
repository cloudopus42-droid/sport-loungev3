const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const { Client } = require('pg');

async function test(password) {
  console.log(`Testing with password: "${password}"...`);
  const client = new Client({
    host: 'aws-0-eu-west-2.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres.haemdfhteicygsidftqp',
    password: password,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000
  });

  try {
    await client.connect();
    console.log(`🎉🎉🎉 SUCCESS! Connected with password: "${password}"`);
    await client.end();
    return true;
  } catch (err) {
    console.log(`  ❌ Failed: ${err.message}`);
    return false;
  }
}

async function run() {
  const passwords = [
    'YaSmogu100',
    'sb_secret_V9gEDtPTvq8XlJuefmVPAg_PoO4pWp_',
    'admin123',
    'postgres',
  ];
  for (const pass of passwords) {
    const success = await test(pass);
    if (success) break;
  }
}

run();
