import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized administrative access" }, { status: 403 });
    }

    const [
      totalCustomers,
      totalVendors,
      verifiedVendors,
      pendingVerifications,
      activeEvents,
      bookings,
      transactions,
      settlements,
      refunds,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.vendor.count(),
      prisma.vendor.count({ where: { verificationStatus: "VERIFIED" } }),
      prisma.vendor.count({ where: { verificationStatus: "PENDING" } }),
      prisma.event.count({ where: { status: { in: ["PLANNING", "IN_PROGRESS"] } } }),
      prisma.booking.findMany({ select: { status: true, agreedServiceValue: true, advancePaid: true, finalPaid: true } }),
      prisma.paymentTransaction.findMany({ where: { status: "SUCCESS" }, select: { amount: true, type: true } }),
      prisma.vendorSettlement.findMany({ select: { status: true, platformCommission: true, netSettlementAmount: true } }),
      prisma.refund.findMany({ select: { amount: true, status: true } }),
    ]);

    const totalBookings = bookings.length;
    const pendingBookingRequests = bookings.filter((b) => ["REQUEST_SUBMITTED", "AWAITING_VENDOR_RESPONSE"].includes(b.status)).length;
    const completedBookings = bookings.filter((b) => b.status === "COMPLETED").length;
    const cancelledBookings = bookings.filter((b) => ["CANCELLED", "REFUNDED"].includes(b.status)).length;

    // Financial Metrics (in paise)
    // 1. Gross Booking Value (GBV)
    const totalBookingValue = bookings
      .filter((b) => !["DECLINED", "EXPIRED", "CANCELLED"].includes(b.status))
      .reduce((sum, b) => sum + b.agreedServiceValue, 0);

    // 2. Payments Collected
    const paymentsCollected = transactions
      .filter((t) => t.type !== "REFUND")
      .reduce((sum, t) => sum + t.amount, 0);

    // 3. Platform Commission Earned
    const platformCommissionEarned = settlements.reduce((sum, s) => sum + s.platformCommission, 0);

    // 4. Vendor Settlements Due
    const settlementsDue = settlements
      .filter((s) => s.status === "DUE" || s.status === "PROCESSING")
      .reduce((sum, s) => sum + s.netSettlementAmount, 0);

    // 5. Refunds Total
    const totalRefunds = refunds
      .filter((r) => r.status === "PROCESSED")
      .reduce((sum, r) => sum + r.amount, 0);

    // 6. Net Platform Revenue = Platform Commission Earned - Payment Processing / Operating adjustments
    const paymentGatewayCosts = Math.round((paymentsCollected * 2) / 100); // estimated 2% gateway cost
    const netPlatformRevenue = Math.max(0, platformCommissionEarned - paymentGatewayCosts);

    return NextResponse.json({
      metrics: {
        totalCustomers,
        totalVendors,
        verifiedVendors,
        pendingVerifications,
        activeEvents,
        totalBookings,
        pendingBookingRequests,
        completedBookings,
        cancelledBookings,
        financials: {
          totalBookingValue, // Gross booking value
          paymentsCollected,
          platformCommissionEarned,
          settlementsDue,
          totalRefunds,
          paymentGatewayCosts,
          netPlatformRevenue, // Internal actual platform earnings
        },
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

