-- Migration 002: Smart Features
-- Creates the smart_features table and seeds 10 initial features.

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
  ('dynamic_pricing', 'Динамическое ценообразование', 'Автоматическая корректировка цен', false, false)
ON CONFLICT (feature_key) DO NOTHING;
