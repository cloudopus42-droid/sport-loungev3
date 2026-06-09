const http = require('http');

const endpoints = [
  '/api/health',
  '/api/posts',
  '/api/stories',
  '/api/mixes',
  '/api/promos',
  '/api/invitations',
];

async function testEndpoint(path) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:5000${path}`, { timeout: 5000 }, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        console.log(`${path} -> ${res.statusCode} (${body.length} bytes)`);
        if (body.length < 500) console.log(`  Response: ${body.substring(0, 200)}`);
        resolve();
      });
    });
    req.on('error', (err) => {
      console.log(`${path} -> ERROR: ${err.message}`);
      resolve();
    });
    req.on('timeout', () => {
      console.log(`${path} -> TIMEOUT`);
      req.destroy();
      resolve();
    });
  });
}

(async () => {
  console.log('=== Testing all API endpoints ===\n');
  for (const ep of endpoints) {
    await testEndpoint(ep);
  }
  console.log('\n=== Testing Vite proxy (client -> server) ===\n');
  for (const ep of endpoints) {
    await new Promise((resolve) => {
      const req = http.get(`http://localhost:3000${ep}`, { timeout: 5000 }, (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          console.log(`PROXY ${ep} -> ${res.statusCode} (${body.length} bytes)`);
          if (body.length < 500) console.log(`  Response: ${body.substring(0, 200)}`);
          resolve();
        });
      });
      req.on('error', (err) => {
        console.log(`PROXY ${ep} -> ERROR: ${err.message}`);
        resolve();
      });
      req.on('timeout', () => {
        console.log(`PROXY ${ep} -> TIMEOUT`);
        req.destroy();
        resolve();
      });
    });
  }
})();
