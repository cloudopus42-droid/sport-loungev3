# 🤖 SPORT LOUNGE AI TEAM

> Система AI-агентов для полного цикла разработки, поддержки и развития проекта Sport Lounge.

## 🏗️ Структура

```
agents/
├── agents/                    # Модули агентов
│   ├── orchestrator/          # NEXUS — главный координатор
│   ├── ui-ux-agent/           # PIXEL — UI/UX дизайнер  
│   ├── frontend-agent/        # REACT — фронтенд разработчик
│   ├── backend-agent/         # NODE — бэкенд разработчик
│   ├── devops-agent/          # DOCKER — DevOps инженер
│   ├── seo-agent/             # SPIDER — SEO специалист
│   ├── analytics-agent/       # DATA — аналитик
│   ├── content-agent/         # QUILL — контент-менеджер
│   ├── security-agent/        # SHIELD — безопасник
│   └── data-agent/            # QUERY — дата-инженер
├── skills/                    # Загруженные скиллы
│   ├── ui-ux/                 # UI/UX Pro Max (161 правило, 67 стилей)
│   ├── frontend-design/       # Claude Frontend Design
│   ├── aifactory/             # AI Factory оркестрация
│   └── cc-1c/                 # Интеграции с данными
├── shared/                    # Общие компоненты
│   ├── protocol.md            # Протокол взаимодействия
│   ├── message-bus.js         # Шина сообщений
│   ├── agent-registry.json    # Реестр агентов
│   └── messages.jsonl         # Лог сообщений
├── swarm-universe/            # 🌌 Визуализация (киберпанк созвездие/нейросеть)
│   └── index.html             # Самодостаточная веб-страница панели
├── status.json                # Статус всех агентов (real-time)
└── README.md                  # Этот файл
```

## 🌌 AI Swarm Universe

Откройте `swarm-universe/index.html` в браузере, чтобы увидеть интерактивное созвездие агентов и анимированные цепочки событий в реальном времени.

**Функции:**
- 🗺️ Интерактивная космическая карта агентов-звезд с орбитами инструментов
- ⚡ Анимированные импульсы переноса задач по гравитационным связям
- 💸 Счетчик пассивного дохода и сэкономленных часов от автоматизации
- 🖱️ Клик по агенту → спектроскопическая терминальная карточка с логами
- 🔊 Web Audio API космический эмбиент и звуки транзакций
- 🔄 Режим автономной симуляции бизнес-кейсов и поллинг status.json

## 🚀 Быстрый старт и Настройка

Для полноценной работы с возможностью редактирования задач и промптов агентов прямо из браузера с записью на диск, запустите встроенный Node.js сервер.

### 1. Запуск конфигурационного сервера
В корне папки `agents` выполните:
```bash
node server.js
```
Это запустит локальный сервер на порту **4000** и выведет в консоль ссылку.

### 2. Открытие в браузере
Перейдите по ссылке:
👉 **[http://localhost:4000/](http://localhost:4000/)**

### 3. Настройка агентов под себя
1. Кликните по любой звезде-агенту на карте (например, `NEXUS`, `REACT` или `QUILL`).
2. В панели инспектора справа нажмите кнопку **«⚙️ НАСТРОИТЬ ЗАДАЧУ ИИ»**.
3. В открывшемся окне отредактируйте специализацию (роль), пропишите глобальные инструкции в поле ввода (это файл `prompt.md` агента) и отметьте галочками инструменты, к которым агент имеет доступ.
4. Нажмите **«💾 СОХРАНИТЬ НА ДИСК»**. Сервер автоматически обновит файлы `prompt.md` и `shared/agent-registry.json` на вашем компьютере.
5. Если вы запустили файл `index.html` напрямую (без сервера), используйте кнопку **«📥 СКАЧАТЬ PROMPT.MD»** для ручной замены файлов.

### 4. Запуск цепочки событий
Вы можете включить или отключить режим симуляции с помощью кнопки **«СИМУЛЯЦИЯ»** в нижнем правом углу для тестирования логики переходов. Для реальной работы роя бэкенд проекта будет использовать именно эти сохраненные промпты!

### 2. Использование агентов

Агенты интегрируются через систему промптов. Каждый агент имеет:
- `prompt.md` — системный промпт с инструкциями
- Раздел в `agent-registry.json` — инструменты и триггеры
- Секцию в `status.json` — текущий статус

### 3. Отправка задачи через Message Bus
```javascript
const bus = require('./shared/message-bus');

// Отправить задачу фронтенд-агенту
bus.send('orchestrator', 'frontend', 'task', 
  'Добавить адаптив на главную', 
  'Сделать responsive layout для мобильных устройств',
  { files: ['client/src/pages/HomePage.tsx'], priority: 'high' }
);

// Проверить ожидающие сообщения
const pending = bus.getMessages({ to: 'frontend', status: 'pending' });
console.log('Задачи для Frontend:', pending);
```

### 4. Обновление статуса агента
```javascript
const bus = require('./shared/message-bus');

bus.updateAgentStatus('frontend', {
  status: 'working',
  thought: 'Пишу адаптивный layout...',
  lastAction: 'Работа над HomePage responsive'
});
```

## 👥 Команда агентов

| Агент | Имя | Специализация | Цвет |
|-------|-----|---------------|------|
| 🎯 Orchestrator | NEXUS | Координация и декомпозиция задач | Cyan |
| 🎨 UI/UX | PIXEL | Дизайн, юзабилити, accessibility | Hot Pink |
| ⚛️ Frontend | REACT | React, TypeScript, компоненты | Blue |
| 🔧 Backend | NODE | Express, MongoDB, API | Green |
| 🐳 DevOps | DOCKER | CI/CD, деплой, инфраструктура | Red |
| 🕷️ SEO | SPIDER | Мета-теги, structured data, скорость | Gold |
| 📊 Analytics | DATA | Метрики, KPI, отчёты | Purple |
| ✍️ Content | QUILL | Тексты, копирайтинг, контент-план | Orange |
| 🛡️ Security | SHIELD | OWASP, аудит, уязвимости | Crimson |
| 🗄️ Data | QUERY | БД, миграции, интеграции | Spring Green |

## 📋 Принципы работы

1. **Проактивность**: Агенты не ждут — они предлагают улучшения
2. **Cross-review**: Каждая задача проверяется минимум 2 агентами
3. **3 альтернативы**: При неоднозначности — 3 варианта решения
4. **Security-first**: SHIELD участвует в каждом деплое
5. **User-first**: PIXEL проверяет каждый UI-компонент

## 📡 Источники скиллов

- [UI/UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) — 161 правило дизайна
- [Claude Frontend Design](https://github.com/anthropics/claude-code) — production-grade UI
- [Cloud.ru AI Factory](https://github.com/cloud-ru/evo-aifactory-skills) — оркестрация
- [1C Skills](https://github.com/Nikolay-Shirokov/cc-1c-skills) — работа с данными
