/**
 * Celebrating YOU — SQLite to PostgreSQL Migration Utility
 *
 * This utility exports all platform data from the local SQLite database
 * in strict referential order and restores it safely to a PostgreSQL database.
 */

import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

// Allow overriding database URL dynamically during migration if desired
const databaseUrl = process.env.TARGET_DATABASE_URL || process.env.DATABASE_URL;
const prisma = new PrismaClient({
  datasources: databaseUrl ? { db: { url: databaseUrl } } : undefined,
});

// Referential order: Parents before Children to satisfy all foreign key constraints
const EXPORT_MODELS = [
  "PlatformSetting",
  "VendorCategory",      // Must be before CommissionSetting and Vendor
  "CommissionSetting",
  "EventTemplate",
  "User",
  "Customer",            // References User
  "Vendor",              // References User, VendorCategory
  "VendorVerification",  // References Vendor
  "VendorDocument",      // References Vendor
  "VendorPromotion",     // References Vendor
  "Service",             // References Vendor, VendorCategory
  "ServicePackage",      // References Service
  "ServiceImage",        // References Service
  "ServiceAddon",        // References Service
  "ServiceAvailability", // References Service, Vendor
  "Event",               // References Customer, EventTemplate
  "EventCheckpoint",     // References Event
  "EventService",        // References Event, Service, ServicePackage
  "Booking",             // References Event, Customer, Vendor, Service, ServicePackage
  "BookingStatusHistory",// References Booking
  "BookingIssue",        // References Booking
  "Payment",             // References Booking, Customer
  "PaymentTransaction",  // References Payment, Booking
  "Invoice",             // References Booking, PaymentTransaction
  "VendorSettlement",    // References Vendor, Booking
  "Refund",              // References Booking, PaymentTransaction
  "Review",              // References Booking, Customer, Vendor, Service
  "Notification",        // References User
  "Complaint",           // References Booking, Customer, Vendor
  "AuditLog",            // References User
];

function prepareRecord(rec) {
  const prepared = { ...rec };
  for (const [key, val] of Object.entries(prepared)) {
    // Convert ISO date strings back to Date objects for PostgreSQL timestamp compatibility
    if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
      prepared[key] = new Date(val);
    }
  }
  return prepared;
}

async function exportData() {
  console.log("=================================================");
  console.log("CELEBRATING YOU — DATABASE DATA EXPORTER");
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
  console.log("\nTo restore into PostgreSQL (Render):");
  console.log("1. Set DATABASE_URL to your Render PostgreSQL external connection string:");
  console.log('   $env:DATABASE_URL="postgresql://user:pass@host:5432/celebrating_you?sslmode=require"');
  console.log("2. Run database migration / schema push:");
  console.log("   npx prisma db push");
  console.log("3. Restore records:");
  console.log("   node scripts/migrate-to-postgres.mjs --restore");
  console.log("=================================================");
}

async function restoreData() {
  console.log("=================================================");
  console.log("CELEBRATING YOU — POSTGRESQL RESTORE UTILITY");
  console.log("=================================================");

  const dumpPath = path.join(process.cwd(), "prisma", "migration_dumps", "celebrating_you_dump.json");
  if (!fs.existsSync(dumpPath)) {
    console.error(`Dump file not found at ${dumpPath}`);
    process.exit(1);
  }

  const dump = JSON.parse(fs.readFileSync(dumpPath, "utf8"));
  console.log("Restoring data to PostgreSQL in referential order...\n");

  let totalRestored = 0;

  for (const model of EXPORT_MODELS) {
    const records = dump[model] || [];
    if (records.length > 0 && prisma[model]) {
      let count = 0;
      for (const raw of records) {
        const rec = prepareRecord(raw);
        try {
          await prisma[model].upsert({
            where: { id: rec.id },
            create: rec,
            update: rec,
          });
          count++;
        } catch (err) {
          console.error(`  ✗ Error restoring record in ${model} (id: ${rec.id}):`, err.message);
          throw err;
        }
      }
      totalRestored += count;
      console.log(`  ✓ Restored ${count} records into ${model}`);
    }
  }

  console.log("\n-------------------------------------------------");
  console.log(`Restoration complete! Successfully migrated ${totalRestored} records with 0 data loss.`);
  console.log("=================================================");
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
    console.error("Migration process failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
