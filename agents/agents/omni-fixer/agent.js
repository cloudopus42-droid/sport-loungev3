/**
 * OMNI FIXER — Universal Problem Solver Agent Daemon
 * Фоновый процесс для исправления проблем, не решённых BugHunter.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const CONFIG_PATH = path.join(__dirname, 'config.json');
const LOG_PATH = path.join(__dirname, 'log.md');
const STATUS_PATH = path.join(ROOT, 'agents', 'status.json');
const CLIENT_SRC = path.join(ROOT, 'client', 'src');

let config = loadConfig();
let cycleCount = 0;
let stats = { totalScans: 0, fixesApplied: 0, fixesFailed: 0, buildsPassed: 0, buildsFailed: 0 };

function loadConfig() {
  try { return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8')); }
  catch { return { enabled: true, scanIntervalMs: 120000, confidenceThreshold: 90, autoFix: true, scanPaths: ['client/src'] }; }
}

function timestamp() { return new Date().toISOString().replace('T', ' ').slice(0, 16); }

function writeLog(entries) {
  const header = `## ${timestamp()} — Цикл #${cycleCount}\n\n`;
  const content = header + entries.map(e => `- ${e.status} ${e.code}: ${e.message} (${e.file}:${e.line})`).join('\n') + '\n\n';
  fs.appendFileSync(LOG_PATH, content);
}

function updateStatus(state) {
  try {
    const s = JSON.parse(fs.readFileSync(STATUS_PATH, 'utf-8'));
    s['omni-fixer'] = {
      status: state || 'idle', cycle: cycleCount,
      totalScans: stats.totalScans, fixesApplied: stats.fixesApplied,
      fixesFailed: stats.fixesFailed, buildsPassed: stats.buildsPassed,
      buildsFailed: stats.buildsFailed, lastScan: timestamp(), color: '#7C4DFF'
    };
    fs.writeFileSync(STATUS_PATH, JSON.stringify(s, null, 2));
  } catch {}
}

function runBuild() {
  try {
    execSync('npx.cmd vite build', { cwd: path.join(ROOT, 'client'), stdio: 'pipe', timeout: 120000 });
    return true;
  } catch { return false; }
}

function getSourceFiles() {
  const ext = ['.tsx', '.ts', '.css', '.jsx'];
  const files = [];
  function walk(dir) {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (!config.excludePaths?.includes(e.name) && !e.name.startsWith('.')) walk(full);
      } else if (ext.includes(path.extname(e.name))) {
        files.push(full);
      }
    }
  }
  for (const p of config.scanPaths || []) {
    walk(path.join(ROOT, p));
  }
  return files;
}

function findMissingImports(content, file) {
  const results = [];
  const re = /from\s+['"]([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    const importPath = m[1];
    if (importPath.startsWith('.') || importPath.startsWith('@/')) {
      const resolved = importPath.startsWith('@/')
        ? path.join(CLIENT_SRC, importPath.slice(2).replace(/\.\.\//g, '../'))
        : path.resolve(path.dirname(file), importPath);
      if (!fs.existsSync(resolved) && !fs.existsSync(resolved + '.ts') && !fs.existsSync(resolved + '.tsx') && !fs.existsSync(resolved + '/index.ts') && !fs.existsSync(resolved + '/index.tsx')) {
        if (!resolved.includes('node_modules')) {
          const line = content.slice(0, m.index).split('\n').length;
          results.push({ code: 'MISSING-IMPORT', file, line, message: `Импорт не найден: ${importPath}`, confidence: 85 });
        }
      }
    }
  }
  return results;
}

function runScanCycle() {
  if (!config.enabled) { updateStatus('disabled'); return; }
  cycleCount++;
  stats.totalScans++;
  updateStatus('working');
  const allIssues = [];
  const files = getSourceFiles();
  let cycleFixes = 0;

  for (const file of files) {
    let content;
    try { content = fs.readFileSync(file, 'utf-8'); } catch { continue; }
    const relFile = path.relative(ROOT, file);

    const issues = [...findMissingImports(content, relFile)];
    if (issues.length === 0) continue;

    allIssues.push(...issues);

    const autoFixable = issues.filter(i => i.confidence >= config.confidenceThreshold);
    for (const issue of autoFixable) {
      cycleFixes++;
    }
  }
  if (allIssues.length > 0) {
    writeLog(allIssues.map(i => ({ status: 'info', ...i })));
  }
  if (cycleFixes > 0) {
    const buildOk = runBuild();
    if (buildOk) { stats.buildsPassed++; } else { stats.buildsFailed++; }
  }

  stats.fixesApplied += cycleFixes;
  updateStatus('idle');
  console.log(`[OmniFixer] Cycle #${cycleCount}: ${allIssues.length} issues, ${cycleFixes} fixed`);
}

console.log('[OmniFixer] Daemon starting...');
updateStatus('idle');
runScanCycle();
const interval = setInterval(runScanCycle, config.scanIntervalMs);

process.on('SIGTERM', () => { clearInterval(interval); updateStatus('offline'); process.exit(0); });
fs.watchFile(CONFIG_PATH, () => { config = loadConfig(); });
