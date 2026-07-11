import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const testDefaults = {
  JWT_SECRET: 'test-jwt-secret-minimum-32-characters',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_KEY: 'test-service-role-key',
  SUPABASE_ANON_KEY: 'test-anon-key',
};

const envSchema = z.object({
  PORT: z.string().default('5000').transform(Number),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  ALLOWED_ORIGINS: z.string().default('http://localhost:5173,http://localhost:3000'),
  TELEGRAM_TOKEN: z.string().default(''),
  TELEGRAM_CHAT_ID: z.string().default(''),
  TELEGRAM_API_BASE_URL: z.string().default('https://api.telegram.org'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_KEY: z.string().min(1, 'SUPABASE_KEY is required'),
  SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY is required'),
  SUPABASE_DB_PASSWORD: z.string().default(''),
});

const parsed = envSchema.safeParse({
  ...(process.env.NODE_ENV === 'test' ? testDefaults : {}),
  ...process.env,
});

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
  supabaseDbPassword: parsed.data.SUPABASE_DB_PASSWORD,
};
