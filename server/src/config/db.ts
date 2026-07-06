import { supabase } from './supabase';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

export async function connectDB(): Promise<void> {
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      const { error } = await supabase.from('users').select('id').limit(1);

      if (error && error.code !== 'PGRST116') {
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
        console.warn('⚠️ Supabase unavailable. Server will start with limited functionality.');
        console.warn('   Frontend will work. Backend API calls will fail until Supabase is configured.');
        return;
      }

      console.log(`⏳ Retrying in 5s...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
}
