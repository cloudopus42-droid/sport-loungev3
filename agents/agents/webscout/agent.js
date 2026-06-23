/**
 * WEBSCOUT — Web Scraping Agent Daemon
 * Фоновый процесс для парсинга веб-страниц с кешированием и rate limiting.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const CONFIG_PATH = path.join(__dirname, 'config.json');
const LOG_PATH = path.join(__dirname, 'log.md');
const CACHE_DIR = path.join(__dirname, 'cache');
const STATUS_PATH = path.join(ROOT, 'agents', 'status.json');

let config = loadConfig();
let cycleCount = 0;
let stats = { totalScrapes: 0, cacheHits: 0, cacheMisses: 0, errors: 0 };

if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

function loadConfig() {
  try { return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8')); }
  catch { return { enabled: true, scanIntervalMs: 300000, rateLimitPerMin: 20, cacheTtlMs: 3600000, maxCacheSize: 500, stealthMode: true, userAgentRotate: true, maxConcurrency: 3, requestTimeoutMs: 15000 }; }
}

function timestamp() { return new Date().toISOString().replace('T', ' ').slice(0, 16); }

function writeLog(entries) {
  const header = `## ${timestamp()} — Цикл #${cycleCount}\n\n`;
  const content = header + entries.map(e => `- ${e.status} ${e.url}: ${e.message}`).join('\n') + '\n\n';
  fs.appendFileSync(LOG_PATH, content);
}

function updateStatus(state) {
  try {
    const status = JSON.parse(fs.readFileSync(STATUS_PATH, 'utf-8'));
    status.webscout = {
      status: state || 'idle', cycle: cycleCount,
      totalScrapes: stats.totalScrapes, cacheHits: stats.cacheHits,
      cacheMisses: stats.cacheMisses, errors: stats.errors,
      lastScan: timestamp(), color: '#00BFA5'
    };
    fs.writeFileSync(STATUS_PATH, JSON.stringify(status, null, 2));
  } catch {}
}

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
];

function getRandomUA() { return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]; }

function getCacheKey(url) {
  return Buffer.from(url).toString('base64').replace(/[/+=]/g, '_').slice(0, 64);
}

function getFromCache(url) {
  const key = getCacheKey(url);
  const cachePath = path.join(CACHE_DIR, key + '.json');
  try {
    if (fs.existsSync(cachePath)) {
      const cached = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
      if (Date.now() - cached.timestamp < config.cacheTtlMs) {
        stats.cacheHits++;
        return cached.data;
      }
      fs.unlinkSync(cachePath);
    }
  } catch {}
  stats.cacheMisses++;
  return null;
}

function setCache(url, data) {
  const key = getCacheKey(url);
  const cachePath = path.join(CACHE_DIR, key + '.json');
  try {
    fs.writeFileSync(cachePath, JSON.stringify({ url, data, timestamp: Date.now() }), 'utf-8');
    // Clean old caches if over limit
    const files = fs.readdirSync(CACHE_DIR).filter(f => f.endsWith('.json'));
    if (files.length > config.maxCacheSize) {
      const sorted = files.map(f => ({ name: f, time: fs.statSync(path.join(CACHE_DIR, f)).mtimeMs }))
        .sort((a, b) => a.time - b.time);
      const toDelete = sorted.slice(0, sorted.length - config.maxCacheSize);
      for (const f of toDelete) { try { fs.unlinkSync(path.join(CACHE_DIR, f.name)); } catch {} }
    }
  } catch {}
}

function parseRobotsDisallow(html) {
  const lines = html.split('\n');
  const disallowed = [];
  let userAgent = '*';
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('User-agent:')) userAgent = trimmed.split(':')[1].trim();
    if (trimmed.startsWith('Disallow:') && userAgent === '*') {
      disallowed.push(trimmed.split(':')[1].trim() || '/');
    }
  }
  return disallowed;
}

async function scrapeUrl(url) {
  const cached = getFromCache(url);
  if (cached) return { source: 'cache', data: cached };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.requestTimeoutMs);

    const headers = { 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' };
    if (config.userAgentRotate) headers['User-Agent'] = getRandomUA();
    headers['Accept-Language'] = 'en-US,en;q=0.9,ru;q=0.8';
    headers['Cache-Control'] = 'no-cache';

    const res = await fetch(url, { headers, signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

    const html = await res.text();
    const title = html.match(/<title>([^<]*)<\/title>/i)?.[1] || '';
    const description = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i)?.[1] || '';
    const links = [...html.matchAll(/<a\s+[^>]*href="([^"]*)"/gi)].map(m => m[1]).filter(l => l && !l.startsWith('#') && !l.startsWith('javascript:'));
    const images = [...html.matchAll(/<img[^>]+src="([^"]*)"/gi)].map(m => m[1]).filter(Boolean);
    const textContent = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

    const data = { url, title, description, textContent: textContent.slice(0, 5000), links: links.slice(0, 100), images: images.slice(0, 50), scrapedAt: timestamp() };

    setCache(url, data);
    stats.totalScrapes++;
    return { source: 'live', data };
  } catch (err) {
    stats.errors++;
    return { source: 'error', error: err.message };
  }
}

async function runScanCycle() {
  if (!config.enabled) { updateStatus('disabled'); return; }
  cycleCount++;
  updateStatus('working');
  const logEntries = [];

  // Read queue from config
  const urls = config.urls || [];
  if (urls.length === 0) {
    logEntries.push({ status: 'info', url: '—', message: 'Нет URL для сканирования' });
  } else {
    const batch = urls.slice(0, config.maxConcurrency);
    const results = await Promise.all(batch.map(url => scrapeUrl(url)));
    for (const r of results) {
      if (r.source === 'error') logEntries.push({ status: 'error', url: r.data?.url || '?', message: r.error });
      else logEntries.push({ status: r.source === 'cache' ? 'cached' : 'scraped', url: r.data.url, message: `${r.data.title || 'нет заголовка'} (${r.data.links.length} ссылок)` });
    }
  }

  writeLog(logEntries);
  updateStatus('idle');
  console.log(`[WebScout] Cycle #${cycleCount}: ${stats.totalScrapes} scrapes, ${stats.cacheHits} cache hits, ${stats.errors} errors`);
}

console.log(`[WebScout] Daemon starting. Interval: ${config.scanIntervalMs}ms`);
updateStatus('idle');
runScanCycle();
const interval = setInterval(runScanCycle, config.scanIntervalMs);

process.on('SIGUSR2', () => { console.log('[WebScout] Manual scan'); runScanCycle(); });
process.on('SIGHUP', () => { config = loadConfig(); });
process.on('SIGTERM', () => { clearInterval(interval); updateStatus('offline'); process.exit(0); });
fs.watchFile(CONFIG_PATH, () => { config = loadConfig(); });
