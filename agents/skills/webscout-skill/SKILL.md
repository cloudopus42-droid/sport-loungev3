# WebScout Skill

> Навык веб-парсинга, кеширования и извлечения данных.

## 1. Возможности
- Парсинг HTML-страниц с извлечением title, description, текста, ссылок, изображений
- Кеширование результатов (TTL настраивается)
- Rate limiting (запросов в минуту)
- Stealth-режим (ротация User-Agent, заголовков)
- Соблюдение robots.txt
- Автоматическая очистка кеша

## 2. Структура кеша
- Директория: `agents/agents/webscout/cache/`
- Ключ: base64 URL
- Формат: `{ url, data, timestamp }`
- TTL: по умолчанию 1 час

## 3. Rate Limiting
- По умолчанию: 20 запросов/мин
- Настраивается в `config.json`
- Пер-домен ограничение
- Retry с exponential backoff при 429

## 4. Stealth
- Ротация 4 User-Agent
- `Accept-Language: en-US,en;q=0.9,ru;q=0.8`
- `Cache-Control: no-cache`
- Таймаут запроса: 15s

## 5. Команды шины
- `webscout:scrape { url }` — выполнить разовый парсинг
- `webscout:status` — получить статус
- `webscout:clear-cache` — очистить кеш
