import fs from 'fs';
import path from 'path';
import { Client } from 'pg';
import { config } from './config/env';

const MIGRATIONS_DIR = path.resolve(__dirname, 'migrations');

function buildDbUrl(): string | null {
  if (!config.supabaseDbPassword) return null;
  const projectRef = config.supabaseUrl.replace('https://', '').replace('.supabase.co', '');
  return `postgresql://postgres:${encodeURIComponent(config.supabaseDbPassword)}@db.${projectRef}.supabase.co:5432/postgres`;
}

async function ensureTrackingTable(client: Client): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

async function getApplied(client: Client): Promise<Set<string>> {
  const result = await client.query('SELECT filename FROM _migrations ORDER BY id');
  return new Set(result.rows.map((r: any) => r.filename));
}

export async function runMigrations(): Promise<void> {
  const dbUrl = buildDbUrl();
  if (!dbUrl) {
    console.warn('⚠️ SUPABASE_DB_PASSWORD not set, skipping auto-migrations');
    return;
  }

  let files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  if (files.length === 0) return;

  const client = new Client({ connectionString: dbUrl });

  try {
    await client.connect();
    await ensureTrackingTable(client);
    const applied = await getApplied(client);

    for (const file of files) {
      if (applied.has(file)) continue;

      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');
      console.log(`📦 Applying migration: ${file}`);

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`   ✅ ${file} applied`);
      } catch (err) {
        await client.query('ROLLBACK');
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`   ⚠️ ${file} failed (may already exist): ${msg}`);
      }
    }
  } catch (err) {
    console.warn('⚠️ Migration runner error:', err instanceof Error ? err.message : err);
  } finally {
    await client.end().catch(() => {});
  }
}
