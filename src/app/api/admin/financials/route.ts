import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized administrative access" }, { status: 403 });
    }

    const [bookings, transactions, settlements, refunds, commissionSettings] = await Promise.all([
      prisma.booking.findMany({
        select: {
          id: true,
          bookingCode: true,
          agreedServiceValue: true,
          advancePaid: true,
          finalPaid: true,
          finalBalanceDue: true,
          status: true,
          createdAt: true,
          vendor: { select: { businessName: true, commissionRate: true } },
        },
      }),
      prisma.paymentTransaction.findMany({
        where: { status: "SUCCESS" },
        include: { booking: { select: { bookingCode: true } } },
      }),
      prisma.vendorSettlement.findMany({
        include: {
          vendor: { select: { businessName: true, bankAccountNumber: true, bankIfsc: true } },
          booking: { select: { bookingCode: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.refund.findMany({
        include: { booking: { select: { bookingCode: true } } },
      }),
      prisma.commissionSetting.findMany({
        include: { category: true },
      }),
    ]);

    const totalBookingValue = bookings
      .filter((b) => !["DECLINED", "EXPIRED", "CANCELLED"].includes(b.status))
      .reduce((sum, b) => sum + b.agreedServiceValue, 0);

    const advancePaymentsTotal = bookings.reduce((sum, b) => sum + b.advancePaid, 0);
    const finalPaymentsTotal = bookings.reduce((sum, b) => sum + b.finalPaid, 0);
    const totalCollected = advancePaymentsTotal + finalPaymentsTotal;

    const platformCommission = settlements.reduce((sum, s) => sum + s.platformCommission, 0);
    const vendorSettlementsPaid = settlements
      .filter((s) => s.status === "SETTLED")
      .reduce((sum, s) => sum + s.netSettlementAmount, 0);

    const vendorSettlementsDue = settlements
      .filter((s) => s.status === "DUE" || s.status === "PROCESSING")
      .reduce((sum, s) => sum + s.netSettlementAmount, 0);

    const refundsTotal = refunds
      .filter((r) => r.status === "PROCESSED")
      .reduce((sum, r) => sum + r.amount, 0);

    const paymentProcessingCosts = Math.round((totalCollected * 2) / 100);
    const netPlatformRevenue = Math.max(0, platformCommission - paymentProcessingCosts);

    return NextResponse.json({
      metrics: {
        totalBookingValue,
        totalCollected,
        advancePaymentsTotal,
        finalPaymentsTotal,
        platformCommission,
        vendorSettlementsPaid,
        vendorSettlementsDue,
        refundsTotal,
        paymentProcessingCosts,
        netPlatformRevenue,
      },
      settlements,
      refunds,
      commissionSettings,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized administrative access" }, { status: 403 });
    }

    const { settlementId, action, remarks } = await req.json();

    if (action === "SETTLE") {
      const settlement = await prisma.vendorSettlement.update({
        where: { id: settlementId },
        data: {
          status: "SETTLED",
          settledAt: new Date(),
          settlementRef: `SETTLE-ADM-${Date.now()}`,
          remarks: remarks || "Settlement disbursed by Admin",
        },
      });

      await prisma.auditLog.create({
        data: {
          adminId: session.userId,
          action: "VENDOR_SETTLEMENT_PROCESSED",
          targetEntity: "VendorSettlement",
          targetId: settlementId,
          newValue: `Settled ₹${settlement.netSettlementAmount / 100}`,
        },
      });

      return NextResponse.json({ success: true, settlement });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

