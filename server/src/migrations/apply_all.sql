-- =====================================================
-- Sport Lounge — Полный SQL: все таблицы + миграции
-- Supabase Dashboard → SQL Editor → Run
-- =====================================================

-- ══════════════════════════════════════════════════════
-- ОСНОВНЫЕ ТАБЛИЦЫ (из schema.sql)
-- ══════════════════════════════════════════════════════

-- users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) UNIQUE,
  name VARCHAR(255) DEFAULT '',
  avatar_url TEXT,
  role VARCHAR(20) DEFAULT 'guest',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- bookings
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TIME NOT NULL,
  guests INTEGER DEFAULT 2,
  status VARCHAR(20) DEFAULT 'pending',
  seat_zone VARCHAR(50),
  seat_number VARCHAR(20),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- mixes (табаки)
CREATE TABLE IF NOT EXISTS mixes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  manufacturer VARCHAR(255) NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  flavors TEXT[] DEFAULT '{}',
  strength INTEGER DEFAULT 5,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pending',
  total DECIMAL(10,2) DEFAULT 0,
  notes TEXT DEFAULT '',
  seat_zone VARCHAR(50),
  seat_number VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- order_status_history
CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL,
  note TEXT DEFAULT '',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- posts
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT DEFAULT '',
  image_url TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- post_likes
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- post_comments
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- promos
CREATE TABLE IF NOT EXISTS promos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  discount_percent INTEGER DEFAULT 0,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- showcases
CREATE TABLE IF NOT EXISTS showcases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  image_url TEXT,
  link TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- invitations
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id UUID REFERENCES users(id) ON DELETE CASCADE,
  invitee_phone VARCHAR(20),
  invitee_name VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- invitation_participants
CREATE TABLE IF NOT EXISTS invitation_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invitation_id UUID NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- stories
CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  caption TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- hookah_replacements
CREATE TABLE IF NOT EXISTS hookah_replacements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  mix_id UUID REFERENCES mixes(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  body TEXT DEFAULT '',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- knowledge_nodes
CREATE TABLE IF NOT EXISTS knowledge_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label VARCHAR(255) NOT NULL,
  type VARCHAR(50) DEFAULT 'concept',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- knowledge_edges
CREATE TABLE IF NOT EXISTS knowledge_edges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id UUID NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  relation VARCHAR(100) DEFAULT '',
  weight FLOAT DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════
-- РАСШИРЕНИЯ (v3 luxury)
-- ══════════════════════════════════════════════════════

-- reviews
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mix_id UUID REFERENCES mixes(id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  text TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- membershions
CREATE TABLE IF NOT EXISTS memberships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier VARCHAR(50) DEFAULT 'bronze',
  points INTEGER DEFAULT 0,
  since TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  UNIQUE(user_id)
);

-- users_membership
CREATE TABLE IF NOT EXISTS users_membership (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier VARCHAR(50) DEFAULT 'bronze',
  points INTEGER DEFAULT 0,
  since TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- loyalty_transactions
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- achievements
CREATE TABLE IF NOT EXISTS achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- achievement_unlocks
CREATE TABLE IF NOT EXISTS achievement_unlocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- favorite_tables
CREATE TABLE IF NOT EXISTS favorite_tables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seat_zone VARCHAR(50) NOT NULL,
  seat_number VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, seat_zone, seat_number)
);

-- favorite_flavors
CREATE TABLE IF NOT EXISTS favorite_flavors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mix_id UUID NOT NULL REFERENCES mixes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, mix_id)
);

-- review_replies
CREATE TABLE IF NOT EXISTS review_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- promo_redemptions
CREATE TABLE IF NOT EXISTS promo_redemptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  promo_id UUID NOT NULL REFERENCES promos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(promo_id, user_id)
);

-- activity_logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- analytics_events
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════
-- CRUD ТАБЛИЦЫ (серверные маршруты)
-- ══════════════════════════════════════════════════════

