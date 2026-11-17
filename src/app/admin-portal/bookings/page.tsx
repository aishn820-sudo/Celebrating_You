import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import AdminNav from "@/components/AdminNav";
import AdminBookingsClient from "./AdminBookingsClient";
import { checkAndExpireOverdueBookings } from "@/lib/bookingStateMachine";

export default async function AdminBookingsPage() {
  const session = await getCurrentUser();
  if (!session || session.role !== "ADMIN") {
    redirect("/admin-portal/login");
  }

  await checkAndExpireOverdueBookings();

  const bookings = await prisma.booking.findMany({
    include: {
      customer: true,
      vendor: true,
      service: true,
      package: true,
      event: true,
      statusHistory: { orderBy: { timestamp: "desc" } },
      invoices: true,
      refunds: true,
      issues: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-warm-50 text-stone-900 font-sans antialiased selection:bg-rose-100 selection:text-rose-900">
      <AdminNav />
      <AdminBookingsClient initialBookings={bookings} />
    </div>
  );
}
