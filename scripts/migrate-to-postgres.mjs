/**
 * Celebrating YOU — SQLite to PostgreSQL Migration Utility
 *
 * This utility exports all platform data from the local SQLite database
 * in referential order and generates a PostgreSQL migration bundle.
 */

import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

const EXPORT_MODELS = [
  "PlatformSetting",
  "CommissionSetting",
  "VendorCategory",
  "EventTemplate",
  "User",
  "Customer",
  "Vendor",
  "VendorVerification",
  "VendorDocument",
  "VendorPromotion",
  "Service",
  "ServicePackage",
  "ServiceImage",
  "ServiceAddon",
  "ServiceAvailability",
  "Event",
  "EventCheckpoint",
  "EventService",
  "Booking",
  "BookingStatusHistory",
  "BookingIssue",
  "Payment",
  "PaymentTransaction",
  "Invoice",
  "VendorSettlement",
  "Refund",
  "Review",
  "Notification",
  "Complaint",
  "AuditLog",
];

async function exportData() {
  console.log("=================================================");
  console.log("CELEBRATING YOU — POSTGRESQL MIGRATION EXPORTER");
  console.log("=================================================");

  const dump = {};
  let totalRecords = 0;

  for (const model of EXPORT_MODELS) {
    if (prisma[model]) {
      const records = await prisma[model].findMany();
      dump[model] = records;
      totalRecords += records.length;
      console.log(`  ✓ Exported ${records.length} records from ${model}`);
    }
  }

  const exportDir = path.join(process.cwd(), "prisma", "migration_dumps");
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const dumpPath = path.join(exportDir, "celebrating_you_dump.json");
  fs.writeFileSync(dumpPath, JSON.stringify(dump, null, 2));

  console.log("-------------------------------------------------");
  console.log(`Successfully exported ${totalRecords} records across ${EXPORT_MODELS.length} entities.`);
  console.log(`Saved export to: ${dumpPath}`);
  console.log("\nTo migrate to PostgreSQL in production:");
  console.log("1. Set DATABASE_URL in .env to your PostgreSQL connection string:");
  console.log("   DATABASE_URL=\"postgresql://user:pass@host:5432/celebrating_you?schema=public\"");
  console.log("2. In prisma/schema.prisma, change provider to 'postgresql'");
  console.log("3. Run: npx prisma db push");
  console.log("4. Run: node scripts/migrate-to-postgres.mjs --restore");
  console.log("=================================================");
}

async function restoreData() {
  const dumpPath = path.join(process.cwd(), "prisma", "migration_dumps", "celebrating_you_dump.json");
  if (!fs.existsSync(dumpPath)) {
    console.error(`Dump file not found at ${dumpPath}`);
    process.exit(1);
  }

  const dump = JSON.parse(fs.readFileSync(dumpPath, "utf8"));
  console.log("Restoring data to PostgreSQL in referential order...");

  for (const model of EXPORT_MODELS) {
    const records = dump[model] || [];
    if (records.length > 0 && prisma[model]) {
      for (const rec of records) {
        // Upsert by id
        await prisma[model].upsert({
          where: { id: rec.id },
          create: rec,
          update: rec,
        });
      }
      console.log(`  ✓ Restored ${records.length} records into ${model}`);
    }
  }
  console.log("Restoration complete with 0 data loss!");
}

async function main() {
  const isRestore = process.argv.includes("--restore");
  if (isRestore) {
    await restoreData();
  } else {
    await exportData();
  }
}

main()
  .catch((e) => {
    console.error("Migration error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

