// Applies supabase/migrations/*.sql in order against DATABASE_URL.
// Tracks applied files in schema_migrations so each runs exactly once.
// Usage: DATABASE_URL=postgresql://... npm run db:apply
import postgres from 'postgres';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { assertInitialMigrationSafe } from './db-safety.js';

const url = process.env.DATABASE_URL;
if (!url || url.includes('[YOUR-PASSWORD]')) {
  console.error('Set DATABASE_URL with the real database password (Supabase dashboard > Database > Connection string).');
  process.exit(1);
}

const dir = new URL('../supabase/migrations/', import.meta.url).pathname;
const files = (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort();
const sql = postgres(url, { max: 1, prepare: false });

try {
  const [{ exists: migrationTableExists }] = await sql`
    SELECT to_regclass('public.schema_migrations') IS NOT NULL AS exists
  `;
  const appliedBeforeSetup = migrationTableExists
    ? (await sql`SELECT filename FROM schema_migrations`).map((row) => row.filename)
    : [];
  const existingRelations = (await sql`
    SELECT c.relname AS name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r', 'p', 'v', 'm', 'f')
      AND c.relname <> 'schema_migrations'
    ORDER BY c.relname
  `).map((row) => row.name);
  assertInitialMigrationSafe({
    initialMigration: files[0],
    appliedMigrations: appliedBeforeSetup,
    existingRelations,
    confirmation: process.env.DB_APPLY_CONFIRM,
  });

  await sql`CREATE TABLE IF NOT EXISTS schema_migrations (
    filename TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  const applied = new Set(
    (await sql`SELECT filename FROM schema_migrations`).map((r) => r.filename),
  );

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`Skipping ${file} (already applied)`);
      continue;
    }
    process.stdout.write(`Applying ${file}... `);
    await sql.unsafe(await readFile(path.join(dir, file), 'utf8'));
    await sql`INSERT INTO schema_migrations (filename) VALUES (${file})`;
    console.log('ok');
  }
} finally {
  await sql.end();
}
console.log('All migrations applied.');
