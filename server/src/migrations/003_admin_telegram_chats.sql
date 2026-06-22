-- Migration 003: Admin Telegram Chats
-- Сохраняет chat_id администраторов Telegram, чтобы уведомления доставлялись даже после перезапуска сервера.

CREATE TABLE IF NOT EXISTS admin_telegram_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id BIGINT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индекс для быстрого поиска по chat_id
CREATE INDEX IF NOT EXISTS idx_admin_telegram_chats_chat_id ON admin_telegram_chats (chat_id);

COMMENT ON TABLE admin_telegram_chats IS 'Хранит chat_id администраторов Telegram для уведомлений админ-бота';
