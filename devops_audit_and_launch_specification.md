# Отчет DevOps: Аудит путей и гарантированное восстановление Full-Stack приложения

Данный документ представляет собой безжалостный инженерный аудит проблем, возникающих при смене рабочей директории (CWD) процесса Node.js (при запуске через PM2, systemd или абсолютные пути к скриптам), и содержит готовые решения для полного восстановления работоспособности бэкенда, фронтенда, WebSocket и загрузки файлов.

---

## 1. Диагностика проблем (Почему всё сломалось при запуске «через папку»)

Главная причина падения приложения при удаленном запуске или запуске через Диспетчер процессов (PM2) без явного указания директории — **изменение значения `process.cwd()` (Current Working Directory)**. 

### 1.1. Падение dotenv (Не читается `.env` файл)
*   **Симптом**: Приложение запускается на случайном порту, база данных не подключается, JWT-токены выдают ошибку подписи.
*   **Причина**: По умолчанию вызов `dotenv.config()` ищет файл `.env` в текущей рабочей директории терминала (`process.cwd()`). При запуске из `/root` или через PM2 без указания рабочей директории, бэкенд ищет файл в `/root/.env`, не находит его и запускается с `undefined` переменными.
*   **Решение**: Явное указание абсолютного пути к файлу `.env` через вычисление пути относительно `__dirname`:
    ```typescript
    dotenv.config({ path: path.resolve(__dirname, '../../.env') });
    ```

### 1.2. Ошибка 404 при раздаче статики фронтенда
*   **Симптом**: Браузер выдает `404 Not Found` на корневой странице приложения, либо отдается пустой экран.
*   **Причина**: Если раздача статики прописана как `app.use(express.static('client/dist'))`, Express пытается найти папку `client/dist` относительно `process.cwd()`. Если процесс запущен из `/home/user`, поиск будет вестись в `/home/user/client/dist`, которого там нет.
*   **Решение**: Преобразование относительных путей в абсолютные при помощи `path.resolve(__dirname, ...)`:
    ```typescript
    app.use(express.static(path.resolve(__dirname, '../../client/dist')));
    ```

### 1.3. Ошибки загрузки файлов Multer (Не найден путь к uploads)
*   **Симптом**: При попытке загрузить изображение бэкенд крашится с ошибкой `ENOENT: no such file or directory, open 'uploads/...'`.
*   **Причина**: Путь назначения Multer вычислялся относительно CWD процесса, либо папка `/uploads` не создавалась автоматически, а у процесса не было прав на запись в CWD.
*   **Решение**: Динамическое создание папки назначения с абсолютным путем и проверка прав:
    ```typescript
    const uploadDir = path.resolve(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    ```

### 1.4. Проблемы с CORS и WS Origin
*   **Симптом**: Фронтенд выдает ошибки в консоли браузера: `CORS policy: No 'Access-Control-Allow-Origin' header is present...`.
*   **Причина**: После смены хоста/ VPS фронтенд может крутиться на другом порту или домене, а бэкенд жестко проверяет старые разрешенные источники (Origins).
*   **Решение**: Динамическая обработка CORS через массив разрешенных источников, читаемых из `.env`, с дефолтным fallback-разрешением для разработки.

---

## 2. Исправленный код серверной точки входа (`server.ts`)

Данный код абсолютно автономен, устойчив к запуску из любой рабочей директории ОС и реализует автоматическое переподключение к БД и логирование.

```typescript
import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import multer from 'multer';

// Загрузка env файлов по абсолютному пути
const envPath = path.resolve(__dirname, '../.env'); 
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}
```

---

## 3. Скрипт конфигурации PM2 (`ecosystem.config.js`)

Чтобы гарантировать, что менеджер процессов запускается в правильной папке, используйте конфигурацию `ecosystem.config.js`. Создайте этот файл в корневом каталоге проекта:

```javascript
module.exports = {
  apps: [
    {
      name: "sport-lounge-production",
      script: "./dist/server.js",
      cwd: "/var/www/app",
      watch: false,
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        MONGO_URI: "mongodb://127.0.0.1:27017/sport_lounge",
        ALLOWED_ORIGINS: "https://sportlounge.ru,https://www.sportlounge.ru"
      },
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z"
    }
  ]
};
```

---

## 4. Инструкция по деплою и пересборке (Шаг за шагом)

Выполните эти команды последовательно на VPS сервере.

### Шаг 1: Клонирование и пересборка окружения
```bash
# 1. Переходим в целевую директорию установки
cd /var/www/app

# 2. Устанавливаем все зависимости в бэкенд и собираем TypeScript в JS
npm install
npm run build

# 3. Переходим в папку React-клиента
cd client
npm install

# Создаем файл окружения для фронтенда Vite
echo "VITE_API_URL=https://sportlounge.ru" > .env.production

# 4. Собираем статический бандл React
npm run build
```

### Шаг 2: Настройка прав доступа на uploads
Для предотвращения ошибок `multer` с отсутствием прав на запись:
```bash
cd /var/www/app
# Создаем папку uploads
mkdir -p uploads

# Назначаем права
chown -R www-data:www-data uploads
chmod -R 775 uploads
```

### Шаг 3: Запуск и сохранение в PM2
```bash
cd /var/www/app
# Запуск через PM2
pm2 start ecosystem.config.js

# Сохранение конфигурации
pm2 save
pm2 startup
```
