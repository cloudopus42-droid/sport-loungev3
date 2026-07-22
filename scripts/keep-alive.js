#!/usr/bin/env node

/**
 * Keep-alive ping script for Sport Lounge
 * Run from any external cron service (UptimeRobot, cron-job.org, etc.)
 * 
 * Usage: node keep-alive.js [url]
 * Default URL: https://sport-loungev3.onrender.com/api/health
 */

const https = require('https');
const http = require('http');

const TARGET_URL = process.argv[2] || 'https://sport-loungev3.onrender.com/api/health';
const TIMEOUT_MS = 60000; // 60 seconds for cold start
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 10000;

function ping(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const start = Date.now();
    
    const req = client.get(url, { timeout: TIMEOUT_MS }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const elapsed = Date.now() - start;
        resolve({ status: res.statusCode, data, elapsed });
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.on('error', reject);
  });
}

async function main() {
  console.log(`[${new Date().toISOString()}] Pinging ${TARGET_URL}`);
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await ping(TARGET_URL);
      console.log(`✅ Attempt ${attempt}: HTTP ${result.status} (${result.elapsed}ms)`);
      
      if (result.status === 200) {
        const health = JSON.parse(result.data);
        console.log(`   Server uptime: ${Math.round(health.uptime)}s`);
        process.exit(0);
      }
    } catch (err) {
      console.log(`⚠️  Attempt ${attempt}: ${err.message}`);
    }
    
    if (attempt < MAX_RETRIES) {
      console.log(`   Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
    }
  }
  
  console.log('❌ All attempts failed');
  process.exit(1);
}

main();
