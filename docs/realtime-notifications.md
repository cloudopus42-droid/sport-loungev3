# Real-Time Notification System

## Архитектура

### WebSocket-события

| Событие | Направление | Источник | Payload |
|---------|------------|----------|---------|
| `new_user` | Server → All | `auth.ts:62` после успешной регистрации | `{ id, name, avatar, timestamp }` |
| `new_review` | Server → All | `memberships.ts:273` после создания отзыва | `{ id, user_name, rating, text, timestamp }` |

Оба события шлются через `getIO().emit()` — глобальный broadcast всем подключённым клиентам.

### Feature flag

- Ключ: `visual_notifications`
- Статус по умолчанию: `false` (disabled)
- Тип: `is_public: true` (виден в статусе для всех)
- Включение: админ-панель → Smart Features → Visual Notifications
- Проверка на клиенте: `useFeature().isFeatureEnabled('visual_notifications')`

## Клиентская часть

### Hook: `useNotificationQueue()`

**Путь:** `client/src/hooks/useNotificationQueue.ts`

Управляет очередью уведомлений:
- Подписывается на `new_user` и `new_review` через Socket.IO
- `enqueue()` — добавляет событие в конец очереди
- `dequeue()` — достаёт следующий из очереди, запускает таймер 5s
- `current` — текущее отображаемое уведомление
- `queue` — массив ожидающих уведомлений

### Компонент: `<NotificationCardStack />`

**Путь:** `client/src/components/ui/NotificationCardStack.tsx`

- Размещается фиксированно: `fixed top-4 right-4 z-50`, ширина 340px
- Показывает стек до 3 карточек: активная (крупно) + 2 следующих (с уменьшением scale и blur)
- Каждая карточка видна 5 секунд, затем плавно исчезает вниз
- При появлении: `y: -20 → 0, opacity: 0 → 1` за 0.4s (spring)
- При исчезновении: `y: 20, opacity: 0` за 0.3s
- Золотой блик (`#FFBF00`) пробегает по краю активной карточки 1.2s
- Визуально: стекломорфизм, `backdrop-filter: blur(20px)`, бордер `rgba(255,191,0,0.15)`
- Иконки: `UserPlus` (новый гость) / `Sparkles` (новый отзыв) + `Star` (рейтинг)

### Интеграция

**Файл:** `client/src/layouts/MainLayout.tsx`
- Импортирован и рендерится рядом с `<ConciergeChat />`
- Автоматически скрыт, если фича `visual_notifications` выключена

## Логика очереди

```
Событие → enqueue()
                ↓
        Очередь пуста? → Да → Показываем сразу
                ↓ Нет
        Добавляем в конец
                ↓
        Через 5s → dequeue() → Следующее из очереди
```

- Ни одно уведомление не теряется
- Новое событие не перебивает текущее
- При пустой очереди показывает мгновенно

## Серверные изменения

| Файл | Изменение |
|------|-----------|
| `server/src/routes/smartFeatures.ts:115` | Добавлен `visual_notifications` feature key |
| `server/src/routes/auth.ts:7` | Импорт `getIO` из `../socket` |
| `server/src/routes/auth.ts:62-68` | `emit('new_user', ...)` после регистрации |
| `server/src/routes/memberships.ts:5` | Импорт `getIO` из `../socket` |
| `server/src/routes/memberships.ts:273-283` | `emit('new_review', ...)` после отзыва |

## Клиентские файлы

| Файл | Описание |
|------|----------|
| `client/src/hooks/useNotificationQueue.ts` | Хук очереди уведомлений |
| `client/src/components/ui/NotificationCardStack.tsx` | Компонент стека карточек |
| `client/src/layouts/MainLayout.tsx:15,212` | Интеграция |
