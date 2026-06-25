/**
 * BUGBOT — BugHunter Agent Daemon
 * Фоновый процесс автономного поиска и исправления багов.
 *
 * Запуск: node agents/agents/bughunter/agent.js
 * Режим демона: агент запускается с сервером и работает постоянно.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const CLIENT_SRC = path.join(ROOT, 'client', 'src');
const SKILL_PATH = path.join(ROOT, 'agents', 'skills', 'bug-hunter-skill', 'SKILL.md');
const CONFIG_PATH = path.join(__dirname, 'config.json');
const LOG_PATH = path.join(__dirname, 'log.md');
const BUS_PATH = path.join(ROOT, 'agents', 'shared', 'message-bus.js');
const STATUS_PATH = path.join(ROOT, 'agents', 'status.json');

let config = loadConfig();
let cycleCount = 0;
let stats = { totalFound: 0, totalFixed: 0, totalEscalated: 0 };

// ====== Utility ======

function loadConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  } catch {
    return { enabled: true, scanIntervalMs: 60000, confidenceThreshold: 95, scanPaths: ['client/src'] };
  }
}

function saveConfig(updates) {
  config = { ...config, ...updates };
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

function timestamp() {
  return new Date().toISOString().replace('T', ' ').slice(0, 16);
}

function writeLog(entry) {
  const header = `## ${timestamp()} — Цикл #${cycleCount}\n\n`;
  const content = header + entry.map(e => `- ${e.status === 'fixed' ? '✅' : e.status === 'escalated' ? '❌' : '⚠️'} ${e.code}: ${e.message} (${e.file}:${e.line})`).join('\n') + '\n\n';
  fs.appendFileSync(LOG_PATH, content + `**Статистика**: найдено ${entry.length}, исправлено ${entry.filter(e => e.status === 'fixed').length}, эскалировано ${entry.filter(e => e.status === 'escalated').length}\n\n---\n\n`);
}

function updateStatus(state) {
  try {
    const status = JSON.parse(fs.readFileSync(STATUS_PATH, 'utf-8'));
    status.bughunter = {
      status: state || 'idle',
      cycle: cycleCount,
      found: stats.totalFound,
      fixed: stats.totalFixed,
      escalated: stats.totalEscalated,
      lastScan: timestamp(),
      thought: state === 'working' ? 'Сканирую код...' : state === 'error' ? 'Ошибка цикла' : 'Ожидание',
      color: '#F44336'
    };
    fs.writeFileSync(STATUS_PATH, JSON.stringify(status, null, 2));
  } catch {}
}

function sendToBus(from, to, type, subject, body, payload = {}) {
  try {
    if (fs.existsSync(BUS_PATH)) {
      const bus = require(BUS_PATH);
      bus.send(from, to, type, subject, body, payload);
    }
  } catch {}
}

function runBuild() {
  try {
    execSync('npx vite build', { cwd: path.join(ROOT, 'client'), stdio: 'pipe', timeout: 120000 });
    return true;
  } catch {
    return false;
  }
}

// ====== Files to scan ======

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

// ====== Heuristics ======

function findHardcodedColors(content, file) {
  const results = [];
  const palette = new Set(['0b0807', 'FFBF00', 'B08D57', '0D0F13', 'F5F5F5', '9D9D9D', '8D6B3D', 'C4A46B', 'fff', '000', 'ffffff', '000000']);
  // Pattern: color/hext-ish values that aren't CSS variables or palette colors
  const re = /(?<!var\(--)[:#]\s*#([0-9a-fA-F]{3,8})\b/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    const hex = m[1].toLowerCase();
    const fullHex = hex.length === 3 ? hex.split('').map(c => c + c).join('') : hex;
    if (!palette.has(fullHex.toUpperCase()) && !palette.has(fullHex) && fullHex !== hex) {
      const line = content.slice(0, m.index).split('\n').length;
      // Skip common non-color hex values
      if (!fullHex.match(/^(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/)) continue;
      // Skip if it's a font-weight, z-index, etc
      const ctxBefore = content.slice(Math.max(0, m.index - 30), m.index);
      if (ctxBefore.match(/font-weight|z-index|opacity|flex|grid|line-clamp|animation-delay|transition-delay/)) continue;
      results.push({ code: 'UI-COLOR', file, line, message: `Hardcoded color #${fullHex} не входит в палитру Nocturnal Noir`, confidence: 85 });
    }
  }
  return results;
}

function findMissingAria(content, file) {
  const results = [];
  // Icon-only buttons without aria-label
  const re = /<button\s+([^>]*?)>\s*<\w+\s[^>]*\/>\s*<\/button>/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    const attrs = m[1];
    if (!attrs.includes('aria-label') && !attrs.includes('aria-labelledby')) {
      const line = content.slice(0, m.index).split('\n').length;
      results.push({ code: 'A11Y-LABEL', file, line, message: 'Кнопка-иконка без aria-label', confidence: 98 });
    }
  }
  // Links with only icon inside
  const re2 = /<a\s+([^>]*?)>\s*<svg/g;
  let m2;
  while ((m2 = re2.exec(content)) !== null) {
    const attrs = m2[1];
    if (!attrs.includes('aria-label') && !attrs.includes('aria-labelledby')) {
      const line = content.slice(0, m2.index).split('\n').length;
      results.push({ code: 'A11Y-LABEL', file, line, message: 'Ссылка с SVG без aria-label', confidence: 95 });
    }
  }
  // Images without alt
  const re3 = /<img\s+([^>]*?)>/g;
  let m3;
  while ((m3 = re3.exec(content)) !== null) {
    const attrs = m3[1];
    if (!attrs.includes('alt=')) {
      const line = content.slice(0, m3.index).split('\n').length;
      results.push({ code: 'A11Y-ALT', file, line, message: 'Изображение без alt-атрибута', confidence: 99 });
    }
  }
  return results;
}

function findPromiseWithoutCatch(content, file) {
  const results = [];
  // .then() without .catch()
  const re = /\.then\s*\([^)]*\)\s*(?!\s*\.catch)/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    // Check if it's part of a chain
    const after = content.slice(m.index + m[0].length, m.index + m[0].length + 50);
    if (!after.trim().startsWith('.catch')) {
      const line = content.slice(0, m.index).split('\n').length;
      results.push({ code: 'FUNC-PROMISE', file, line, message: 'Promise без .catch()', confidence: 90 });
    }
  }
  return results;
}

function findMapWithoutNullCheck(content, file) {
  const results = [];
  // .map() on arrays without optional chaining or length check
  const re = /\{(\w+)\.map\(/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    const varName = m[1];
    // Skip ALL_CAPS constants (static arrays like BOWL_OPTIONS, LIQUID_OPTIONS, etc.)
    if (/^[A-Z][A-Z_]+$/.test(varName)) continue;
    // Skip short names that are likely props or state
    if (['items', 'data', 'tabs', 'logs', 'dots', 'posts', 'rows', 'cols', 'flavors', 'paths'].includes(varName)) {
      // Check for higher confidence if it's a prop usage
      if (file.includes('components/')) continue;
    }
    // Check if there's a length check or optional chaining nearby
    const beforeSection = content.slice(Math.max(0, m.index - 200), m.index);
    const afterSection = content.slice(m.index, Math.min(content.length, m.index + 100));
    const hasSafeAccess = beforeSection.includes(`${varName}?.`) || beforeSection.includes(`${varName}.length`) || afterSection.includes('?.map');
    if (!hasSafeAccess && !varName.includes('?')) {
      const line = content.slice(0, m.index).split('\n').length;
      results.push({ code: 'FUNC-EMPTY-ARR', file, line, message: `.map() на ${varName} без проверки на null/undefined`, confidence: 80 });
    }
  }
  return results;
}

function findMissingLoadingState(content, file) {
  const results = [];
  // Functions that fetch/load data but the component doesn't show loading state
  if (content.includes('useEffect') && content.includes('setLoading') && !content.includes('loading ?') && !content.includes('if (loading)')) {
    const line = content.split('\n').length;
    results.push({ code: 'UI-LOADING', file, line, message: 'Компонент с setLoading, но без отображения loading-состояния', confidence: 80 });
  }
  return results;
}

function findGlassMismatch(content, file) {
  const results = [];
  // Glassmorphism that doesn't match the pattern
  const re = /rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\.\d+\s*\)/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    const line = content.slice(0, m.index).split('\n').length;
    const near = content.slice(Math.max(0, m.index - 40), m.index + m[0].length + 40);
    if (near.includes('backdrop-filter') || near.includes('glass')) {
      results.push({ code: 'UI-GLASS', file, line, message: 'Glassmorphism использует rgba(0,0,0,...) вместо rgba(15,12,10,0.5)', confidence: 95 });
    }
  }
  return results;
}

function findDualGoldIssues(content, file) {
  const results = [];
  // #FFBF00 used as bg on non-interactive elements (should be decorative bg)
  const reBgBright = /(?:background|bg)[^;{]*#FFBF00/gi;
  let m;
  while ((m = reBgBright.exec(content)) !== null) {
    const line = content.slice(0, m.index).split('\n').length;
    const ctx = content.slice(Math.max(0, m.index - 60), m.index + m[0].length + 60);
    if (!ctx.includes('hover') && !ctx.includes('active') && !ctx.includes('cta') && !ctx.includes('CTA') && !ctx.includes('gold-bright-glow') && !ctx.includes('btn') && !ctx.includes('Button')) {
      results.push({ code: 'UI-GOLD-DUAL', file, line, message: '#FFBF00 (bright gold) использован как фоновый — нужен #B08D57', confidence: 85 });
    }
  }
  // #B08D57 on interactive/active elements (should be FFBF00)
  const reTextMuted = /(?:color|text)[^;{]*#B08D57/gi;
  while ((m = reTextMuted.exec(content)) !== null) {
    const line = content.slice(0, m.index).split('\n').length;
    const ctx = content.slice(Math.max(0, m.index - 60), m.index + m[0].length + 60);
    if (ctx.includes('hover') || ctx.includes('active') || ctx.includes('cta') || ctx.includes('CTA')) {
      results.push({ code: 'UI-GOLD-DUAL', file, line, message: '#B08D57 (muted gold) на активном элементе — нужен #FFBF00', confidence: 90 });
    }
  }
  return results;
}

// ====== Auto-fix functions ======

function autoFix(results, fileContent, filePath) {
  const fixes = [];
  for (const bug of results) {
    if (bug.confidence >= config.confidenceThreshold) {
      const f = applyFix(bug, fileContent, filePath);
      if (f) fixes.push(f);
    }
  }
  return fixes;
}

function applyFix(bug, content, filePath) {
  const lines = content.split('\n');
  const idx = bug.line - 1;
  if (idx < 0 || idx >= lines.length) return null;

  const line = lines[idx];

  switch (bug.code) {
    case 'A11Y-LABEL': {
      // Add aria-label to icon buttons
      const btnMatch = line.match(/<button\s+([^>]*?)>/);
      if (btnMatch && !btnMatch[1].includes('aria-label')) {
        const iconName = extractIconName(line);
        lines[idx] = line.replace('<button ', `<button aria-label="${iconName}" `);
        return { ...bug, status: 'fixed', newContent: lines.join('\n') };
      }
      // Add aria-label to SVG links
      const aMatch = line.match(/<a\s+([^>]*?)>/);
      if (aMatch && !aMatch[1].includes('aria-label')) {
        lines[idx] = line.replace('<a ', '<a aria-label="Перейти" ');
        return { ...bug, status: 'fixed', newContent: lines.join('\n') };
      }
      return null;
    }
    case 'A11Y-ALT': {
      const altMatch = line.match(/<img\s+([^>]*?)>/);
      if (altMatch && !altMatch[1].includes('alt=')) {
        lines[idx] = line.replace('<img ', '<img alt="" ');
        return { ...bug, status: 'fixed', newContent: lines.join('\n') };
      }
      return null;
    }
    case 'UI-GLASS': {
      lines[idx] = line.replace(/rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\.\d+\s*\)/g, 'rgba(15, 12, 10, 0.5)');
      // Also fix backdrop-filter if nearby
      if (idx + 1 < lines.length && lines[idx + 1].includes('backdrop-filter')) {
        lines[idx + 1] = lines[idx + 1].replace(/blur\(\d+px\)/g, 'blur(20px)');
      }
      // Fix border
      for (let i = Math.max(0, idx - 2); i <= Math.min(lines.length - 1, idx + 2); i++) {
        if (lines[i].includes('border') && lines[i].includes('rgba')) {
          lines[i] = lines[i].replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.\d+\s*\)/g, 'rgba(255, 191, 0, 0.15)');
        }
      }
      return { ...bug, status: 'fixed', newContent: lines.join('\n') };
    }
    case 'UI-GOLD-DUAL': {
      if (bug.message.includes('#FFBF00')) {
        lines[idx] = line.replace(/#FFBF00/gi, '#B08D57');
      } else if (bug.message.includes('#B08D57')) {
        lines[idx] = line.replace(/#B08D57/gi, '#FFBF00');
      }
      return { ...bug, status: 'fixed', newContent: lines.join('\n') };
    }
    case 'FUNC-EMPTY-ARR': {
      // Add optional chaining
      const mapMatch = line.match(/\{(\w+)\.map\(/);
      if (mapMatch && !mapMatch[1].includes('?')) {
        lines[idx] = line.replace(`${mapMatch[1]}.map(`, `${mapMatch[1]}?.map(`);
        return { ...bug, status: 'fixed', newContent: lines.join('\n') };
      }
      return null;
    }
    default:
      return null;
  }
}

const ICON_LABELS = {
  ChevronLeft: 'Назад', ChevronRight: 'Вперёд', ChevronUp: 'Вверх', ChevronDown: 'Вниз',
  X: 'Закрыть', Close: 'Закрыть', Menu: 'Меню', Settings: 'Настройки',
  Plus: 'Добавить', Minus: 'Убрать', Edit: 'Редактировать', Trash: 'Удалить',
  Trash2: 'Удалить', Delete: 'Удалить', Search: 'Поиск', Filter: 'Фильтр',
  Download: 'Скачать', Upload: 'Загрузить', Share: 'Поделиться', Copy: 'Копировать',
  Heart: 'Избранное', Star: 'Звезда', Bookmark: 'Закладка', Bell: 'Уведомления',
  User: 'Пользователь', LogOut: 'Выйти', LogIn: 'Войти', ArrowLeft: 'Назад',
  ArrowRight: 'Вперёд', ArrowUp: 'Вверх', ArrowDown: 'Вниз',
  Home: 'На главную', House: 'На главную', Bug: 'Баги', Play: 'Запуск',
  Square: 'Стоп', RotateCcw: 'Обновить', Refresh: 'Обновить',
  Sun: 'Светлая тема', Moon: 'Тёмная тема', Eye: 'Показать', EyeOff: 'Скрыть',
  Info: 'Информация', AlertTriangle: 'Внимание', AlertCircle: 'Ошибка',
  Check: 'Подтвердить', CheckCircle: 'Готово', FileText: 'Файл', Image: 'Изображение',
  Package: 'Упаковка', Flame: 'Огонь', Crown: 'Корона', Mail: 'Почта',
  Activity: 'Активность', FileText: 'Документ', Armchair: 'Место',
};

function extractIconName(line) {
  const iconMatch = line.match(/<(\w+)(?:\s|\/|>)/);
  if (iconMatch) {
    const name = iconMatch[1];
    if (ICON_LABELS[name]) return ICON_LABELS[name];
    // Try to extract a human-readable name from camelCase
    return name
      .replace(/Icon$/, '')
      .replace(/([A-Z])/g, ' $1')
      .trim() || 'Кнопка';
  }
  const closeMatch = line.match(/aria-label="([^"]+)"/);
  if (closeMatch) return closeMatch[1];
  // Context-based: look for nearby text
  return 'Кнопка';
}

// ====== Scan cycle ======

function runScanCycle() {
  if (!config.enabled) {
    updateStatus('disabled');
    return;
  }

  cycleCount++;
  updateStatus('working');
  const allBugs = [];
  const files = getSourceFiles();
  let cycleFixed = 0;
  let cycleEscalated = 0;

  for (const file of files) {
    let content;
    try { content = fs.readFileSync(file, 'utf-8'); } catch { continue; }
    const relFile = path.relative(ROOT, file);

    const bugs = [
      ...findHardcodedColors(content, relFile),
      ...findMissingAria(content, relFile),
      ...findPromiseWithoutCatch(content, relFile),
      ...findMapWithoutNullCheck(content, relFile),
      ...findMissingLoadingState(content, relFile),
      ...findGlassMismatch(content, relFile),
      ...findDualGoldIssues(content, relFile),
    ];

    if (bugs.length === 0) continue;

    allBugs.push(...bugs);

    // Auto-fix high confidence bugs
    const highConfBugs = bugs.filter(b => b.confidence >= config.confidenceThreshold);
    const escalatedBugs = bugs.filter(b => b.confidence < config.confidenceThreshold);

    if (highConfBugs.length > 0) {
      const fixes = autoFix(highConfBugs, content, file);
      for (const fix of fixes) {
        if (fix && fix.newContent) {
          try {
            fs.writeFileSync(file, fix.newContent, 'utf-8');
            cycleFixed++;
            stats.totalFixed++;
            sendToBus('bughunter', 'orchestrator', 'result', `Bug fixed: ${fix.code}`, `${fix.message} in ${fix.file}:${fix.line}`, fix);
          } catch (err) {
            console.error(`[BugHunter] Failed to write fix to ${file}:`, err.message);
          }
        }
      }
    }

    for (const bug of escalatedBugs) {
      cycleEscalated++;
      stats.totalEscalated++;
      sendToBus('bughunter', 'orchestrator', 'alert', `Bug escalated: ${bug.code}`, `${bug.message} in ${bug.file}:${bug.line} (confidence ${bug.confidence}%)`, bug);
    }
  }

  stats.totalFound += allBugs.length;

  // Build verification
  if (cycleFixed > 0) {
    console.log(`[BugHunter] Cycle #${cycleCount}: build verify...`);
    const buildOk = runBuild();
    if (!buildOk) {
      console.error(`[BugHunter] Cycle #${cycleCount}: BUILD FAILED! Rolling back...`);
      // Note: a real rollback would use git. For now, log the failure.
      sendToBus('bughunter', 'orchestrator', 'alert', 'Build failed after auto-fix', `Cycle #${cycleCount}: ${cycleFixed} fixes caused build failure`, { cycle: cycleCount, fixes: cycleFixed });
    } else {
      console.log(`[BugHunter] Cycle #${cycleCount}: build OK (${cycleFixed} fixes)`);
    }
  }

  // Write log
  if (allBugs.length > 0) {
    const logEntries = [
      ...allBugs.filter(b => b.confidence >= config.confidenceThreshold).map(b => ({ ...b, status: 'fixed' })),
      ...allBugs.filter(b => b.confidence < config.confidenceThreshold).map(b => ({ ...b, status: 'escalated' })),
    ];
    writeLog(logEntries);
  }

  updateStatus('idle');
  console.log(`[BugHunter] Cycle #${cycleCount}: ${allBugs.length} bugs, ${cycleFixed} fixed, ${cycleEscalated} escalated`);
}

// ====== Main loop ======

console.log(`[BugHunter] Daemon starting. Interval: ${config.scanIntervalMs}ms`);

// Register in status
updateStatus('idle');

// Announce on bus
sendToBus('bughunter', 'orchestrator', 'task', 'BugHunter started', `Daemon initialized, scanning every ${config.scanIntervalMs}ms`, { config });

// First scan immediately
runScanCycle();

// Then scan on interval
const interval = setInterval(runScanCycle, config.scanIntervalMs);

// Handle restart signals
process.on('SIGUSR2', () => {
  console.log('[BugHunter] Manual scan triggered');
  runScanCycle();
});

process.on('SIGHUP', () => {
  console.log('[BugHunter] Reloading config...');
  config = loadConfig();
});

process.on('SIGTERM', () => {
  console.log('[BugHunter] Shutting down...');
  clearInterval(interval);
  updateStatus('offline');
  process.exit(0);
});

// Watch for config changes
fs.watchFile(CONFIG_PATH, () => {
  console.log('[BugHunter] Config changed, reloading...');
  config = loadConfig();
  if (!config.enabled) {
    updateStatus('disabled');
    console.log('[BugHunter] Disabled by config');
  } else {
    updateStatus('idle');
    console.log('[BugHunter] Enabled by config');
  }
});
