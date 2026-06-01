const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

dns.resolve6('db.haemdfhteicygsidftqp.supabase.co', (err, addresses) => {
  if (err) {
    console.log(`❌ db.haemdfhteicygsidftqp.supabase.co: IPv6 FAILED -> ${err.message}`);
  } else {
    console.log(`✅ db.haemdfhteicygsidftqp.supabase.co: IPv6 SUCCESS -> ${addresses.join(', ')}`);
  }
});
