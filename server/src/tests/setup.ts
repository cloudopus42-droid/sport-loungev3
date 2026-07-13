// Jest global setup — runs before any module (including config/env) is imported.
// Provides the environment variables required by the Zod env schema so that
// importing the app during tests does not call process.exit(1), and supplies a
// WebSocket implementation for @supabase/realtime-js on Node < 22.
import ws from 'ws';

process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'test-jwt-secret-must-be-at-least-32-chars-long';
process.env.SUPABASE_URL =
  process.env.SUPABASE_URL || 'https://example.supabase.co';
process.env.SUPABASE_KEY = process.env.SUPABASE_KEY || 'test-supabase-key';
process.env.SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY || 'test-supabase-anon-key';

// Node 20 lacks a native global WebSocket, which @supabase/realtime-js requires.
if (typeof (globalThis as { WebSocket?: unknown }).WebSocket === 'undefined') {
  (globalThis as { WebSocket?: unknown }).WebSocket = ws;
}
