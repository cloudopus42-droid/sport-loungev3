-- Migration 007: Admin user management columns
-- Добавляет колонки для админского управления пользователями.

ALTER TABLE users ADD COLUMN IF NOT EXISTS personal_price INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_note TEXT;
