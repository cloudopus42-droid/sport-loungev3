const net = require('net');
const dns = require('dns');

const host = 'ac-fu4f5lj-shard-00-00.s5aznbg.mongodb.net';
const port = 27017;

// First resolve DNS
dns.resolve4(host, (err, addresses) => {
  if (err) {
    console.log(`DNS resolve FAILED for ${host}: ${err.message}`);
  } else {
    console.log(`DNS resolved ${host} -> ${addresses.join(', ')}`);
  }
});

// Test TCP connection
console.log(`Testing TCP connection to ${host}:${port}...`);
const socket = new net.Socket();
socket.setTimeout(10000);

socket.connect(port, host, () => {
  console.log(`SUCCESS: TCP connection to ${host}:${port} established!`);
  socket.destroy();
});

socket.on('timeout', () => {
  console.log(`TIMEOUT: Cannot reach ${host}:${port} within 10s - port likely BLOCKED by firewall`);
  socket.destroy();
});

socket.on('error', (err) => {
  console.log(`ERROR: ${err.message}`);
  socket.destroy();
});
