const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const hosts = [
  'haemdfhteicygsidftqp.supabase.co',
  'db.haemdfhteicygsidftqp.supabase.co',
  'aws-0-eu-west-2.pooler.supabase.com',
  'aws-0-eu-west-2.db.supabase.com',
  'haemdfhteicygsidftqp.supabase.net',
  'db.haemdfhteicygsidftqp.supabase.net',
  'haemdfhteicygsidftqp.db.supabase.co',
  'db.haemdfhteicygsidftqp.supabase.co'
];

async function resolve(host) {
  return new Promise((res) => {
    dns.resolve4(host, (err, addresses) => {
      if (err) {
        console.log(`❌ ${host}: FAILED -> ${err.message}`);
        res(null);
      } else {
        console.log(`✅ ${host}: SUCCESS -> ${addresses.join(', ')}`);
        res(addresses);
      }
    });
  });
}

async function run() {
  for (const host of hosts) {
    await resolve(host);
  }
}

run();
