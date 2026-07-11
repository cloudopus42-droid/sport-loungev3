import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
import { config } from './env';

if (typeof globalThis.WebSocket === 'undefined') {
  Object.defineProperty(globalThis, 'WebSocket', { value: WebSocket });
}

export const supabase = createClient(config.supabaseUrl, config.supabaseKey);
