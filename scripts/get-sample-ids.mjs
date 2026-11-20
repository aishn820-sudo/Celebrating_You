import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function get() {
  const service = await prisma.service.findFirst({ where: { status: "PUBLISHED" } });
  const event = await prisma.event.findFirst();
  const booking = await prisma.booking.findFirst();
  console.log(JSON.stringify({
    serviceId: service?.id,
    eventId: event?.id,
    bookingId: booking?.id,
  }));
  await prisma.$disconnect();
}
get();
