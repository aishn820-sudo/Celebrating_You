import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import VendorNav from "@/components/VendorNav";
import VendorBookingsClient from "./VendorBookingsClient";
import { checkAndExpireOverdueBookings } from "@/lib/bookingStateMachine";

export default async function VendorBookingsPage() {
  const session = await getCurrentUser();
  if (!session || session.role !== "VENDOR" || !session.vendorId) {
    redirect("/login");
  }

  // Enforce 2-hour rule backend check
  await checkAndExpireOverdueBookings();

  const [vendor, bookings] = await Promise.all([
    prisma.vendor.findUnique({
      where: { id: session.vendorId },
      include: { category: true },
    }),
    prisma.booking.findMany({
      where: { vendorId: session.vendorId },
      include: {
        customer: true,
        service: true,
        package: true,
        event: true,
        invoices: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!vendor) redirect("/login");

  const now = Date.now();

  // Sanitize customer contact details according to contact privacy rule!
  const sanitized = bookings.map((b) => {
    let timeRemainingSeconds = 0;
    if (b.responseDeadlineAt && ["REQUEST_SUBMITTED", "AWAITING_VENDOR_RESPONSE"].includes(b.status)) {
      timeRemainingSeconds = Math.max(0, Math.floor((new Date(b.responseDeadlineAt).getTime() - now) / 1000));
    }

    return {
      ...b,
      timeRemainingSeconds,
      customer: {
        ...b.customer,
        phone: b.isCustomerContactRevealed ? b.customer.phone : "🔒 Unlocks on Advance Payment",
        email: b.isCustomerContactRevealed ? b.customer.email : "🔒 Unlocks on Advance Payment",
      },
    };
  });

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-warm-50 text-stone-800 font-sans">
      <VendorNav vendor={vendor} />
      <VendorBookingsClient initialBookings={sanitized} vendor={vendor} />
    </div>
  );
}
