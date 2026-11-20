import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("=== CHECKING SEEDED DATABASE ACCOUNTS ===");
  const users = await prisma.user.findMany({
    include: { customer: true, vendor: true },
  });

  console.log(`Found ${users.length} users in database:`);
  for (const u of users) {
    console.log(`- ID: ${u.id}, Email: ${u.email}, Role: ${u.role}, Customer: ${u.customer?.name || "N/A"}, Vendor: ${u.vendor?.businessName || "N/A"}`);
  }

  // Check passwords
  const checks = [
    { email: "priya@example.com", expectedPw: "Customer@12345", role: "CUSTOMER" },
    { email: "studio@memories.com", expectedPw: "Vendor@12345", role: "VENDOR" },
    { email: "admin@celebratingyou.com", expectedPw: "Admin@12345", role: "ADMIN" },
  ];

  for (const chk of checks) {
    const user = users.find((u) => u.email.toLowerCase() === chk.email.toLowerCase());
    if (!user) {
      console.log(`✗ Missing account: ${chk.email}`);
      continue;
    }
    const match = await bcrypt.compare(chk.expectedPw, user.passwordHash);
    console.log(`✓ Account ${chk.email} (${chk.role}): Password verification => ${match ? "MATCHED (OK)" : "MISMATCH"}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
