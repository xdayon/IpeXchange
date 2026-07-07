// Applies supabase/migrations/*.sql in order against DATABASE_URL.
// Usage: DATABASE_URL=postgresql://... npm run db:apply
import postgres from 'postgres';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const url = process.env.DATABASE_URL;
if (!url || url.includes('[YOUR-PASSWORD]')) {
  console.error('Set DATABASE_URL with the real database password (Supabase dashboard > Database > Connection string).');
  process.exit(1);
}

const dir = new URL('../supabase/migrations/', import.meta.url).pathname;
const files = (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort();
const sql = postgres(url, { max: 1, prepare: false });

try {
  for (const file of files) {
    process.stdout.write(`Applying ${file}... `);
    await sql.unsafe(await readFile(path.join(dir, file), 'utf8'));
    console.log('ok');
  }
} finally {
  await sql.end();
}
console.log('All migrations applied.');
