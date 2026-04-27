import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();

const sqlFile = path.join(__dirname, 'supabase_schema.sql');
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ ERRO: DATABASE_URL não encontrada no arquivo .env');
  console.info('Vá em Supabase > Settings > Database > Connection String (Node.js) e adicione ao .env');
  process.exit(1);
}

async function setupDatabase() {
  console.log('🚀 Iniciando Auto-Setup do Banco de Dados...');
  
  const sql = postgres(connectionString, {
    ssl: 'require',
    idle_timeout: 20,
    max_lifetime: 60 * 30,
  });

  try {
    const rawSql = fs.readFileSync(sqlFile, 'utf8');
    
    // Separamos os DROPs do resto para garantir a limpeza antes de criar os novos tipos
    console.log('🧹 Limpando tabelas antigas...');
    await sql.unsafe(`
      DROP TABLE IF EXISTS trade_edges CASCADE;
      DROP TABLE IF EXISTS transactions CASCADE;
      DROP TABLE IF EXISTS user_intents CASCADE;
      DROP TABLE IF EXISTS demands CASCADE;
      DROP TABLE IF EXISTS listings CASCADE;
      DROP TABLE IF EXISTS messages CASCADE;
      DROP TABLE IF EXISTS sessions CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP FUNCTION IF EXISTS match_listings CASCADE;
      DROP FUNCTION IF EXISTS find_trade_cycles CASCADE;
    `);

    console.log('🔨 Aplicando novo schema e seed data...');
    // O unsafe() permite rodar um bloco completo de SQL
    await sql.unsafe(rawSql);

    console.log('✅ Banco de dados atualizado com sucesso!');
  } catch (err) {
    console.error('❌ Erro ao configurar o banco:', err.message);
  } finally {
    await sql.end();
    process.exit();
  }
}

setupDatabase();
