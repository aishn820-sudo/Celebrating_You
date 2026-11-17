import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import CustomerBookingsClient from "./CustomerBookingsClient";
import { checkAndExpireOverdueBookings } from "@/lib/bookingStateMachine";

export default async function CustomerBookingsPage() {
  const session = await getCurrentUser();
  if (!session || session.role !== "CUSTOMER" || !session.customerId) {
    redirect("/login");
  }

  // Trigger 2-hour backend expiry check
  await checkAndExpireOverdueBookings();

  const bookings = await prisma.booking.findMany({
    where: { customerId: session.customerId },
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

  // Mask contact info if advance has not been confirmed!
  const sanitized = bookings.map((b) => ({
    ...b,
    vendor: {
      ...b.vendor,
      phone: b.isVendorContactRevealed ? b.vendor.phone : "🔒 Unlocks upon Advance Payment",
      email: b.isVendorContactRevealed ? b.vendor.email : "🔒 Unlocks upon Advance Payment",
    },
  }));

  return (
    <>
      <Navbar />
      <CustomerBookingsClient initialBookings={sanitized} />
    </>
  );
}

