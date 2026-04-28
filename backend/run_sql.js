import 'dotenv/config';
import fs from 'fs';
import postgres from 'postgres';

async function run() {
  if (!process.env.DATABASE_URL) {
    console.error('Missing DATABASE_URL');
    process.exit(1);
  }

  const sql = postgres(process.env.DATABASE_URL);
  
  try {
    const query = fs.readFileSync('update_schema.sql', 'utf8');
    console.log('Running update_schema.sql...');
    // execute raw sql
    await sql.unsafe(query);
    console.log('Successfully applied SQL updates.');
  } catch (err) {
    console.error('Error executing SQL:', err);
  } finally {
    await sql.end();
  }
}

run();
