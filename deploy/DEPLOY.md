# 🚀 Деплой SPORT LOUNGE на VPS — Пошаговая Инструкция

Эта инструкция проведёт вас через полный деплой приложения SPORT LOUNGE на VPS с нуля. 
Даже если вы новичок — следуйте каждому шагу, и сайт заработает.

---

## 1. Требования к VPS

| Параметр | Минимум | Рекомендация |
|----------|---------|--------------|
| ОС | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |
| RAM | 1 ГБ | 2 ГБ |
| CPU | 1 ядро | 2 ядра |
| Диск | 20 ГБ SSD | 40 ГБ SSD |
| Сеть | Публичный IPv4 | + IPv6 |

**Рекомендуемые провайдеры:** Timeweb Cloud, Selectel, DigitalOcean, Hetzner.

---

## 2. Первоначальная настройка сервера

```bash
# Подключитесь к серверу
ssh root@ваш_IP_адрес

# Обновите систему
apt update && apt upgrade -y

# Установите базовые утилиты
apt install -y curl wget git build-essential
```

---

## 3. Установка Node.js 20.x

```bash
# Добавьте репозиторий NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -

# Установите Node.js
apt install -y nodejs

# Проверьте версии
node -v   # Должно показать v20.x.x
npm -v    # Должно показать 10.x.x
```

---

## 4. Установка MongoDB

### Вариант A: Локальная MongoDB (на VPS)

```bash
# Импортируйте GPG-ключ MongoDB
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
  gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Добавьте репозиторий
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] \
  https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
  tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Установите MongoDB
apt update && apt install -y mongodb-org

# Запустите и включите автозагрузку
systemctl start mongod
systemctl enable mongod

# Проверьте статус
systemctl status mongod
```

### Вариант B: MongoDB Atlas (облако, бесплатно)

