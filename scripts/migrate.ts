import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from 'dotenv';
import { resolve } from 'path';
import { readFileSync, readdirSync } from 'fs';

// Load environment variables from .env
config({ path: resolve(process.cwd(), '.env') });

const runMigrate = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined');
  }

  const sql = postgres(process.env.DATABASE_URL, { max: 1 });
  const db = drizzle(sql);

  console.log('⏳ Running migrations...');

  try {
    // Get all migration files and sort them
    const migrationFiles = readdirSync(resolve(process.cwd(), 'drizzle'))
      .filter(file => file.endsWith('.sql'))
      .sort();

    // Execute each migration in order
    for (const file of migrationFiles) {
      console.log(`Running migration: ${file}`);
      const migrationSQL = readFileSync(resolve(process.cwd(), 'drizzle', file), 'utf8');
      await sql.unsafe(migrationSQL);
    }
    
    console.log('✅ All migrations completed successfully');
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