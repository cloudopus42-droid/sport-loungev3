/**
 * CACHE PURGER — Cache Invalidation Agent Daemon
 * Фоновый процесс для управления кешем после деплоя.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const CONFIG_PATH = path.join(__dirname, 'config.json');
const LOG_PATH = path.join(__dirname, 'log.md');
const STATUS_PATH = path.join(ROOT, 'agents', 'status.json');
const CLIENT_DIST = path.join(ROOT, 'client', 'dist');

let config = loadConfig();
let cycleCount = 0;
let stats = { totalPurges: 0, swPurges: 0, cdnPurges: 0, errors: 0 };

function loadConfig() {
  try { return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8')); }
  catch { return { enabled: true, scanIntervalMs: 60000, purgePaths: ['/assets/'], swCachePatterns: ['index.html', 'version.json'] }; }
}

function timestamp() { return new Date().toISOString().replace('T', ' ').slice(0, 16); }

function writeLog(entries) {
  const header = `## ${timestamp()} — Цикл #${cycleCount}\n\n`;
  const content = header + entries.map(e => `- ${e.status} ${e.action}: ${e.message}`).join('\n') + '\n\n';
  fs.appendFileSync(LOG_PATH, content);
}

function updateStatus(state) {
  try {
    const s = JSON.parse(fs.readFileSync(STATUS_PATH, 'utf-8'));
    s['cache-purger'] = {
      status: state || 'idle', cycle: cycleCount,
      totalPurges: stats.totalPurges, swPurges: stats.swPurges, cdnPurges: stats.cdnPurges,
      errors: stats.errors, lastScan: timestamp(), color: '#FF9800'
    };
    fs.writeFileSync(STATUS_PATH, JSON.stringify(s, null, 2));
  } catch {}
}

function getCurrentBuildVersion() {
  try {
    const vp = path.join(CLIENT_DIST, 'version.json');
    if (fs.existsSync(vp)) {
      return JSON.parse(fs.readFileSync(vp, 'utf-8')).version || '';
    }
  } catch {}
  return '';
}

function purgeServiceWorkerCache() {
  try {
    const swPath = path.join(CLIENT_DIST, 'sw.js');
    if (fs.existsSync(swPath)) {
      const content = fs.readFileSync(swPath, 'utf-8');
      const newContent = content.replace(/CACHE_VERSION\s*=\s*['"][^'"]*['"]/, `CACHE_VERSION = '${Date.now()}'`);
      fs.writeFileSync(swPath, newContent, 'utf-8');
      stats.swPurges++;
      stats.totalPurges++;
      return { success: true, message: 'SW cache version bumped' };
    }
    return { success: false, message: 'SW not found' };
  } catch (err) {
    stats.errors++;
    return { success: false, message: err.message };
  }
}

function runScanCycle() {
  if (!config.enabled) { updateStatus('disabled'); return; }
  cycleCount++;
  updateStatus('working');
  const logEntries = [];

  const currentVersion = getCurrentBuildVersion();

  // Check version.json exists
  const vp = path.join(CLIENT_DIST, 'version.json');
  if (!fs.existsSync(vp)) {
    logEntries.push({ status: 'warn', action: 'version-check', message: 'version.json не найден' });
  } else {
    logEntries.push({ status: 'info', action: 'version', message: currentVersion || 'не указана' });
  }

  // Purge SW if auto mode
  if (config.autoPurgeOnBuild) {
    const result = purgeServiceWorkerCache();
    logEntries.push({ status: result.success ? 'purged' : 'error', action: 'sw-purge', message: result.message });
  }

  // Update version marker
  try {
    const status = JSON.parse(fs.readFileSync(STATUS_PATH, 'utf-8'));
    if (!status['cache-purger']) status['cache-purger'] = {};
    status['cache-purger'].currentVersion = currentVersion;
    fs.writeFileSync(STATUS_PATH, JSON.stringify(status, null, 2));
  } catch {}

  writeLog(logEntries);
  updateStatus('idle');
  console.log(`[CachePurger] Cycle #${cycleCount}: ${stats.totalPurges} purges, ${stats.errors} errors`);
}

console.log('[CachePurger] Daemon starting...');
updateStatus('idle');
runScanCycle();
const interval = setInterval(runScanCycle, config.scanIntervalMs);

process.on('SIGTERM', () => { clearInterval(interval); updateStatus('offline'); process.exit(0); });
fs.watchFile(CONFIG_PATH, () => { config = loadConfig(); });
