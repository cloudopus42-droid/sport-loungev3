const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const RENDER_API_KEY = 'rnd_4McKygAispJ4jh0mUVSrc4k40lGv';
const BASE = 'https://api.render.com/v1';

const ENV_VARS = [
  { key: 'NODE_ENV', value: 'production' },
  { key: 'PORT', value: '5000' },
  { key: 'JWT_SECRET', value: 'YaSmogu100_JWT_Secret_Key_Lounge' },
  { key: 'TELEGRAM_TOKEN', value: '8569759144:AAEpmyJthuhgJ2qCAFt_jz63TN1lwlnYHIs' },
  { key: 'TELEGRAM_CHAT_ID', value: '5652912760' },
  { key: 'TELEGRAM_API_BASE_URL', value: 'https://api.telegram.org' },
  { key: 'SUPABASE_URL', value: 'https://haemdfhteicygsidftqp.supabase.co' },
  { key: 'SUPABASE_KEY', value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZW1kZmh0ZWljeWdzaWRmdHFwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDE3NDMxNSwiZXhwIjoyMDk1NzUwMzE1fQ.324lSMx1tWN-SeCJdFFs-dQCroBwhLqT75EvKH2O2vk' },
  { key: 'SUPABASE_ANON_KEY', value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZW1kZmh0ZWljeWdzaWRmdHFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNzQzMTUsImV4cCI6MjA5NTc1MDMxNX0.-SG7eaWU6nO3GBEWc9UBWug7GcqfnDeMAxkYq5k86Rs' },
  { key: 'ALLOWED_ORIGINS', value: 'http://localhost:3000,http://localhost:5173,https://cloudopus42-droid.github.io' }
];

async function renderApi(method, endpoint, body = null) {
  const url = `${BASE}${endpoint}`;
  const opts = {
    method,
    headers: {
      'Authorization': `Bearer ${RENDER_API_KEY}`,
      'Accept': 'application/json',
    },
    signal: AbortSignal.timeout(15000),
  };
  if (body) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(url, opts);
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status}: ${text}`);
  return text ? JSON.parse(text) : {};
}

async function main() {
  try {
    console.log('[1/3] Fetching services...');
    const services = await renderApi('GET', '/services?limit=50');
    const svc = services.find(s => s.service.name === 'sport-loungev3');
    if (!svc) { console.error('❌ Service not found'); return; }
    const id = svc.service.id;
    console.log(`✅ Found service: ${id}`);

    console.log('[2/3] Updating env vars...');
    await renderApi('PUT', `/services/${id}/env-vars`, ENV_VARS);
    console.log('✅ Env vars updated');

    console.log('[3/3] Triggering deploy...');
    const deploy = await renderApi('POST', `/services/${id}/deploys`, {});
    console.log('✅ Deploy triggered:', deploy.id || 'ok');
  } catch (err) {
    console.error('❌ Error:', err.message);
    // Try with IPv4 forced
    console.log('Retrying with net.setDefaultAutoSelectFamily(false)...');
    try {
      const net = require('net');
      net.setDefaultAutoSelectFamily(false);
      
      console.log('[1/3] Fetching services (retry)...');
      const services = await renderApi('GET', '/services?limit=50');
      const svc = services.find(s => s.service.name === 'sport-loungev3');
      if (!svc) { console.error('❌ Service not found'); return; }
      const id = svc.service.id;
      console.log(`✅ Found service: ${id}`);

      console.log('[2/3] Updating env vars (retry)...');
      await renderApi('PUT', `/services/${id}/env-vars`, ENV_VARS);
      console.log('✅ Env vars updated');

      console.log('[3/3] Triggering deploy (retry)...');
      const deploy = await renderApi('POST', `/services/${id}/deploys`, {});
      console.log('✅ Deploy triggered:', deploy.id || 'ok');
    } catch (err2) {
      console.error('❌ Retry failed:', err2.message);
    }
  }
}

main();
