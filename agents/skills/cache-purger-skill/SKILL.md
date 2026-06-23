# Cache Purger Skill

> Навык инвалидации кеша после деплоя.

## 1. Возможности
- Инвалидация service worker cache version
- Синхронизация build version в localStorage
- Опциональный CDN purge (Cloudflare API)
- Мониторинг устаревших кешей

## 2. Механизмы
- Чтение `version.json` из client/dist
- Запись новой версии в SW `CACHE_VERSION`
- Обновление статуса в `agents/status.json`

## 3. Когда срабатывает
- При изменении version.json (новый деплой)
- Каждые 60 секунд (плановая проверка)
- По сигналу SIGUSR2 (ручной вызов)
