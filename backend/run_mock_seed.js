import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import postgres from 'postgres';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env');
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require',
  idle_timeout: 20,
  max_lifetime: 60 * 30,
});

async function run() {
  const sqlFile = path.join(__dirname, 'add_mock_listings.sql');
  const query = fs.readFileSync(sqlFile, 'utf8');

  console.log('🌿 Connecting to Supabase...');
  try {
    await sql.unsafe(query);
    console.log('✅ Mock data seeded successfully!');
    console.log('   → Sessions, listings, demands, find_trade_cycles function all updated.');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await sql.end();
  }
}

run();
