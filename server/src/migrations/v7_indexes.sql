-- V7: Performance indexes (полностью условные)

DO $$
BEGIN
  -- orders
  IF to_regclass('public.orders') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_orders_user_id_created ON orders(user_id, created_at DESC);
  END IF;
  -- post_likes
  IF to_regclass('public.post_likes') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
    CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);
  END IF;
  -- reviews
  IF to_regclass('public.reviews') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_reviews_mix_id ON reviews(mix_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
  END IF;
  -- bookings
  IF to_regclass('public.bookings') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
    CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
    CREATE INDEX IF NOT EXISTS idx_bookings_date_status ON bookings(date, status);
  END IF;
  -- mixes
  IF to_regclass('public.mixes') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_mixes_category ON mixes(category);
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='mixes' AND column_name='is_active') THEN
      CREATE INDEX IF NOT EXISTS idx_mixes_available ON mixes(is_active);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='mixes' AND column_name='stock_quantity') THEN
      CREATE INDEX IF NOT EXISTS idx_mixes_stock ON mixes(stock_quantity);
    END IF;
  END IF;
  -- users
  IF to_regclass('public.users') IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='telegram_id') THEN
      CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='phone') THEN
      CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
    END IF;
  END IF;
  -- loyalty_transactions
  IF to_regclass('public.loyalty_transactions') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_loyalty_tx_user ON loyalty_transactions(user_id);
  END IF;
  -- restock_requests
  IF to_regclass('public.restock_requests') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_restock_requests_status ON restock_requests(status);
  END IF;
  -- knowledge_graph
  IF to_regclass('public.knowledge_graph') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_knowledge_graph_source ON knowledge_graph(source_id);
    CREATE INDEX IF NOT EXISTS idx_knowledge_graph_target ON knowledge_graph(target_id);
  END IF;
  -- stories
  IF to_regclass('public.stories') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_stories_active ON stories(is_active, expires_at);
  END IF;
END $$;
