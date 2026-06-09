/**
 * SPORT LOUNGE AI TEAM — Message Bus
 * Шина сообщений для взаимодействия агентов.
 * 
 * Использование:
 *   const bus = require('./message-bus');
 *   bus.send('orchestrator', 'frontend', 'task', 'Сделай адаптив', { files: ['App.tsx'] });
 *   const msgs = bus.getMessages({ to: 'frontend', status: 'pending' });
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MESSAGES_FILE = path.join(__dirname, 'messages.jsonl');
const STATUS_FILE = path.join(__dirname, '..', 'status.json');

// Инициализация файла сообщений
if (!fs.existsSync(MESSAGES_FILE)) {
  fs.writeFileSync(MESSAGES_FILE, '', 'utf-8');
}

/**
 * Отправить сообщение через шину
 */
function send(from, to, type, subject, body = '', context = {}, priority = 'normal') {
  const message = {
    id: `msg-${crypto.randomUUID()}`,
    timestamp: new Date().toISOString(),
    from,
    to,
    type,
    priority,
    subject,
    body: typeof body === 'string' ? body : JSON.stringify(body),
    context,
    status: 'pending'
  };

  fs.appendFileSync(MESSAGES_FILE, JSON.stringify(message) + '\n', 'utf-8');
  
  // Дублируем оркестратору если он не отправитель и не получатель
  if (from !== 'orchestrator' && to !== 'orchestrator') {
    const copy = { ...message, id: `msg-${crypto.randomUUID()}`, to: 'orchestrator', _forwarded: true };
    fs.appendFileSync(MESSAGES_FILE, JSON.stringify(copy) + '\n', 'utf-8');
  }

  return message;
}

/**
 * Получить сообщения с фильтрацией
 */
function getMessages(filter = {}) {
  if (!fs.existsSync(MESSAGES_FILE)) return [];
  
  const lines = fs.readFileSync(MESSAGES_FILE, 'utf-8').trim().split('\n').filter(Boolean);
  let messages = lines.map(line => {
    try { return JSON.parse(line); } catch { return null; }
  }).filter(Boolean);

  if (filter.to) messages = messages.filter(m => m.to === filter.to || m.to === 'ALL');
  if (filter.from) messages = messages.filter(m => m.from === filter.from);
  if (filter.type) messages = messages.filter(m => m.type === filter.type);
  if (filter.status) messages = messages.filter(m => m.status === filter.status);
  if (filter.priority) messages = messages.filter(m => m.priority === filter.priority);
  if (filter.since) messages = messages.filter(m => new Date(m.timestamp) >= new Date(filter.since));

  return messages;
}

/**
 * Отметить сообщение как прочитанное/выполненное
 */
function updateStatus(messageId, newStatus) {
  if (!fs.existsSync(MESSAGES_FILE)) return false;
  
  const lines = fs.readFileSync(MESSAGES_FILE, 'utf-8').trim().split('\n').filter(Boolean);
  let found = false;
  
  const updated = lines.map(line => {
    try {
      const msg = JSON.parse(line);
      if (msg.id === messageId) {
        msg.status = newStatus;
        found = true;
        return JSON.stringify(msg);
      }
      return line;
    } catch { return line; }
  });

  if (found) {
    fs.writeFileSync(MESSAGES_FILE, updated.join('\n') + '\n', 'utf-8');
  }
  return found;
}

/**
 * Обновить статус агента в status.json
 */
function updateAgentStatus(agentId, updates) {
  const status = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf-8'));
  if (status.agents[agentId]) {
    Object.assign(status.agents[agentId], updates);
    status.lastUpdate = new Date().toISOString();
    fs.writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2), 'utf-8');
  }
}

/**
 * Добавить XP команде (для левел-апа в пиксельной игре)
 */
function addTeamXP(amount) {
  const status = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf-8'));
  status.teamXP += amount;
  while (status.teamXP >= status.teamXPNext) {
    status.teamXP -= status.teamXPNext;
    status.teamLevel += 1;
    status.teamXPNext = Math.floor(status.teamXPNext * 1.5);
  }
  status.lastUpdate = new Date().toISOString();
  fs.writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2), 'utf-8');
  return { level: status.teamLevel, xp: status.teamXP, next: status.teamXPNext };
}

/**
 * Получить полный статус команды
 */
function getTeamStatus() {
  return JSON.parse(fs.readFileSync(STATUS_FILE, 'utf-8'));
}

module.exports = {
  send,
  getMessages,
  updateStatus,
  updateAgentStatus,
  addTeamXP,
  getTeamStatus,
  MESSAGES_FILE,
  STATUS_FILE
};
