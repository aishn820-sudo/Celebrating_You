import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import CustomerBookingDetailClient from "./CustomerBookingDetailClient";
import { checkAndExpireOverdueBookings } from "@/lib/bookingStateMachine";

export default async function BookingDetailPage({ params }: { params: { id: string } }) {
  const session = await getCurrentUser();
  if (!session || session.role !== "CUSTOMER" || !session.customerId) {
    redirect("/login");
  }

  await checkAndExpireOverdueBookings();

  const booking = await prisma.booking.findFirst({
    where: {
      id: params.id,
      customerId: session.customerId,
    },
    include: {
      service: {
        include: {
          category: true,
          images: true,
        },
      },
      vendor: true,
      package: true,
      event: true,
      statusHistory: { orderBy: { timestamp: "desc" } },
      invoices: {
        include: {
          transaction: true,
        },
        orderBy: { createdAt: "desc" },
      },
      reviews: true,
      issues: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!booking) {
    notFound();
  }

  // Mask vendor contact info unless confirmed
  const sanitized = {
    ...booking,
    vendor: {
      ...booking.vendor,
      phone: booking.isVendorContactRevealed ? booking.vendor.phone : "🔒 Unlocks upon Advance Payment",
      email: booking.isVendorContactRevealed ? booking.vendor.email : "🔒 Unlocks upon Advance Payment",
    },
  };

  return (
    <>
      <Navbar />
      <CustomerBookingDetailClient booking={sanitized} />
    </>
  );
}

