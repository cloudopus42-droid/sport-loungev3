# Bug Hunter Skill

> Навык автоматического поиска, классификации и исправления багов в SPORT LOUNGE.

## 1. Классификация багов

### 1.1 UI/UX баги (категория `ui`)

| Код | Описание | Приоритет | Автофикс |
|-----|----------|-----------|----------|
| `UI-COLOR` | Несоответствие палитре Nocturnal Noir (не `#0b0807`, `#FFBF00`, `#B08D57`, `#0D0F13`, `#F5F5F5`, `#9D9D9D`) | high | да |
| `UI-FONT` | Неправильный шрифт (не Playfair Display для heading, не Inter для body) | high | да |
| `UI-ARIA` | Отсутствие aria-атрибутов у интерактивных элементов | medium | да |
| `UI-HOVER` | Отсутствие hover/active/disabled-стилей у кнопок | medium | да |
| `UI-FOCUS` | Отсутствие focus-visible стилей у кликабельных элементов | high | да |
| `UI-CONTAINER` | Элемент выходит за границы родителя (overflow-x) | high | нет |
| `UI-ANIM` | «Дёрганая» анимация (не 60fps, без will-change, без spring-кривых) | medium | да |
| `UI-EMPTY` | Нет состояния empty (пустой список без сообщения) | low | да |
| `UI-LOADING` | Нет состояния загрузки (лоадер/скелетон) | medium | да |
| `UI-ERROR` | Нет состояния ошибки при фейле API/промиса | high | да |
| `UI-GLASS` | Glassmorphism не соответствует паттерну `rgba(15,12,10,0.5)` + `blur(20px)` + `border rgba(255,191,0,0.15)` | medium | да |
| `UI-GOLD-DUAL` | Использован #FFBF00 там, где нужен #B08D57 (или наоборот) | medium | да |
| `UI-TOUCH` | touch-цель меньше 44px | medium | да |

### 1.2 Функциональные баги (категория `func`)

| Код | Описание | Приоритет | Автофикс |
|-----|----------|-----------|----------|
| `FUNC-PROMISE` | Отсутствует .catch() или try/catch у асинхронной операции | high | да |
| `FUNC-FORM` | Форма без валидации (отсутствует required/pattern у input) | high | да |
| `FUNC-STATE` | UI не обновляется после изменения состояния (нет setState) | high | нет |
| `FUNC-LOADING` | Нет проверки loading-состояния перед рендером данных | high | да |
| `FUNC-NULL` | Обращение к свойству null/undefined объекта (потенциальный crash) | critical | да |
| `FUNC-EMPTY-ARR` | .map()/.filter() без проверки на пустой массив | high | да |

### 1.3 Баги доступности (категория `a11y`)

| Код | Описание | Приоритет | Автофикс |
|-----|----------|-----------|----------|
| `A11Y-LABEL` | `<button>` или `<a>` без текстового содержимого и без aria-label | high | да |
| `A11Y-ALT` | `<img>` без alt-атрибута | high | да |
| `A11Y-ROLE` | Кликабельный div без role="button" | medium | да |
| `A11Y-FOCUS` | Отсутствие tabindex или focus management в модалках | high | нет |
| `A11Y-CONTRAST` | Контраст текста ниже 4.5:1 (WCAG AA) | high | да |

### 1.4 Баги адаптивности (категория `rwd`)

| Код | Описание | Приоритет | Автофикс |
|-----|----------|-----------|----------|
| `RWD-CONFLICT` | Элемент скрыт на мобильных И на десктопе (не виден нигде) | medium | да |
| `RWD-HSCROLL` | Горизонтальный скролл на странице (overflow-x) | high | нет |
| `RWD-BREAK` | Ломается вёрстка на 360px или 768px | high | нет |
| `RWD-IMG` | Изображение без max-width: 100% | medium | да |

## 2. Эвристики поиска

### 2.1 UI-COLOR: Поиск несоответствия палитре

```regex
# Поиск hardcoded цветов, не входящих в палитру
# Исключить: #fff, #000, transparent, currentColor, inherit, rgba\(
# Исключить уже используемые: #0b0807, #FFBF00, #B08D57, #0D0F13, #F5F5F5, #9D9D9D, #8D6B3D, #C4A46B
(?<!var\(--)color:(?!.*(?:0b0807|FFBF00|B08D57|0D0F13|F5F5F5|9D9D9D|8D6B3D|C4A46B))#(?:[0-9a-fA-F]{3}){1,2}\b
```

### 2.2 FUNC-PROMISE: Поиск непойманных промисов

```regex
# async функция без try/catch
async\s+\w+\s*\([^)]*\)\s*\{[^}]*\bawait\b[^}]*\}(?!\s*\.catch)

# Промис без catch
\.then\s*\([^)]*\)\s*(?!\s*\.catch)
```

### 2.3 FUNC-NULL: Поиск потенциальных обращений к null

