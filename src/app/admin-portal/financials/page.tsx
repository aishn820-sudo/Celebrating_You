import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import AdminNav from "@/components/AdminNav";
import AdminFinancialsClient from "./AdminFinancialsClient";

export default async function AdminFinancialsPage() {
  const session = await getCurrentUser();
  if (!session || session.role !== "ADMIN") {
    redirect("/admin-portal/login");
  }

  const [bookings, settlements, refunds, commissionSettings] = await Promise.all([
    prisma.booking.findMany({
      include: { vendor: true, customer: true },
    }),
    prisma.vendorSettlement.findMany({
      include: {
        vendor: true,
        booking: { select: { bookingCode: true, eventDate: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.refund.findMany({
      include: { booking: { select: { bookingCode: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.commissionSetting.findMany({
      include: { category: true },
    }),
  ]);

  const totalBookingValue = bookings
    .filter((b) => !["DECLINED", "EXPIRED", "CANCELLED"].includes(b.status))
    .reduce((sum, b) => sum + b.agreedServiceValue, 0);

  const advanceTotal = bookings.reduce((sum, b) => sum + b.advancePaid, 0);
  const finalTotal = bookings.reduce((sum, b) => sum + b.finalPaid, 0);
  const totalCollected = advanceTotal + finalTotal;

  const platformCommission = settlements.reduce((sum, s) => sum + s.platformCommission, 0);
  const settlementsPaid = settlements
    .filter((s) => s.status === "SETTLED")
    .reduce((sum, s) => sum + s.netSettlementAmount, 0);

  const settlementsDue = settlements
    .filter((s) => s.status === "DUE" || s.status === "PROCESSING")
    .reduce((sum, s) => sum + s.netSettlementAmount, 0);

  const totalRefunds = refunds
    .filter((r) => r.status === "PROCESSED")
    .reduce((sum, r) => sum + r.amount, 0);

  const paymentGatewayCosts = Math.round((totalCollected * 2) / 100);
  const netPlatformRevenue = Math.max(0, platformCommission - paymentGatewayCosts);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-warm-50 text-stone-900 font-sans antialiased selection:bg-rose-100 selection:text-rose-900">
      <AdminNav />
      <AdminFinancialsClient
        metrics={{
          totalBookingValue,
          totalCollected,
          advanceTotal,
          finalTotal,
          platformCommission,
          settlementsPaid,
          settlementsDue,
          totalRefunds,
          paymentGatewayCosts,
          netPlatformRevenue,
        }}
        settlements={settlements}
        refunds={refunds}
        commissionSettings={commissionSettings}
      />
    </div>
  );
}
