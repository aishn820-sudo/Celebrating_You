import { PrismaClient } from "@prisma/client";

async function main() {
  const adminUrl = "postgresql://postgres:123456789@localhost:5432/postgres?schema=public";
  const pAdmin = new PrismaClient({ datasources: { db: { url: adminUrl } } });
  
  try {
    const dbs = await pAdmin.$queryRawUnsafe("SELECT datname FROM pg_database WHERE datname = 'celebrating_you';");
    console.log("Databases found:", dbs);
    if (dbs.length === 0) {
      console.log("Database 'celebrating_you' does not exist yet. Creating it...");
      await pAdmin.$executeRawUnsafe("CREATE DATABASE celebrating_you;");
      console.log("✓ Created database 'celebrating_you' successfully!");
    } else {
      console.log("✓ Database 'celebrating_you' already exists.");
    }
  } catch (err) {
    console.error("Error checking/creating database:", err.message);
  } finally {
    await pAdmin.$disconnect();
  }

  // Now test connecting to celebrating_you
  const cyUrl = "postgresql://postgres:123456789@localhost:5432/celebrating_you?schema=public";
  const pCy = new PrismaClient({ datasources: { db: { url: cyUrl } } });
  try {
    const tables = await pCy.$queryRawUnsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log(`✓ Connected to 'celebrating_you'! Found ${tables.length} tables in public schema.`);
    console.log("Tables:", tables.map(t => t.table_name));
  } catch (err) {
    console.error("Error connecting to celebrating_you:", err.message);
  } finally {
    await pCy.$disconnect();
  }
}

main();
