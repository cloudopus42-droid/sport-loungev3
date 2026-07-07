import fs from 'fs';
import path from 'path';
import { Client } from 'pg';
import { config } from './config/env';

const MIGRATIONS_DIR = path.resolve(__dirname, 'migrations');

function getProjectRef(): string {
  return config.supabaseUrl.replace('https://', '').replace('.supabase.co', '');
}

function buildDbClients(): { label: string; client: Client }[] {
  const pw = config.supabaseDbPassword;
  const ref = getProjectRef();
  if (!pw) return [];

  return [
    {
      label: 'direct',
      client: new Client({
        host: `db.${ref}.supabase.co`, port: 5432, database: 'postgres',
        user: 'postgres', password: pw,
        ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000,
      }),
    },
    {
      label: 'pooler',
      client: new Client({
        host: `aws-0-eu-west-1.pooler.supabase.com`, port: 6543, database: 'postgres',
        user: `postgres.${ref}`, password: pw,
        ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000,
      }),
    },
  ];
}

async function run(sql: Client, files: string[]): Promise<void> {
  await sql.query(`CREATE TABLE IF NOT EXISTS _migrations (id SERIAL PRIMARY KEY, filename VARCHAR(255) UNIQUE NOT NULL, applied_at TIMESTAMPTZ DEFAULT NOW())`);
  const { rows } = await sql.query('SELECT filename FROM _migrations');
  const applied = new Set(rows.map((r: any) => r.filename));

  for (const file of files) {
    if (applied.has(file)) continue;
    const content = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');
    console.log(`📦 Applying migration: ${file}`);
    await sql.query('BEGIN');
    try {
      await sql.query(content);
      await sql.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
      await sql.query('COMMIT');
      console.log(`   ✅ ${file} applied`);
    } catch (err) {
      await sql.query('ROLLBACK');
      console.warn(`   ⚠️ ${file} failed (may already exist): ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

export async function runMigrations(): Promise<void> {
  const files = fs.readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql')).sort();
  if (files.length === 0) return;

  const clients = buildDbClients();

  for (const { label, client } of clients) {
    try {
      await client.connect();
      console.log(`✅ DB connected via ${label}`);
      await run(client, files);
      await client.end();
      return;
    } catch (err) {
      console.warn(`⚠️ DB ${label} failed: ${err instanceof Error ? err.message : String(err)}`);
      await client.end().catch(() => {});
    }
  }

  console.warn('\n⚠️ Could not connect to database. Migrations NOT applied.');
  console.warn('   To apply manually, run these SQL statements in Supabase Dashboard → SQL Editor:\n');
  for (const file of files) {
    const content = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');
    console.warn(`-- ${file}`);
    console.warn(content);
    console.warn('');
  }
}
