import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function test() {
  const cust = await prisma.user.findUnique({
    where: { email: "priya@example.com" },
    include: { customer: true },
  });
  console.log("Customer User:", cust?.email, "Role:", cust?.role, "Has Profile:", !!cust?.customer);
  const custPass = await bcrypt.compare("Customer@12345", cust?.passwordHash || "");
  console.log("Customer password matches Customer@12345:", custPass);

  const vend = await prisma.user.findUnique({
    where: { email: "studio@memories.com" },
    include: { vendor: true },
  });
  console.log("Vendor User:", vend?.email, "Role:", vend?.role, "Has Profile:", !!vend?.vendor);
  const vendPass = await bcrypt.compare("Vendor@12345", vend?.passwordHash || "");
  console.log("Vendor password matches Vendor@12345:", vendPass);

  const tplCount = await prisma.eventTemplate.count();
  console.log("Event Templates count in DB:", tplCount);

  await prisma.$disconnect();
}
test().catch(console.error);
