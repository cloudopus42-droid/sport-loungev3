/**
 * SPORT LOUNGE AI TEAM — Configuration Server
 * Легковесный веб-сервер для раздачи дашборда и сохранения промптов/инструментов агентов на диск.
 * 
 * Запуск:
 *   node server.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = 4000;
const AGENTS_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jsonl': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

// Функция для безопасного отдачи статических файлов
function serveStaticFile(res, filePath) {
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404: Файл не найден');
      return;
    }

    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('500: Ошибка чтения файла');
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  });
}

// Хелпер для парсинга JSON тела запроса
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = reqUrl.pathname;

  // Разрешаем CORS для локальной отладки
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // --- API ROUTE: SAVE AGENT CONFIG ---
  if (req.method === 'POST' && pathname === '/api/save-agent') {
    try {
      const data = await parseJsonBody(req);
      const { agentId, prompt, tools } = data;

      if (!agentId || !prompt) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Отсутствуют обязательные параметры' }));
        return;
      }

      // 1. Путь к файлу промпта
      // Папка агента может называться по-разному в зависимости от ID
      let agentDirName = agentId;
      if (agentId !== 'orchestrator' && !agentId.endsWith('-agent')) {
        agentDirName = `${agentId}-agent`;
      }
      
      const promptPath = path.join(AGENTS_DIR, 'agents', agentDirName, 'prompt.md');

      // Перезаписываем prompt.md
      fs.writeFileSync(promptPath, prompt, 'utf-8');

      // 2. Обновляем shared/agent-registry.json если переданы инструменты
      if (Array.isArray(tools)) {
        const registryPath = path.join(AGENTS_DIR, 'shared', 'agent-registry.json');
        if (fs.existsSync(registryPath)) {
          const registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
          if (registry.agents && registry.agents[agentId]) {
            registry.agents[agentId].tools = tools;
            fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2), 'utf-8');
          }
        }
      }

      // 3. Также обновляем статус в status.json
      const statusPath = path.join(AGENTS_DIR, 'status.json');
      if (fs.existsSync(statusPath)) {
        const status = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
        if (status.agents && status.agents[agentId]) {
          // Вырезаем имя и роль из Markdown если они обновились, или оставляем старые
          // Для простоты сохраняем последнюю итерацию
          status.lastUpdate = new Date().toISOString();
          fs.writeFileSync(statusPath, JSON.stringify(status, null, 2), 'utf-8');
        }
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: `Настройки агента ${agentId} успешно сохранены на диск` }));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: error.message }));
    }
    return;
  }

  // --- STATIC FILES ROUTING ---
  // Дефолтный роут -> перенаправление на дашборд
  let filePath = path.join(AGENTS_DIR, pathname);
  if (pathname === '/' || pathname === '/index.html') {
    filePath = path.join(AGENTS_DIR, 'swarm-universe', 'index.html');
  }

  // Проверяем, чтобы файл запрашивался из папки agents (защита от directory traversal)
  const relative = path.relative(AGENTS_DIR, filePath);
  const isSafe = relative && !relative.startsWith('..') && !path.isAbsolute(relative);

  if (isSafe || filePath === path.join(AGENTS_DIR, 'swarm-universe', 'index.html')) {
    serveStaticFile(res, filePath);
  } else {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403: Доступ запрещен');
  }
});

server.listen(PORT, () => {
  console.log(`\n🤖 SPORT LOUNGE CONFIG SERVER`);
  console.log(`===========================================`);
  console.log(`Панель управления запущена на порту ${PORT}`);
  console.log(`Откройте ссылку в браузере:`);
  console.log(`👉 http://localhost:${PORT}/`);
  console.log(`===========================================`);
});
