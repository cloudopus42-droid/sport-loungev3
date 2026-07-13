-- =====================================================
-- Sport Lounge — Консолидированный SQL всех миграций
-- Выполните в Supabase Dashboard → SQL Editor
-- =====================================================

-- ── 002: Smart Features ──────────────────────────────
CREATE TABLE IF NOT EXISTS smart_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO smart_features (feature_key, name, description, enabled, is_public) VALUES
  ('ai_recommendations', 'ИИ-рекомендации', 'Персонализированные рекомендации на основе ИИ', false, true),
  ('loyalty_program', 'Программа лояльности', 'Баллы, уровни и привилегии для постоянных клиентов', false, true),
  ('push_notifications', 'Push-уведомления', 'Уведомления о статусе заказа и акциях', false, false),
  ('referral_system', 'Реферальная система', 'Приглашайте друзей и получайте бонусы', false, true),
  ('birthday_bonus', 'Именинный бонус', 'Автоматический бонус в день рождения', false, true),
  ('advanced_analytics', 'Расширенная аналитика', 'Детальная статистика и отчёты для администратора', false, false),
  ('auto_restock', 'Авто-заказ табака', 'Автоматическое создание заявок на пополнение табака', false, false),
  ('telegram_notifications', 'Telegram-уведомления', 'Уведомления о заказах через Telegram-бота', false, false),
  ('concierge_chat', 'Консьерж-чат', 'Чат с поддержкой в реальном времени', false, true),
  ('dynamic_pricing', 'Динамическое ценообразование', 'Автоматическая корректировка цен', false, false),
  ('ai_sommelier', 'ИИ-Сомелье', 'Рекомендации напитков к кальяну на основе вкусовых предпочтений', false, true),
  ('auto_discount_night', 'Ночная скидка', 'Автоматическое применение скидки 15% на заказы после 23:00', false, false),
  ('qr_menu', 'QR-меню', 'Гости сканируют QR-код на столе для просмотра меню и заказа', true, true)
ON CONFLICT (feature_key) DO NOTHING;

-- ── 003: Admin Telegram Chats ────────────────────────
CREATE TABLE IF NOT EXISTS admin_telegram_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id BIGINT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_admin_telegram_chats_chat_id ON admin_telegram_chats (chat_id);

-- ── 003b: Drop legacy seat_configs ──────────────────
DROP TABLE IF EXISTS seat_configs CASCADE;

-- ── 004: Tobacco Inventory columns on mixes ─────────
ALTER TABLE mixes
  ADD COLUMN IF NOT EXISTS brand VARCHAR(255) DEFAULT '',
  ADD COLUMN IF NOT EXISTS flavor VARCHAR(255) DEFAULT '',
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unit VARCHAR(20) DEFAULT 'gram',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS min_stock_threshold INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS auto_reorder_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ── 005: User Mixes ─────────────────────────────────
CREATE TABLE IF NOT EXISTS user_mixes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  flavors TEXT[] NOT NULL DEFAULT '{}',
  percentages JSONB DEFAULT '{}',
  strength VARCHAR(50) DEFAULT 'medium',
  notes TEXT DEFAULT '',
  source VARCHAR(50) DEFAULT 'ai',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_mixes_user_id ON user_mixes(user_id);

-- ── 006: Orders strength + hookah_mix ────────────────
ALTER TABLE orders ADD COLUMN IF NOT EXISTS strength VARCHAR(20) DEFAULT 'medium';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS hookah_mix TEXT DEFAULT '';

-- ── 007: Users admin columns ────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS personal_price INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_note TEXT;

-- ── 008: Weight grams ───────────────────────────────
ALTER TABLE mixes ADD COLUMN IF NOT EXISTS weight_grams INTEGER DEFAULT 50;

-- ── 009: Seed default tobaccos ──────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM mixes LIMIT 1) THEN
    INSERT INTO mixes (name, manufacturer, description, flavors, strength, status, weight_grams) VALUES
      ('Base', 'Darkside', 'Классическая крепкая линейка с насыщенным вкусом', ARRAY['Базилик', 'Мята', 'Грейпфрут'], 8, 'active', 50),
      ('Banana', 'Must Have', 'Сладкий банановый вкус с кремовыми нотками', ARRAY['Банан', 'Крем', 'Ваниль'], 6, 'active', 50),
      ('Watermelon', 'Element', 'Освежающий арбузный микс для летнего настроения', ARRAY['Арбуз', 'Мята', 'Лёд'], 5, 'active', 100),
      ('Kiwi', 'Black Burn', 'Кислинка киви с лёгкой сладостью', ARRAY['Киви', 'Крыжовник', 'Лайм'], 7, 'active', 100),
      ('Peach', 'Tangiers', 'Премиальный персиковый вкус с долгим послевкусием', ARRAY['Персик', 'Абрикос', 'Мёд'], 9, 'active', 50),
      ('Mango', 'Duft', 'Тропический манго с лёгкими цветочными нотками', ARRAY['Манго', 'Маракуйя', 'Цветы'], 4, 'active', 50);
  END IF;
END $$;

-- ── 010: Flavor config (emoji, category, color) ─────
ALTER TABLE mixes ADD COLUMN IF NOT EXISTS emoji VARCHAR(10) DEFAULT '';
ALTER TABLE mixes ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'Основные';
ALTER TABLE mixes ADD COLUMN IF NOT EXISTS color VARCHAR(20) DEFAULT '';

-- ── 011: Tobacco Transactions ───────────────────────
CREATE TABLE IF NOT EXISTS tobacco_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mix_id UUID NOT NULL REFERENCES mixes(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('purchase', 'write-off', 'adjustment')),
  quantity INTEGER NOT NULL DEFAULT 0,
  unit VARCHAR(20) NOT NULL DEFAULT 'gram',
  price DECIMAL(10,2) DEFAULT 0,
  notes TEXT DEFAULT '',
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tobacco_transactions_mix_id ON tobacco_transactions(mix_id);
CREATE INDEX IF NOT EXISTS idx_tobacco_transactions_type ON tobacco_transactions(type);
CREATE INDEX IF NOT EXISTS idx_tobacco_transactions_created_at ON tobacco_transactions(created_at DESC);

-- ── 012: Restock Requests ───────────────────────────
CREATE TABLE IF NOT EXISTS restock_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tobacco_id UUID NOT NULL REFERENCES mixes(id) ON DELETE CASCADE,
  tobacco_name TEXT NOT NULL DEFAULT '',
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed', 'rejected')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_restock_requests_status ON restock_requests(status);
CREATE INDEX IF NOT EXISTS idx_restock_requests_tobacco_id ON restock_requests(tobacco_id);
CREATE INDEX IF NOT EXISTS idx_restock_requests_created_at ON restock_requests(created_at DESC);

-- ── V7: Performance Indexes ─────────────────────────
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user_id_created ON orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_mix_id ON reviews(mix_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date_status ON bookings(date, status);
CREATE INDEX IF NOT EXISTS idx_mixes_category ON mixes(category);
CREATE INDEX IF NOT EXISTS idx_mixes_available ON mixes(is_active);
CREATE INDEX IF NOT EXISTS idx_mixes_stock ON mixes(stock_quantity);
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_loyalty_tx_user ON loyalty_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_graph_source ON knowledge_graph(source_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_graph_target ON knowledge_graph(target_id);
CREATE INDEX IF NOT EXISTS idx_stories_active ON stories(is_active, expires_at);

-- ── Done ────────────────────────────────────────────
SELECT 'All migrations applied successfully!' AS result;
