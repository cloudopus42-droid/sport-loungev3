const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const { Client } = require('pg');

const regions = [
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-central-1',
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'ap-southeast-1',
  'ap-northeast-1',
  'sa-east-1'
];

async function testRegion(region) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  console.log(`📡 Scanning region ${region} (${host})...`);
  
  const client = new Client({
    host: host,
    port: 6543,
    database: 'postgres',
    user: 'postgres.haemdfhteicygsidftqp',
    password: 'sb_secret_V9gEDtPTvq8XlJuefmVPAg_PoO4pWp_',
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 5000 // 5 seconds timeout
  });

  try {
    await client.connect();
    console.log(`🎉 SUCCESS! Connected to region: ${region}`);
    const res = await client.query('SELECT NOW()');
    console.log(`Database time in ${region}:`, res.rows[0].now);
    await client.end();
    return true;
  } catch (err) {
    if (err.message.includes('Tenant or user not found')) {
      console.log(`  ❌ Region ${region}: Tenant not found.`);
    } else {
      console.log(`  ❌ Region ${region}: Other error -> ${err.message}`);
    }
    return false;
  }
}

async function run() {
  for (const region of regions) {
    const success = await testRegion(region);
    if (success) {
      console.log(`\n💎 Project region is: ${region}`);
      break;
    }
  }
}

run();
