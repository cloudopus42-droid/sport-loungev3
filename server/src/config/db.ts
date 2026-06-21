import { supabase } from './supabase';
import { config } from './env';
import { Client } from 'pg';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

async function runDirectMigration() {
  const password = config.supabaseDbPassword;
  if (!password) {
    console.log('SUPABASE_DB_PASSWORD not set, skipping direct PG migration.');
    return;
  }

  try {
    const { error } = await supabase.from('invoices').select('id').limit(1);
    if (!error || error.code !== 'PGRST205') {
      console.log('✅ Invoices table already exists. Skipping invoices migration.');
    } else {
      await runMigrationSql();
    }
  } catch (err) {
    await runMigrationSql();
  }
}

async function runMigrationSql() {
  const password = config.supabaseDbPassword;
  if (!password) return;

  console.log('🏁 Running database migrations via direct PG connection...');

  const sql = `
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

  ALTER TABLE mixes ADD COLUMN IF NOT EXISTS min_stock_threshold INTEGER DEFAULT 5;
  ALTER TABLE mixes ADD COLUMN IF NOT EXISTS auto_reorder_enabled BOOLEAN DEFAULT false;

  CREATE TABLE IF NOT EXISTS restock_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tobacco_id UUID REFERENCES mixes(id) ON DELETE CASCADE,
    tobacco_name VARCHAR(255),
    quantity INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed', 'rejected')),
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  );

  CREATE INDEX IF NOT EXISTS idx_restock_requests_status ON restock_requests (status);
  CREATE INDEX IF NOT EXISTS idx_restock_requests_tobacco ON restock_requests (tobacco_id);

  CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    date DATE NOT NULL,
    total_amount NUMERIC NOT NULL,
    items JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now()
  );

  INSERT INTO invoices (invoice_number, date, total_amount, items) VALUES
    ('УТ-704', '2025-12-30', 47755.00, '[
      {"name": "Мундштуки одноразовые", "qty": 10, "price": 89.00},
      {"name": "Табак M (акцизный)", "qty": 7, "price": 795.00},
      {"name": "Уголь PANDA XL 72 (25мм)", "qty": 10, "price": 550.00},
      {"name": "Табак Элемент Воздух 200г", "qty": 7, "price": 1190.00}
    ]'),
    ('УТ-45', '2026-02-03', 28335.00, '[
      {"name": "Кальян ALPHA HOOKAH X SPECIAL CYBER", "qty": 1, "price": 11900.00},
      {"name": "Кальян ALPHA HOOKAH BEAT", "qty": 1, "price": 11700.00},
      {"name": "Колба КРАФТ (бесцветная)", "qty": 2, "price": 775.00},
      {"name": "Ерш для шахты", "qty": 1, "price": 235.00},
      {"name": "Калауд Lotus", "qty": 2, "price": 250.00},
      {"name": "Чаша Облако Турк", "qty": 2, "price": 500.00},
      {"name": "Щипцы большие", "qty": 1, "price": 350.00},
      {"name": "Корзина для углей (Кадило)", "qty": 1, "price": 1100.00}
    ]'),
    ('УТ-46', '2026-02-04', 12375.00, '[
      {"name": "Хулиган 200г (Клубника Ревень)", "qty": 1, "price": 1850.00},
      {"name": "Хулиган 200г (Кислый лимонад)", "qty": 1, "price": 1850.00},
      {"name": "Хулиган 200г (Виноград Алоэ)", "qty": 1, "price": 1850.00},
      {"name": "Хулиган 200г (Клубничный джем)", "qty": 1, "price": 1850.00},
      {"name": "Табак M (акцизный)", "qty": 7, "price": 825.00}
    ]'),
    ('УТ-107', '2026-03-16', 7750.00, '[
      {"name": "Блекберн 200г (Something Berry)", "qty": 1, "price": 1550.00},
      {"name": "Блекберн 200г (Chupa Graper)", "qty": 1, "price": 1550.00},
      {"name": "Спектрум HL 200г (JUNGLE MIX)", "qty": 1, "price": 1500.00},
      {"name": "Спектрум HL 200г (RASPBERRY KIWI)", "qty": 1, "price": 1500.00},
      {"name": "Табак M (акцизный)", "qty": 2, "price": 825.00}
    ]'),
    ('УТ-129', '2026-04-06', 6200.00, '[
      {"name": "Блекберн 200г (Ice Baby)", "qty": 1, "price": 1550.00},
      {"name": "Блекберн 200г (White Grape)", "qty": 1, "price": 1550.00},
      {"name": "DEUS 250г (Yuzu)", "qty": 1, "price": 1550.00},
      {"name": "Спектрум МЛ 200г (СОЧНЫЙ АПЕЛЬСИН)", "qty": 1, "price": 1550.00}
    ]'),
    ('УТ-137', '2026-04-10', 8385.00, '[
      {"name": "Спектрум МЛ 200г (СОЧНЫЙ АПЕЛЬСИН)", "qty": 1, "price": 1550.00},
      {"name": "Спектрум HL 200г (BRAZILIAN TEA)", "qty": 1, "price": 1500.00},
      {"name": "Спектрум МЛ 200г (БЕЛЫЙ ЧАЙ)", "qty": 1, "price": 1500.00},
      {"name": "Спектрум HL 200г (WILD MX)", "qty": 1, "price": 1500.00},
      {"name": "Чаша Солярис Турка", "qty": 3, "price": 500.00},
      {"name": "Чаша Световой Турка", "qty": 1, "price": 250.00},
      {"name": "Уголь 25 1кг", "qty": 1, "price": 585.00}
    ]'),
    ('УТ-144', '2026-04-15', 32290.00, '[
      {"name": "Блекберн 200г (Malibu / Cherry / Lulo / Bubble)", "qty": 4, "price": 1550.00},
      {"name": "DEUS 250г (Watermelon / Red / Pine)", "qty": 3, "price": 1600.00},
      {"name": "BONCHE 120г (Raspberry / Strawberry)", "qty": 2, "price": 1970.00},
      {"name": "Спектрум 200г (Peach / Banana / Barberry / Tropicana / Tutti / Dragon)", "qty": 7, "price": 1500.00},
      {"name": "Уголь 25 1кг", "qty": 10, "price": 535.00}
    ]'),
    ('УТ-176', '2026-05-06', 31845.00, '[
      {"name": "Блекберн 200г (Assorted Flavors)", "qty": 11, "price": 1550.00},
      {"name": "Спектрум HL 200г (Agava / Blueberry / Berry / Energy / Grape / Raspberry)", "qty": 6, "price": 1500.00},
      {"name": "Мундштуки одноразовые", "qty": 5, "price": 89.00},
      {"name": "Уголь 25 1кг", "qty": 10, "price": 535.00}
    ]'),
    ('УТ-198', '2026-05-28', 38220.00, '[
      {"name": "Блекберн 200г (Assorted)", "qty": 12, "price": 1550.00},
      {"name": "Спектрум HL 200г (Agava / Berry / Energy / Raspberry)", "qty": 7, "price": 1500.00},
      {"name": "Уголь 25 1кг", "qty": 10, "price": 535.00},
      {"name": "Мундштуки одноразовые", "qty": 10, "price": 89.00}
    ]')
  ON CONFLICT (invoice_number) DO UPDATE
  SET date = EXCLUDED.date, total_amount = EXCLUDED.total_amount, items = EXCLUDED.items;
  `;

  const client = new Client({
      host: 'db.haemdfhteicygsidftqp.supabase.co',
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: password,
      ssl: {
        rejectUnauthorized: false
      },
      connectionTimeoutMillis: 5000
    });

    try {
      await client.connect();
      console.log('✅ Connected to database directly on port 5432!');
      await client.query(sql);
      console.log('🎉 Invoices table created and seeded successfully!');
      await client.end();
      return;
    } catch (err: any) {
      console.error('❌ Direct PG connection failed:', err.message);
      try { await client.end(); } catch {}
    }

  console.error('❌ Direct PG migration failed. If running locally, this is expected.');
}

export async function connectDB(): Promise<void> {
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      // Пингуем таблицу пользователей для проверки подключения
      const { data, error } = await supabase.from('users').select('id').limit(1);
      
      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found, which is a success (db is reachable)
        throw new Error(error.message);
      }

      console.log('✅ Supabase connected and schema is responsive');
      
      // Run raw sql migration for invoices in background (non-blocking)
      runDirectMigration().catch(err => {
        console.error('❌ Error running direct migration:', err.message);
      });

      return;
    } catch (error) {
      retries++;
      console.error(
        `❌ Supabase connection attempt ${retries}/${MAX_RETRIES} failed:`,
        error instanceof Error ? error.message : error
      );

      if (retries >= MAX_RETRIES) {
        console.warn('⚠️ Supabase unavailable. Server will start with limited functionality.');
        console.warn('   Frontend will work. Backend API calls will fail until Supabase is configured.');
        return;
      }

      console.log(`⏳ Retrying in 5s...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
}
