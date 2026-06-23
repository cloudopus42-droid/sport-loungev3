/**
 * HEALTH CHECKER — Service Monitoring Agent Daemon
 * Фоновый процесс для мониторинга эндпоинтов и версий.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const CONFIG_PATH = path.join(__dirname, 'config.json');
const LOG_PATH = path.join(__dirname, 'log.md');
const STATUS_PATH = path.join(ROOT, 'agents', 'status.json');

let config = loadConfig();
let cycleCount = 0;
let stats = { totalChecks: 0, passed: 0, failed: 0, alertsSent: 0 };

function loadConfig() {
  try { return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8')); }
  catch { return { enabled: true, scanIntervalMs: 60000, endpoints: [], alertOnFailure: true, timeoutMs: 10000 }; }
}

function timestamp() { return new Date().toISOString().replace('T', ' ').slice(0, 16); }

function writeLog(entries) {
  const header = `## ${timestamp()} — Цикл #${cycleCount}\n\n`;
  const content = header + entries.map(e => `- ${e.status} ${e.endpoint}: ${e.message} (${e.duration}ms)`).join('\n') + '\n\n';
  fs.appendFileSync(LOG_PATH, content);
}

function updateStatus(state) {
  try {
    const s = JSON.parse(fs.readFileSync(STATUS_PATH, 'utf-8'));
    s['health-checker'] = {
      status: state || 'idle', cycle: cycleCount,
      totalChecks: stats.totalChecks, passed: stats.passed, failed: stats.failed,
      alertsSent: stats.alertsSent, lastScan: timestamp(), color: '#E040FB'
    };
    fs.writeFileSync(STATUS_PATH, JSON.stringify(s, null, 2));
  } catch {}
}

async function checkEndpoint(url) {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs || 10000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    const duration = Date.now() - start;
    stats.totalChecks++;
    if (res.ok) {
      stats.passed++;
      return { endpoint: url, status: 'ok', message: `${res.status} ${res.statusText}`, duration };
    } else {
      stats.failed++;
      return { endpoint: url, status: 'error', message: `${res.status} ${res.statusText}`, duration };
    }
  } catch (err) {
    stats.totalChecks++;
    stats.failed++;
    return { endpoint: url, status: 'error', message: err.message, duration: Date.now() - start };
  }
}

async function runScanCycle() {
  if (!config.enabled) { updateStatus('disabled'); return; }
  cycleCount++;
  updateStatus('working');
  const logEntries = [];

  const endpoints = config.endpoints || [];
  for (const url of endpoints) {
    const result = await checkEndpoint(url);
    logEntries.push(result);
  }

  // Check all agents in status.json
  try {
    const s = JSON.parse(fs.readFileSync(STATUS_PATH, 'utf-8'));
    for (const [agentId, agentStatus] of Object.entries(s)) {
      if (agentId === 'bughunter' && agentStatus.status === 'offline') {
        logEntries.push({ endpoint: `agent:${agentId}`, status: 'warn', message: 'Агент офлайн', duration: 0 });
      }
    }
  } catch {}

  writeLog(logEntries);
  updateStatus('idle');
  console.log(`[HealthChecker] Cycle #${cycleCount}: ${stats.passed}/${stats.totalChecks} passed, ${stats.failed} failed`);
}

console.log('[HealthChecker] Daemon starting...');
updateStatus('idle');
runScanCycle();
const interval = setInterval(runScanCycle, config.scanIntervalMs);

process.on('SIGTERM', () => { clearInterval(interval); updateStatus('offline'); process.exit(0); });
fs.watchFile(CONFIG_PATH, () => { config = loadConfig(); });
