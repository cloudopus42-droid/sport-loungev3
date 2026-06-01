const path = require('path');
const bus = require('./message-bus');

// 1. Post REACT's analysis result
console.log('Sending REACT analysis response...');
bus.send(
  'frontend',
  'orchestrator',
  'result',
  'Результаты анализа клиентской части',
  'REACT: Проанализировал кодовую базу фронтенда. Вкладка MixologistPage имеет готовую форму выбора миксов, но сейчас она только генерирует QR-коды и Telegram-ссылки. Нам нужно добавить полноценный вызов API (POST /api/orders). Страница BookingPage имеет выбор столов на 3D-карте, который мы можем переиспользовать. Создам компоненты OrderProgress (оформление по типу сигарного ритуала с компасом-оценкой) и OrdersAdmin для очереди заказов с drag-and-drop сортировкой. Адаптивность настрою.',
  { files: ['client/src/pages/MixologistPage.tsx', 'client/src/pages/BookingPage.tsx'] }
);

// 2. Post NODE's analysis result
console.log('Sending NODE analysis response...');
bus.send(
  'backend',
  'orchestrator',
  'result',
  'Результаты анализа серверной части',
  'NODE: Проанализировал сервер. Существующий API работает с Supabase через pg. Я создам новый роут /api/orders, подключу его в server.ts. Для Telegram-уведомлений буду использовать токен 7767469525:AAEVMgecmpKHdrMC8NqzCy37_Q41ld_2QcU. Также реализую логику таймеров (15 минут), авто-оповещения о задержках и PUT /api/orders/reorder для перетаскивания очереди.',
  { files: ['server/src/server.ts', 'server/src/routes/bookings.ts'] }
);

// 3. Post NEXUS's task delegation based on the analyses
console.log('Sending NEXUS task delegation...');
bus.send(
  'orchestrator',
  'frontend',
  'task',
  'Задание на разработку UI заказа кальяна и прогресс-бара',
  'REACT, приступай к реализации OrderProgress.tsx с шагами сигарного ритуала, кнопками "Позвать мастера" и рейтингом-компасом. Переделай MixologistPage для отправки заказов на API.',
  { relatedTask: 'sprint-1' }
);

bus.send(
  'orchestrator',
  'backend',
  'task',
  'Задание на разработку REST API и Telegram-интеграции',
  'NODE, приступай к созданию роутов в server/src/routes/orders.ts, настрой Telegram-оповещения через токен 7767469525:AAEVMgecmpKHdrMC8NqzCy37_Q41ld_2QcU и логику 15-минутных таймеров.',
  { relatedTask: 'sprint-1' }
);

// 4. Update agent status to working on their assigned items
bus.updateAgentStatus('frontend', {
  status: 'working',
  thought: 'Создаю компоненты OrderProgress.tsx и OrdersAdmin.tsx...',
  lastAction: 'Интеграция UI онлайн-заказа'
});

bus.updateAgentStatus('backend', {
  status: 'working',
  thought: 'Пишу REST эндпоинты для заказов и настраиваю Telegram-сервис...',
  lastAction: 'Разработка backend-логики и Telegram-оповещений'
});

bus.updateAgentStatus('orchestrator', {
  status: 'working',
  thought: 'Координирую разработку нового функционала заказов.',
  lastAction: 'Распределил задачи по спринту'
});

console.log('Swarm analysis logs populated successfully!');
