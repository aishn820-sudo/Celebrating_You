import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import VendorNav from "@/components/VendorNav";
import VendorCalendarClient from "./VendorCalendarClient";

export default async function VendorCalendarPage() {
  const session = await getCurrentUser();
  if (!session || session.role !== "VENDOR" || !session.vendorId) {
    redirect("/login");
  }

  const [vendor, bookings, blockedDates] = await Promise.all([
    prisma.vendor.findUnique({
      where: { id: session.vendorId },
      include: { category: true },
    }),
    prisma.booking.findMany({
      where: {
        vendorId: session.vendorId,
        status: { in: ["CONFIRMED", "IN_PROGRESS", "ACCEPTED_AWAITING_ADVANCE", "REQUEST_SUBMITTED"] },
      },
      include: {
        service: true,
        customer: true,
        event: true,
      },
      orderBy: { eventDate: "asc" },
    }),
    prisma.serviceAvailability.findMany({
      where: { vendorId: session.vendorId, isBlocked: true },
      orderBy: { date: "asc" },
    }),
  ]);

  if (!vendor) redirect("/login");

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-warm-50 dark:bg-dark-bg text-stone-800 dark:text-dark-text-primary font-sans">
      <VendorNav vendor={vendor} />
      <VendorCalendarClient vendor={vendor} bookings={bookings} blockedDates={blockedDates} />
    </div>
  );
}
