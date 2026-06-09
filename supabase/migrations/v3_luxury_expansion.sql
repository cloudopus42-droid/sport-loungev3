-- ==========================================
-- SPORT LOUNGE V3.0 DATABASE EXPANSION SCHEMA
-- ==========================================

-- 1. Club Memberships Table
CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level VARCHAR(50) UNIQUE NOT NULL, -- 'bronze', 'silver', 'gold', 'black', 'diamond'
  name VARCHAR(100) NOT NULL,
  discount_percent INTEGER DEFAULT 0,
  priority_points INTEGER DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Users Membership Linking Table
CREATE TABLE IF NOT EXISTS users_membership (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  membership_id UUID REFERENCES memberships(id) ON DELETE RESTRICT,
  points INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Loyalty Transactions Log Table
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  points_delta INTEGER NOT NULL,
  description TEXT NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'earn', 'redeem'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Achievements System Table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL, -- 'smoke_master', 'vip_resident', 'diamond_guest', 'elite_member'
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  points_reward INTEGER DEFAULT 0,
  badge_icon TEXT, -- css class or lucide name
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Achievements Unlocking Mapping Table
CREATE TABLE IF NOT EXISTS achievement_unlocks (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, achievement_id)
);

-- 6. Favorite Tables Tracking Table
CREATE TABLE IF NOT EXISTS favorite_tables (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  seat_id VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, seat_id)
);

-- 7. Favorite Hookah Flavors Table
CREATE TABLE IF NOT EXISTS favorite_flavors (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  flavor_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, flavor_name)
);

-- 8. Notifications Logging Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  type VARCHAR(50) DEFAULT 'info', -- 'info', 'booking', 'achievement', 'loyalty'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. General Activity Logs Table (Security and BI audit)
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(255) NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. BI Analytics Events Table
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name VARCHAR(255) NOT NULL,
  event_data JSONB DEFAULT '{}',
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Guest Reviews Table (Mapped uniquely per booking)
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE UNIQUE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5) NOT NULL,
  text TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. Review Replies Table (For managers/owners response)
CREATE TABLE IF NOT EXISTS review_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 13. Promo Code Redemptions Table
CREATE TABLE IF NOT EXISTS promo_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  promo_id UUID REFERENCES promos(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- SEED DATA FOR V3.0 PLATFORM
-- ==========================================

-- Seed Club Memberships
INSERT INTO memberships (level, name, discount_percent, priority_points, description)
VALUES 
  ('bronze', 'Bronze Member', 0, 0, 'Начальный уровень клубных привилегий.'),
  ('silver', 'Silver Member', 5, 100, 'Серебряный член клуба: 5% скидка на заказы и доступ к ранней брони.'),
  ('gold', 'Gold Member', 10, 500, 'Золотой статус: 10% скидка, персональный кальянщик и выбор любимой зоны.'),
  ('black', 'Black Elite', 15, 1500, 'Черная карта: 15% постоянная скидка, приоритетное бронирование VIP комнат.'),
  ('diamond', 'Diamond Resident', 20, 5000, 'Алмазный резидент: 20% скидка на всё, бесплатные авторские миксы и эксклюзивные приглашения.')
ON CONFLICT (level) DO UPDATE 
SET name = EXCLUDED.name, discount_percent = EXCLUDED.discount_percent, description = EXCLUDED.description;

-- Seed Achievements
INSERT INTO achievements (code, name, description, points_reward, badge_icon)
VALUES 
  ('smoke_master', 'Кальянный Мастер', 'Оформите 5 заказов с уникальными вкусовыми миксами.', 100, 'Flame'),
  ('vip_resident', 'VIP Резидент', 'Забронируйте роскошный столик в VIP-кабинете.', 200, 'Crown'),
  ('diamond_guest', 'Алмазный Гость', 'Достигните высшего статуса членства Diamond Resident в клубе.', 500, 'Sparkles'),
  ('elite_member', 'Элитный Член Клуба', 'Оставьте свой первый отзыв о качестве обслуживания.', 50, 'MessageSquare')
ON CONFLICT (code) DO UPDATE 
SET name = EXCLUDED.name, description = EXCLUDED.description, points_reward = EXCLUDED.points_reward, badge_icon = EXCLUDED.badge_icon;
