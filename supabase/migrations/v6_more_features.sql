-- Additional smart features (11-13)
INSERT INTO smart_features (feature_key, name, description, enabled, is_public) VALUES
  ('ai_sommelier', 'ИИ-Сомелье', 'Рекомендации напитков к кальяну на основе вкусовых предпочтений', false, true),
  ('auto_discount_night', 'Ночная скидка', 'Автоматическое применение скидки 15% на заказы после 23:00', false, false),
  ('qr_menu', 'QR-меню', 'Гости сканируют QR-код на столе для просмотра меню и заказа', true, true)
ON CONFLICT (feature_key) DO NOTHING;
