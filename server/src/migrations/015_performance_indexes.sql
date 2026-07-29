-- Performance indexes for hot queries
-- Applied via Supabase Management API

-- Bookings: availability check (date + seat + status)
CREATE INDEX IF NOT EXISTS idx_bookings_seat_date_status 
  ON bookings(seat_id, date, status) WHERE status != 'cancelled';

-- Bookings: taste-stats (non-cancelled, ordered by created_at)
CREATE INDEX IF NOT EXISTS idx_bookings_taste_stats 
  ON bookings(created_at DESC) WHERE status != 'cancelled';

-- Orders: user history
CREATE INDEX IF NOT EXISTS idx_orders_user_created 
  ON orders(user_id, created_at DESC);

-- Orders: active count for queue position
CREATE INDEX IF NOT EXISTS idx_orders_active_count 
  ON orders(status) WHERE status IN ('accepted', 'preparing', 'roasting');

-- Mixes: low stock check
CREATE INDEX IF NOT EXISTS idx_mixes_stock_active 
  ON mixes(stock_quantity, is_active) WHERE is_active = true;

-- Mixes: public listing
CREATE INDEX IF NOT EXISTS idx_mixes_public 
  ON mixes(created_at DESC, is_active) WHERE is_active = true;

-- Posts: public listing
CREATE INDEX IF NOT EXISTS idx_posts_created 
  ON posts(created_at DESC);

-- Promos: active listing
CREATE INDEX IF NOT EXISTS idx_promos_active 
  ON promos(is_active) WHERE is_active = true;

-- Invitations: published listing
CREATE INDEX IF NOT EXISTS idx_invitations_published 
  ON invitations(date_time) WHERE status = 'published';

-- Stories: active listing
CREATE INDEX IF NOT EXISTS idx_stories_active 
  ON stories(sort_order) WHERE is_active = true;

-- User mixes: user's saved mixes
CREATE INDEX IF NOT EXISTS idx_user_mixes_user 
  ON user_mixes(user_id, created_at DESC);

-- Order status history: order timeline
CREATE INDEX IF NOT EXISTS idx_order_status_history_order 
  ON order_status_history(order_id, created_at DESC);
