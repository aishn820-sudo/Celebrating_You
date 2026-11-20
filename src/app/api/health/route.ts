import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    // 1. Verify connectivity
    await prisma.$queryRawUnsafe("SELECT 1;");

    // 2. Check table count in public schema
    const tables: any[] = await prisma.$queryRawUnsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    // 3. Check migration records
    let migrationCount = 0;
    try {
      const migrations: any[] = await prisma.$queryRawUnsafe(`
        SELECT migration_name, finished_at 
        FROM "_prisma_migrations" 
        WHERE rolled_back_at IS NULL;
      `);
      migrationCount = migrations.length;
    } catch (e) {
      // _prisma_migrations might not exist if unmigrated
    }

    const expectedCoreTables = [
      "User",
      "Customer",
      "Vendor",
      "Service",
      "Event",
      "Booking",
      "Payment",
      "Invoice",
      "EventTemplate",
      "VendorCategory",
    ];

    const currentTableNames = tables.map((t) => t.table_name);
    const missingCoreTables = expectedCoreTables.filter(
      (t) => !currentTableNames.some((c) => c.toLowerCase() === t.toLowerCase())
    );

    return NextResponse.json({
      status: "HEALTHY",
      database: {
        connected: true,
        provider: "PostgreSQL",
        publicTableCount: tables.length,
        appliedMigrations: migrationCount,
        missingCoreTables,
        schemaStatus: missingCoreTables.length === 0 ? "SYNCHRONIZED" : "INCOMPLETE",
      },
      timestamp,
    });
  } catch (error: any) {
    console.error("[HealthCheck] Database connection error:", error.message);
    return NextResponse.json(
      {
        status: "UNHEALTHY",
        database: {
          connected: false,
          provider: "PostgreSQL",
          error: "Database server unreachable or credentials invalid",
        },
        timestamp,
      },
      { status: 503 }
    );
  }
}