1. Зарегистрируйтесь на [cloud.mongodb.com](https://cloud.mongodb.com)
2. Создайте бесплатный кластер (M0 Free Tier)
3. Добавьте IP вашего VPS в Network Access → IP Whitelist
4. Создайте пользователя в Database Access
5. Скопируйте строку подключения (Connection String) — она понадобится в `.env`

---

## 5. Установка PM2 и Nginx

```bash
# PM2 — менеджер процессов для Node.js
npm install -g pm2

# Nginx — веб-сервер и реверс-прокси
apt install -y nginx

# Запустите и включите автозагрузку
systemctl start nginx
systemctl enable nginx
```

---

## 6. Клонирование и настройка проекта

```bash
# Создайте директорию для проекта
mkdir -p /var/www/sport-lounge
cd /var/www/sport-lounge

# Вариант 1: Git clone (если проект в репозитории)
git clone https://ваш-репозиторий.git .

# Вариант 2: Скопируйте файлы с локальной машины
# На ВАШЕМ компьютере:
scp -r sport-lounge/* root@ваш_IP:/var/www/sport-lounge/
```

---

## 7. Настройка переменных окружения

```bash
cd /var/www/sport-lounge/server

# Создайте .env файл
cp .env.example .env
nano .env
```

Заполните `.env`:

```env
# Порт сервера (Nginx проксирует сюда)
PORT=5000

# Строка подключения к MongoDB
# Локальная:
MONGO_URI=mongodb://localhost:27017/sport-lounge
# Или Atlas:
# MONGO_URI=mongodb+srv://user:password@cluster.xxxxx.mongodb.net/sport-lounge

# Секретный ключ для JWT (ОБЯЗАТЕЛЬНО ЗАМЕНИТЕ!)
JWT_SECRET=замените-на-длинный-случайный-ключ-минимум-32-символа

# Разрешённые домены для CORS
ALLOWED_ORIGINS=https://example.com,https://www.example.com

# Telegram бот (опционально)
TELEGRAM_TOKEN=8569759144:AAEpmyJthuhgJ2qCAFt_jz63TN1lwlnYHIs

# Среда
NODE_ENV=production
```

### Описание переменных:

| Переменная | Описание |
|-----------|----------|
| `PORT` | Порт, на котором слушает Express-сервер. Nginx проксирует запросы сюда |
| `MONGO_URI` | Строка подключения к MongoDB. Для Atlas используйте формат `mongodb+srv://` |
| `JWT_SECRET` | Секретный ключ для подписи JWT-токенов. **Должен быть уникальным и длинным!** |
| `ALLOWED_ORIGINS` | Список доменов через запятую, с которых разрешены API-запросы (CORS) |
| `TELEGRAM_TOKEN` | Токен Telegram-бота для уведомлений о заказах (опционально) |
| `NODE_ENV` | Среда выполнения: `development` или `production` |

---

## 8. Сборка бэкенда

```bash
cd /var/www/sport-lounge/server

# Установите зависимости
npm install

# Скомпилируйте TypeScript → JavaScript
npm run build

# Заполните базу тестовыми данными (опционально)
npm run seed

# Проверьте, что сервер запускается
node dist/server.js
# Ctrl+C чтобы остановить
```

---

## 9. Сборка фронтенда

```bash
cd /var/www/sport-lounge/client

# Установите зависимости
npm install

# Соберите production-бандл
# ВАЖНО: Укажите URL вашего API!
VITE_API_URL=https://example.com npm run build

# Результат → папка /client/dist/
ls dist/
# Должны увидеть: index.html, assets/
```

---

## 10. Запуск через PM2

```bash
cd /var/www/sport-lounge

# Запустите сервер через PM2
pm2 start deploy/ecosystem.config.js

# Проверьте статус
pm2 status

# Посмотрите логи
pm2 logs sport-lounge

# Настройте автозапуск после перезагрузки
pm2 startup
pm2 save
```

---

## 11. Настройка Nginx

```bash
# Скопируйте конфиг
cp /var/www/sport-lounge/deploy/nginx.conf /etc/nginx/sites-available/sport-lounge

# Замените example.com на ваш домен
nano /etc/nginx/sites-available/sport-lounge

# Активируйте конфиг
ln -s /etc/nginx/sites-available/sport-lounge /etc/nginx/sites-enabled/

# Удалите дефолтный конфиг
rm /etc/nginx/sites-enabled/default

# Проверьте синтаксис
nginx -t

# Перезагрузите Nginx
systemctl reload nginx
```

---

## 12. Настройка домена и SSL

### Домен

1. В панели управления доменом (Reg.ru, Cloudflare, и т.д.) создайте **A-запись**:
   - Тип: `A`
   - Имя: `@` (или `example.com`)
   - Значение: `IP_адрес_вашего_VPS`
   - TTL: 3600

2. (Опционально) Создайте ещё одну A-запись для `www`:
   - Тип: `A`
   - Имя: `www`
   - Значение: `IP_адрес_вашего_VPS`

3. Подождите 5-30 минут для распространения DNS.

### SSL (HTTPS) через Certbot

```bash
# Установите Certbot
apt install -y certbot python3-certbot-nginx

# Получите SSL-сертификат (замените example.com!)
certbot --nginx -d example.com -d www.example.com

# Certbot автоматически:
# - Получит сертификат от Let's Encrypt
# - Обновит nginx.conf с путями к сертификатам
# - Настроит автообновление

# Проверьте автообновление
certbot renew --dry-run
```

---

## 13. Проверка работоспособности

### Чек-лист:

- [ ] **Сайт открывается:** перейдите на `https://example.com`
- [ ] **Главная страница:** видна лента с постами и слайдер сторис
- [ ] **Логин:** перейдите на `/login`, войдите как `admin@sportlounge.com` / `admin123`
- [ ] **Админ-панель:** после логина перейдите на `/admin` — видна статистика
- [ ] **Создание поста:** в `/admin/posts` загрузите фото через drag-and-drop
- [ ] **Загрузка файлов:** изображение отображается в ленте
- [ ] **Миксы:** в `/admin/mixes` создайте, отредактируйте и удалите микс
- [ ] **Акции:** в `/admin/promos` создайте акцию с изображением
- [ ] **Сторис:** в `/admin/stories` добавьте сторис и проверьте сортировку drag-and-drop
- [ ] **Приглашения:** создайте приглашение и нажмите «Опубликовать» — должен появиться баннер
- [ ] **WebSocket:** при публикации приглашения на главной странице появляется уведомление
- [ ] **HTTPS:** замок в адресной строке браузера

---

## 14. Мониторинг и обслуживание

```bash
# Смотреть логи в реальном времени
pm2 logs sport-lounge

# Статус всех процессов
pm2 status

# Мониторинг ресурсов
pm2 monit

# Перезапустить после обновления кода
cd /var/www/sport-lounge/server
npm run build
pm2 restart sport-lounge

# Обновить фронтенд
cd /var/www/sport-lounge/client
npm run build

# Проверить автозапуск
pm2 startup
pm2 save

# Бэкап базы данных (MongoDB)
mongodump --db sport-lounge --out /backup/$(date +%Y%m%d)
```

---

## 15. Устранение проблем

| Проблема | Решение |
|----------|---------|
| Сайт не открывается | Проверьте: `pm2 status`, `systemctl status nginx`, DNS |
| 502 Bad Gateway | Сервер не запущен: `pm2 restart sport-lounge` |
| Ошибка загрузки файлов | Проверьте права: `chmod 755 /var/www/sport-lounge/server/uploads` |
| MongoDB не подключается | Проверьте: `systemctl status mongod`, строку `MONGO_URI` в `.env` |
| CORS ошибки | Обновите `ALLOWED_ORIGINS` в `.env` |
| SSL не работает | Перезапустите: `certbot renew && systemctl reload nginx` |

---

> **🎉 Готово!** Ваш SPORT LOUNGE теперь работает на VPS с SSL, WebSocket, загрузкой файлов и админ-панелью.
