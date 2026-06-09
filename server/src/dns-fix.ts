// Fix Node.js c-ares DNS resolver by setting Google Public DNS
// This resolves the ETIMEOUT issue with MongoDB Atlas SRV lookups
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