```regex
# Обращение к свойству без optional chaining внутри JSX
\{[\w.]+\.(?!\?)(\w+)\}
(?<!\?)\.[a-zA-Z_]\w*(?=\.(?!\?)|\s*\))
```

### 2.4 A11Y-LABEL: Поиск кнопок/ссылок без aria-label

```regex
<button[^>]*(?!(?:[^>]*aria-label))>[^<]*</button>  # если внутри пусто или иконка
<a[^>]*href="[^"]*"[^>]*(?!(?:[^>]*aria-label))>\s*<svg
```

### 2.5 UI-GOLD-DUAL: Поиск неправильного использования золота

```regex
# #FFBF00 на фоновых/декоративных элементах (должен быть #B08D57)
# #B08D57 на CTA кнопках/активных состояниях (должен быть #FFBF00)
bg.*#FFBF00  # фоновый FFBF00 подозрителен — обычно фон B08D57
text.*#B08D57  # текстовый B08D57 подозрителен — текст чаще FFBF00
```

### 2.6 FUNC-EMPTY-ARR: Поиск .map() без проверки

```regex
\{[\w]+\.map\(  # без проверки {arr?.length && arr.map(}
(?<!\.length)\s*&&\s+\w+\.map\(  # нет .length перед .map
```

## 3. Методы автофикса

### 3.1 Добавление aria-label

Паттерн: `<button onClick={...}><Icon /></button>` → `<button onClick={...} aria-label="..."><Icon /></button>`

Из имени иконки или контекста извлекается label (IconName → "Имя").

### 3.2 Исправление цветов

- `bg-#FFBF00` на декоративных → `bg-[#B08D57]`
- `text-#B08D57` на активных → `text-[#FFBF00]`
- Любой #070707 → `bg-dark-bg`

### 3.3 Добавление обработки ошибок

```typescript
// До
const data = await fetchAPI();

// После
let data;
try {
  data = await fetchAPI();
} catch (err) {
  console.error('[BugHunter] fetchAPI failed:', err);
  setError('Ошибка загрузки');
}
```

### 3.4 Добавление optional chaining

```typescript
// До
{items.map(item => <div>{item.name}</div>)}

// После
{items?.map(item => <div>{item.name}</div>)}
```

### 3.5 Добавление loading/error/empty состояний

Проверка наличия всех трёх состояний в компонентах, использующих API:

```typescript
// Шаблон компонента с API
if (loading) return <Skeleton />;
if (error) return <ErrorState message={error} onRetry={refetch} />;
if (!data || data.length === 0) return <EmptyState message="Нет данных" />;
```

### 3.6 Исправление glassmorphism

```css
/* До */
background: rgba(0,0,0,0.3);
backdrop-filter: blur(10px);
border: 1px solid rgba(255,255,255,0.1);

/* После */
background: rgba(15, 12, 10, 0.5);
backdrop-filter: blur(20px);
border: 1px solid rgba(255, 191, 0, 0.15);
```

## 4. Порядок сканирования

Каждый цикл сканирования проходит этапы:

1. **Сбор** — обход файлов в `client/src/` (`.tsx`, `.ts`, `.css`)
2. **Классификация** — прогон через все эвристики
3. **Оценка** — расчёт уверенности (0-100%)
4. **Фикс** — если confidence > 95%, применить шаблон
5. **Верификация** — `npm run build` для проверки сборки
6. **Репорт** — запись в лог, отправка в шину

### Шкала уверенности

| Условие | Процент |
|---------|---------|
| Точное совпадение с шаблоном + нет побочных эффектов | 100% |
| Совпадение с шаблоном + есть контекст | 95-99% |
| Совпадение с шаблоном, но контекст неполный | 70-94% |
| Подозрение, но нужен ручной анализ | < 70% |

## 5. Интеграция с message-bus

BugHunter подписывается на события:
- `commit` — при новом коммите запускает полный цикл
- `deploy` — после деплоя проверяет критические баги
- `ui_change` — при изменении UI-компонентов проверяет RWD

Отправляет события:
- `bug_found` — при обнаружении бага (confidence, category, file, line)
- `bug_fixed` — после успешного фикса и сборки
- `bug_escalated` — если нужен ручной фикс (issue в Obsidian)
- `report_daily` — ежедневный отчёт

## 6. Файлы лога

BugHunter ведёт лог в `bughunter/log.md` со следующей структурой:

```markdown
# BugHunter Log

## 2026-06-24

### 14:32 — Цикл #142
- ✅ UI-COLOR: bg-#070707 → bg-dark-bg (BookingPage.tsx:182)
- ❌ FUNC-NULL: обращение к user.name (ProfilePage.tsx:45) — ЭСКАЛАЦИЯ
  > confidence 68% — нужна ручная проверка
- ✅ A11Y-LABEL: добавлен aria-label к кнопке закрытия (LoyaltyPage.tsx:88)

**Статистика**: найдено 3, исправлено 2, эскалировано 1
```
