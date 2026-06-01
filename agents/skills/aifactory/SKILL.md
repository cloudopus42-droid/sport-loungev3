# AI Factory Skills (адаптировано из cloud-ru/evo-aifactory-skills)
# Источник: https://github.com/cloud-ru/evo-aifactory-skills

## Описание
Скиллы для оркестрации AI-агентов: создание, управление, workflow, коммуникация между агентами.

## Применение в Sport Lounge

### Оркестрация агентов
- Распределение задач по специализации
- Последовательные и параллельные workflow
- Retry-логика при ошибках
- Мониторинг выполнения

### Протокол коммуникации
- Message Bus (JSONL-based)
- Broadcast сообщения (ALL)
- Direct сообщения (agent → agent)
- Priority queue (critical > high > normal > low)

### Workflow Templates

#### Новая фича (полный цикл)
```
1. Orchestrator → получает ТЗ
2. Orchestrator → декомпозирует
3. UI/UX → дизайн
4. Frontend + Backend → параллельная реализация
5. Security → review
6. SEO → проверка
7. DevOps → деплой
8. Analytics → настройка метрик
```

#### Баг-фикс
```
1. Orchestrator → определяет область (front/back)
2. Профильный агент → фикс
3. Security → проверка что фикс безопасен
4. DevOps → hotfix deploy
```

#### Контент-обновление
```
1. Content → генерация
2. SEO → проверка
3. Frontend → интеграция
4. DevOps → deploy
```

### A2A (Agent-to-Agent) Chat Protocol
Агенты могут вести диалог для решения сложных задач:
- Frontend ↔ Backend: согласование API контракта
- UI/UX ↔ Frontend: уточнение дизайна
- Security ↔ Backend: обсуждение безопасности
- Data ↔ Analytics: оптимизация запросов
