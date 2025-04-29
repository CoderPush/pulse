import postgres from 'postgres';
import { config } from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';

// Load environment variables from .env
config({ path: resolve(process.cwd(), '.env') });

const runMigrate = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined');
  }

  const connectionString = process.env.DATABASE_URL;
  const sql = postgres(connectionString, { max: 1 });

  console.log('⏳ Running migrations...');

  try {
    // Read and execute the migration SQL file
    const migrationSQL = readFileSync(resolve(process.cwd(), 'drizzle/0000_initial.sql'), 'utf8');
    await sql.unsafe(migrationSQL);
    
    console.log('✅ Migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await sql.end();
  }
};

runMigrate().catch((err) => {
  console.error('❌ Migration failed');
  console.error(err);
  process.exit(1);
});