-- invoices
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- pages (CMS)
CREATE TABLE IF NOT EXISTS pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT DEFAULT '',
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- menu_items
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) DEFAULT '',
  description TEXT DEFAULT '',
  price DECIMAL(10,2) DEFAULT 0,
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- inventory (общий склад)
CREATE TABLE IF NOT EXISTS inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) DEFAULT '',
  quantity INTEGER DEFAULT 0,
  unit VARCHAR(20) DEFAULT 'piece',
  min_quantity INTEGER DEFAULT 0,
  price DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- admin_logs
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50),
  target_id UUID,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════
-- 002: Smart Features
-- ══════════════════════════════════════════════════════

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

-- ══════════════════════════════════════════════════════
-- 003: Admin Telegram Chats
-- ══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS admin_telegram_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id BIGINT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════
-- 004: Tobacco Inventory columns on mixes
-- ══════════════════════════════════════════════════════

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

-- ══════════════════════════════════════════════════════
-- 005: User Mixes
-- ══════════════════════════════════════════════════════

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

-- ══════════════════════════════════════════════════════
-- 006: Orders strength + hookah_mix
-- ══════════════════════════════════════════════════════

ALTER TABLE orders ADD COLUMN IF NOT EXISTS strength VARCHAR(20) DEFAULT 'medium';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS hookah_mix TEXT DEFAULT '';

-- ══════════════════════════════════════════════════════
-- 007: Users admin columns
-- ══════════════════════════════════════════════════════

ALTER TABLE users ADD COLUMN IF NOT EXISTS personal_price INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_note TEXT;

-- ══════════════════════════════════════════════════════
-- 008: Weight grams
-- ══════════════════════════════════════════════════════

ALTER TABLE mixes ADD COLUMN IF NOT EXISTS weight_grams INTEGER DEFAULT 50;

-- ══════════════════════════════════════════════════════
-- 010: Flavor config (emoji, category, color)
-- ══════════════════════════════════════════════════════

ALTER TABLE mixes ADD COLUMN IF NOT EXISTS emoji VARCHAR(10) DEFAULT '';
ALTER TABLE mixes ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'Основные';
ALTER TABLE mixes ADD COLUMN IF NOT EXISTS color VARCHAR(20) DEFAULT '';

-- ══════════════════════════════════════════════════════
-- 011: Tobacco Transactions
-- ══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS tobacco_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mix_id UUID NOT NULL REFERENCES mixes(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('purchase', 'write-off', 'adjustment')),
  quantity INTEGER NOT NULL DEFAULT 0,
  unit VARCHAR(20) NOT NULL DEFAULT 'gram',
  price DECIMAL(10,2) DEFAULT 0,
  notes TEXT DEFAULT '',
  performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════════
-- 012: Restock Requests
-- ══════════════════════════════════════════════════════

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

-- ══════════════════════════════════════════════════════
-- DROP legacy
-- ══════════════════════════════════════════════════════

DROP TABLE IF EXISTS seat_configs CASCADE;

-- ══════════════════════════════════════════════════════
-- PERFORMANCE INDEXES
-- ══════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user_id_created ON orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);
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
CREATE INDEX IF NOT EXISTS idx_mixes_is_active ON mixes(is_active);
CREATE INDEX IF NOT EXISTS idx_mixes_stock ON mixes(stock_quantity);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_loyalty_tx_user ON loyalty_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_restock_requests_status ON restock_requests(status);
CREATE INDEX IF NOT EXISTS idx_restock_requests_tobacco_id ON restock_requests(tobacco_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_edges_source ON knowledge_edges(source_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_edges_target ON knowledge_edges(target_id);
CREATE INDEX IF NOT EXISTS idx_stories_active ON stories(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_tobacco_transactions_mix_id ON tobacco_transactions(mix_id);
CREATE INDEX IF NOT EXISTS idx_tobacco_transactions_type ON tobacco_transactions(type);
CREATE INDEX IF NOT EXISTS idx_user_mixes_user_id ON user_mixes(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_telegram_chats_chat_id ON admin_telegram_chats(chat_id);

-- ── Done ────────────────────────────────────────────
SELECT 'All tables + migrations applied successfully!' AS result;
