import { supabase } from './supabase';
import { Client } from 'pg';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

async function runDirectMigration() {
  try {
    // Check if invoices table already exists first using supabase client
    const { error } = await supabase.from('invoices').select('id').limit(1);
    if (!error || error.code !== 'PGRST205') {
      console.log('✅ Invoices table already exists. Skipping database migration.');
      return;
    }
  } catch (err) {
    // Continue to migrate if we fail to check
  }

  console.log('🏁 Invoices table does not exist. Starting direct PG migration...');
  
  const passwords = [
    process.env.SUPABASE_KEY || 'sb_secret_V9gEDtPTvq8XlJuefmVPAg_PoO4pWp_',
    'YaSmogu100'
  ];

  const sql = `
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

  for (const password of passwords) {
    console.log(`🔑 Trying direct PG connection with password prefix ${password.substring(0, 5)}...`);
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
      console.error(`❌ Connection with password prefix ${password.substring(0, 5)} failed:`, err.message);
      try { await client.end(); } catch {}
    }
  }

  console.error('❌ Direct PG migration failed with all passwords. If running locally, this is expected due to network routes.');
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
        console.error('❌ Max retries reached. Exiting...');
        process.exit(1);
      }

      console.log(`⏳ Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
}
