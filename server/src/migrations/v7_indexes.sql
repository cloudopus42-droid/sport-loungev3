-- V7: Performance indexes
-- Add indexes for all frequently-queried columns to eliminate seq scans

BEGIN;

-- orders: most queried by status + created_at (queue display), user_id (my orders)
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user_id_created ON orders(user_id, created_at DESC);

-- post_likes: N+1 fix, queried by post_id + user_id
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);

-- reviews: queried by mix_id (aggregate), user_id, created_at
CREATE INDEX IF NOT EXISTS idx_reviews_mix_id ON reviews(mix_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- bookings: queried by user_id, date, status, date+status
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date_status ON bookings(date, status);

-- mixes: queried by category, is_active, stock
CREATE INDEX IF NOT EXISTS idx_mixes_category ON mixes(category);
CREATE INDEX IF NOT EXISTS idx_mixes_available ON mixes(is_active);
CREATE INDEX IF NOT EXISTS idx_mixes_stock ON mixes(stock_quantity);

-- users: queried by telegram_id (bot), phone, name
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- loyalty_transactions: queried by user_id
CREATE INDEX IF NOT EXISTS idx_loyalty_tx_user ON loyalty_transactions(user_id);

-- restock_requests: queried by status
CREATE INDEX IF NOT EXISTS idx_restock_requests_status ON restock_requests(status);

-- knowledge_graph: queried by source_id, target_id
CREATE INDEX IF NOT EXISTS idx_knowledge_graph_source ON knowledge_graph(source_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_graph_target ON knowledge_graph(target_id);

-- stories: queried by is_active, expires_at
CREATE INDEX IF NOT EXISTS idx_stories_active ON stories(is_active, expires_at);

COMMIT;
