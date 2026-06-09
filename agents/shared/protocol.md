# Протокол взаимодействия агентов — SPORT LOUNGE AI TEAM

## Архитектура

```
┌─────────────────────────────────────────────────┐
│                  ORCHESTRATOR (NEXUS)            │
│          Центральный координатор задач           │
├─────────────────────────────────────────────────┤
│                   MESSAGE BUS                    │
│         agents/shared/messages.jsonl             │
├──────┬──────┬──────┬──────┬──────┬──────┬───────┤
│PIXEL │REACT │NODE  │DOCKER│SPIDER│ DATA │SHIELD │
│UI/UX │Front │Back  │DevOps│ SEO  │Analyt│Secur. │
└──────┴──────┴──────┴──────┴──────┴──────┴───────┘
```

## Формат сообщений

Все сообщения записываются в `agents/shared/messages.jsonl` (JSON Lines):

```json
{
  "id": "msg-<uuid>",
  "timestamp": "2026-06-01T12:00:00Z",
  "from": "orchestrator",
  "to": "frontend",
  "type": "task|result|question|review|alert|idea",
  "priority": "critical|high|normal|low",
  "subject": "Краткое описание",
  "body": "Полный текст сообщения",
  "context": {
    "files": ["client/src/pages/HomePage.tsx"],
    "relatedTask": "task-001",
    "tags": ["ui", "responsive"]
  },
  "status": "pending|read|done|rejected"
}
```

## Типы сообщений

| Тип | Описание | Пример |
|-----|----------|--------|
| `task` | Назначение задачи агенту | Оркестратор → Frontend: "Сделай адаптив" |
| `result` | Результат выполнения | Frontend → Оркестратор: "Адаптив готов" |
| `question` | Уточняющий вопрос | Backend → Оркестратор: "Какой формат API?" |
| `review` | Запрос на ревью | Frontend → Security: "Проверь XSS" |
| `alert` | Критическое уведомление | Security → ALL: "Найдена уязвимость!" |
| `idea` | Проактивное предложение | SEO → Frontend: "Добавь meta og:image" |

## Проактивные триггеры

Каждый агент следит за определёнными событиями:

### Файловые триггеры
- **UI/UX**: изменения в `*.css`, `*.tsx` (компоненты), `tailwind.config.*`
- **Frontend**: изменения в `client/src/**`
- **Backend**: изменения в `server/src/**`
- **DevOps**: изменения в `Dockerfile`, `docker-compose.*`, `*.yml` (CI/CD)
- **SEO**: изменения в `index.html`, мета-теги, роуты
- **Security**: изменения в `auth.*`, `.env*`, зависимости
- **Data**: изменения в `models/`, `migrations/`, `schemas/`

### Событийные триггеры
- **Analytics**: новый деплой → анализ метрик
- **Content**: новый роут → предложить контент
- **Orchestrator**: любое сообщение → маршрутизация

## Правила взаимодействия

1. **Агент не может игнорировать alert** — обязан отреагировать
2. **Idea может быть отклонена** — с обоснованием
3. **Question блокирует выполнение** — пока не получен ответ
4. **Review обязателен** перед деплоем (Security + минимум 1 агент)
5. **Оркестратор видит ВСЁ** — каждое сообщение дублируется ему

## Обновление status.json

Каждый агент обновляет свой статус в `agents/status.json`:
- `working` — активно работает над задачей
- `idle` — ожидает задач
- `idea` — есть предложение по улучшению
- `warning` — обнаружена проблема
- `review` — ревьюит работу другого агента
- `blocked` — заблокирован, ждёт ответа

Поле `thought` — текущая "мысль" агента для отображения в пиксельной игре.
