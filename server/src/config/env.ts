import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  PORT: z.string().default('5000').transform(Number),
  JWT_SECRET: z.string().default('your-super-secret-jwt-key-change-in-production'),
  ALLOWED_ORIGINS: z.string().default('http://localhost:5173,http://localhost:3000'),
  TELEGRAM_TOKEN: z.string().default(''),
  TELEGRAM_CHAT_ID: z.string().default(''),
  TELEGRAM_API_BASE_URL: z.string().default('https://api.telegram.org'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  SUPABASE_URL: z.string().default('https://haemdfhteicygsidftqp.supabase.co'),
  SUPABASE_KEY: z.string().default('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZW1kZmh0ZWljeWdzaWRmdHFwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDE3NDMxNSwiZXhwIjoyMDk1NzUwMzE1fQ.324lSMx1tWN-SeCJdFFs-dQCroBwhLqT75EvKH2O2vk'),
  SUPABASE_ANON_KEY: z.string().default('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZW1kZmh0ZWljeWdzaWRmdHFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNzQzMTUsImV4cCI6MjA5NTc1MDMxNX0.-SG7eaWU6nO3GBEWc9UBWug7GcqfnDeMAxkYq5k86Rs'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = {
  port: parsed.data.PORT,
  jwtSecret: parsed.data.JWT_SECRET,
  allowedOrigins: parsed.data.ALLOWED_ORIGINS.split(',').map((s) => s.trim()),
  telegramToken: parsed.data.TELEGRAM_TOKEN,
  telegramChatId: parsed.data.TELEGRAM_CHAT_ID,
  telegramApiBaseUrl: parsed.data.TELEGRAM_API_BASE_URL,
  nodeEnv: parsed.data.NODE_ENV,
  isProduction: parsed.data.NODE_ENV === 'production',
  supabaseUrl: parsed.data.SUPABASE_URL,
  supabaseKey: parsed.data.SUPABASE_KEY,
  supabaseAnonKey: parsed.data.SUPABASE_ANON_KEY,
};
