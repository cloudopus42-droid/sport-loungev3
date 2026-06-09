const path = require('path');
const bus = require('./message-bus');

// 1. Send Orchestrator requests to REACT (frontend) and NODE (backend)
console.log('Sending orchestrator request to REACT...');
const msgReact = bus.send(
  'orchestrator',
  'frontend',
  'task',
  'Анализ клиентской части для заказа кальяна',
  'REACT, необходимо проанализировать текущий код страниц заказа (BookingPage, MixologistPage), профиля (ProfilePage) и админки на предмет интеграции нового флоу заказа.',
  { files: ['client/src/pages/BookingPage.tsx', 'client/src/pages/MixologistPage.tsx', 'client/src/pages/ProfilePage.tsx'] },
  'high'
);

console.log('Sending orchestrator request to NODE...');
const msgNode = bus.send(
  'orchestrator',
  'backend',
  'task',
  'Анализ серверного API и интеграций',
  'NODE, необходимо проанализировать текущую кодовую базу бэкенда: роуты, работу с Supabase/Postgres, а также существующие механизмы работы с Telegram-ботами.',
  { files: ['server/src/server.ts', 'server/src/config/db.ts', 'server/src/services/supportBot.ts'] },
  'high'
);

// 2. Update agent statuses in status.json to reflect active analysis
console.log('Updating agent statuses in status.json...');
bus.updateAgentStatus('orchestrator', {
  status: 'working',
  thought: 'Ожидаю результатов анализа кодовой базы от REACT и NODE.',
  lastAction: 'Запросил аудит кодовой базы у REACT и NODE'
});

bus.updateAgentStatus('frontend', {
  status: 'working',
  thought: 'Проверяю структуру страниц заказа (Booking/Mixologist) и профиля...',
  lastAction: 'Выполняю анализ фронтенд-компонентов'
});

bus.updateAgentStatus('backend', {
  status: 'working',
  thought: 'Анализирую серверные роуты, БД и интеграцию с Telegram-ботом...',
  lastAction: 'Выполняю аудит бэкенд-архитектуры'
});

console.log('Swarm orchestration initialized successfully!');
console.log(`React Msg ID: ${msgReact.id}`);
console.log(`Node Msg ID: ${msgNode.id}`);
