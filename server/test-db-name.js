const { Client } = require('pg');

async function test(user, database) {
  console.log(`Testing User: "${user}", Database: "${database}"...`);
  const client = new Client({
    host: 'aws-0-eu-west-2.pooler.supabase.com',
    port: 6543,
    database: database,
    user: user,
    password: 'sb_secret_V9gEDtPTvq8XlJuefmVPAg_PoO4pWp_',
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 5000
  });

  try {
    await client.connect();
    console.log(`🎉 SUCCESS! Connected with User: "${user}", Database: "${database}"`);
    await client.end();
    return true;
  } catch (err) {
    console.log(`  ❌ Failed: ${err.message}`);
    return false;
  }
}

async function run() {
  const combos = [
    { user: 'postgres', database: 'postgres' },
    { user: 'postgres', database: 'haemdfhteicygsidftqp' },
    { user: 'postgres.haemdfhteicygsidftqp', database: 'postgres' },
    { user: 'postgres.haemdfhteicygsidftqp', database: 'haemdfhteicygsidftqp' },
    { user: 'postgres', database: 'db.haemdfhteicygsidftqp' },
  ];

  for (const combo of combos) {
    const success = await test(combo.user, combo.database);
    if (success) break;
  }
}

run();
