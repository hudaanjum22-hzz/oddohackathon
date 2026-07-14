import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ Error: DATABASE_URL is missing in the .env file.");
  console.error("Please add the database connection string to your .env file:");
  console.error("DATABASE_URL=postgresql://postgres:[password]@db.ygqfughthyluxzecepoy.supabase.co:6543/postgres");
  process.exit(1);
}

const migrationFilePath = path.resolve('supabase/migrations/20260712000000_init_ecosphere.sql');

async function applyMigration() {
  console.log("📂 Reading migration SQL file...");
  let sql;
  try {
    sql = fs.readFileSync(migrationFilePath, 'utf8');
  } catch (err) {
    console.error(`❌ Error reading migration file at ${migrationFilePath}:`, err.message);
    process.exit(1);
  }

  const client = new Client({ connectionString });

  try {
    console.log("⚡ Connecting to Supabase PostgreSQL database...");
    await client.connect();
    console.log("✓ Connected successfully.");
    
    console.log("🚀 Applying migration (creating tables, indexes, and policies)...");
    await client.query(sql);
    console.log("\x1b[32m🎉 Migration applied successfully! All tables created.\x1b[0m");
    
  } catch (err) {
    console.error("❌ Error executing migration SQL:");
    console.error(err.message);
  } finally {
    await client.end();
  }
}

applyMigration();
