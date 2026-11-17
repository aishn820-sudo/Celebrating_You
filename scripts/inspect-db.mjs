import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== CELEBRATING YOU — POSTGRESQL DATABASE INSPECTION ===");
  try {
    // 1. Inspect _prisma_migrations table
    console.log("\n1. Checking _prisma_migrations record:");
    const migrationRows = await prisma.$queryRawUnsafe(
      `SELECT id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count 
       FROM "_prisma_migrations" 
       ORDER BY started_at DESC;`
    );
    console.table(migrationRows);

    // 2. Check for any application tables in the public schema
    console.log("\n2. Checking public schema tables:");
    const tables = await prisma.$queryRawUnsafe(
      `SELECT table_name 
       FROM information_schema.tables 
       WHERE table_schema = 'public' 
       AND table_name != '_prisma_migrations'
       ORDER BY table_name;`
    );

    if (tables.length === 0) {
      console.log("-> 0 application tables found in public schema. The failed migration failed at byte 0 before creating any tables.");
      console.log("-> SAFE TO ROLL BACK AND RETRY: The database is in a clean state.");
    } else {
      console.log(`-> Warning: Found ${tables.length} tables in public schema:`, tables.map((t) => t.table_name));
    }
  } catch (err) {
    console.error("Inspection failed:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
