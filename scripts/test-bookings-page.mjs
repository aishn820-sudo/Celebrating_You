import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function test() {
  const customer = await prisma.customer.findFirst({
    include: { user: true },
  });
  console.log("Found customer:", customer?.user?.email, "ID:", customer?.id);

  if (!customer) {
    console.error("No customer found!");
    return;
  }

  const bookings = await prisma.booking.findMany({
    where: { customerId: customer.id },
    include: {
      service: {
        include: {
          category: true,
          images: true,
        },
      },
      vendor: {
        select: {
          id: true,
          businessName: true,
          city: true,
          state: true,
          phone: true,
          email: true,
          rating: true,
        },
      },
      package: true,
      event: true,
      invoices: {
        include: {
          transaction: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  console.log("Fetched bookings count:", bookings.length);

  const sanitized = bookings.map((b) => ({
    ...b,
    vendor: {
      ...b.vendor,
      phone: b.isVendorContactRevealed ? b.vendor.phone : "🔒 Unlocks upon Advance Payment",
      email: b.isVendorContactRevealed ? b.vendor.email : "🔒 Unlocks upon Advance Payment",
    },
  }));

  console.log("Sanitization succeeded! Booking IDs:", sanitized.map(b => b.id));
}

test()
  .catch((e) => console.error("TEST FAILED:", e))
  .finally(() => prisma.$disconnect());
