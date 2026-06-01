const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const { Client } = require('pg');

const regions = [
  'eu-west-1', // Ireland
  'eu-west-2', // London
  'eu-west-3', // Paris
  'eu-central-1', // Frankfurt
  'us-east-1', // N. Virginia
  'us-east-2', // Ohio
  'us-west-1', // N. California
  'us-west-2', // Oregon
  'ap-southeast-1', // Singapore
  'ap-southeast-2', // Sydney
  'ap-northeast-1', // Tokyo
  'ap-northeast-2', // Seoul
  'ap-south-1', // Mumbai
  'sa-east-1', // Sao Paulo
  'ca-central-1', // Canada
];

async function testRegion(region) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  console.log(`Testing region ${region} (${host})...`);
  const client = new Client({
    host: host,
    port: 6543,
    database: 'postgres',
    user: 'postgres.haemdfhteicygsidftqp',
    password: 'sb_secret_V9gEDtPTvq8XlJuefmVPAg_PoO4pWp_',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 3000
  });

  try {
    await client.connect();
    console.log(`🎉🎉🎉 SUCCESS! Found region: ${region}`);
    await client.end();
    return true;
  } catch (err) {
    console.log(`  ❌ Failed: ${err.message}`);
    return false;
  }
}

async function run() {
  for (const region of regions) {
    const success = await testRegion(region);
    if (success) {
      process.exit(0);
    }
  }
  console.error('❌ None of the regions succeeded.');
}

run();
