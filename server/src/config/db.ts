import { supabase } from './supabase';
import { config } from './env';
import { Client } from 'pg';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

async function createTableViaRest(tableName: string, createSql: string, seedSql?: string) {
  try {
    const { error: checkError } = await supabase.from(tableName).select('id').limit(1);
    if (!checkError) {
      return;
    }
  } catch {}
  try {
    const { error } = await supabase.rpc('exec_sql', { query: createSql });
    if (!error && seedSql) {
      await supabase.rpc('exec_sql', { query: seedSql });
    }
  } catch {
    console.log(`   Таблица ${tableName}: создайте через Supabase SQL Editor`);
  }
}

async function runMigrations() {
  console.log('🏁 Проверяю наличие таблиц...');
  try {
    const { error: sfErr } = await supabase.from('smart_features').select('id').limit(1);
    if (sfErr) {
      console.log('⚠️ Таблица smart_features отсутствует.');
      console.log('   → Открой Supabase SQL Editor: https://supabase.com/dashboard/project/haemdfhteicygsidftqp/sql/new');
      console.log('   → Вставь SQL из server/src/migrations/002_smart_features.sql и выполни');
    } else {
      console.log('✅ smart_features ok');
    }
  } catch {}

  try {
    const { error: invErr } = await supabase.from('invoices').select('id').limit(1);
    if (invErr) {
      console.log('⚠️ Таблица invoices отсутствует.');
      console.log('   → Открой Supabase SQL Editor и создай таблицу invoices (см. server/src/config/db.ts)');
    } else {
      console.log('✅ invoices ok');
    }
  } catch {}

  try {
    const { error: rrErr } = await supabase.from('restock_requests').select('id').limit(1);
    if (rrErr) {
      console.log('⚠️ Таблица restock_requests отсутствует.');
      console.log('   → Выполни SQL из supabase/migrations/v4_restock_system.sql в Supabase SQL Editor');
    } else {
      console.log('✅ restock_requests ok');
    }
  } catch {}

  try {
    const { error: atcErr } = await supabase.from('admin_telegram_chats').select('id').limit(1);
    if (atcErr) {
      console.log('⚠️ Таблица admin_telegram_chats отсутствует.');
      console.log('   → Выполни SQL из server/src/migrations/003_admin_telegram_chats.sql в Supabase SQL Editor');
    } else {
      console.log('✅ admin_telegram_chats ok');
    }
  } catch {}

  // Check tobacco inventory columns
  try {
    const { error: stockErr } = await supabase.from('mixes').select('stock_quantity').limit(1);
    if (stockErr && stockErr.message?.includes('stock_quantity')) {
      console.log('⚠️ Таблица mixes не имеет колонок для учёта табака.');
      console.log('   → Выполни SQL из server/src/migrations/004_tobacco_inventory.sql в Supabase SQL Editor');
      console.log('   → Без миграции табачный раздел работает в режиме только для чтения.');
    } else if (!stockErr) {
      console.log('✅ tobacco columns ok');
    }
  } catch {}
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
      
      // Check tables and guide user to run SQL migrations
      runMigrations();

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
