const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
  host: 'aws-0-eu-west-2.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.haemdfhteicygsidftqp',
  password: 'sb_secret_V9gEDtPTvq8XlJuefmVPAg_PoO4pWp_',
  ssl: {
    rejectUnauthorized: false
  }
});

async function run() {
  try {
    console.log('📡 Reading migration SQL file...');
    const sqlPath = path.resolve(__dirname, '../supabase/migrations/v3_luxury_expansion.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('🔗 Connecting to Supabase PostgreSQL...');
    await client.connect();
    console.log('✅ Connected successfully!');
    
    console.log('🚀 Running database migrations (v3.0)...');
    await client.query(sql);
    console.log('🎉 Migrations successfully completed! All tables and seed data created.');
    
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    console.error(err.stack);
  } finally {
    await client.end();
  }
}

run();
