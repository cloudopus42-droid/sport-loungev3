import { supabase } from './supabase';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

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
