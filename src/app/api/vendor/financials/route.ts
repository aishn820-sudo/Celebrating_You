import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "VENDOR" || !session.vendorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [bookings, settlements, vendor] = await Promise.all([
      prisma.booking.findMany({
        where: { vendorId: session.vendorId },
        include: { invoices: true, transactions: true },
      }),
      prisma.vendorSettlement.findMany({
        where: { vendorId: session.vendorId },
        include: {
          booking: {
            select: { bookingCode: true, eventDate: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.vendor.findUnique({
        where: { id: session.vendorId },
        select: {
          commissionRate: true,
          bankAccountNumber: true,
          bankIfsc: true,
          bankName: true,
          accountHolderName: true,
        },
      }),
    ]);

    let totalAgreedValue = 0;
    let advanceReceived = 0;
    let finalReceived = 0;
    let pendingBalance = 0;

    for (const b of bookings) {
      if (!["DECLINED", "EXPIRED", "CANCELLED"].includes(b.status)) {
        totalAgreedValue += b.agreedServiceValue;
        advanceReceived += b.advancePaid;
        finalReceived += b.finalPaid;
        pendingBalance += b.finalBalanceDue;
      }
    }

    const totalSettled = settlements
      .filter((s) => s.status === "SETTLED")
      .reduce((sum, s) => sum + s.netSettlementAmount, 0);

    const totalSettlementDue = settlements
      .filter((s) => s.status === "DUE" || s.status === "PROCESSING")
      .reduce((sum, s) => sum + s.netSettlementAmount, 0);

    const totalCommissionDeducted = settlements.reduce((sum, s) => sum + s.platformCommission, 0);

    return NextResponse.json({
      summary: {
        totalAgreedValue,
        advanceReceived,
        finalReceived,
        totalCollected: advanceReceived + finalReceived,
        pendingBalance,
        totalSettled,
        totalSettlementDue,
        totalCommissionDeducted,
        commissionRate: vendor?.commissionRate || 10,
      },
      payoutAccount: {
        bankName: vendor?.bankName,
        accountHolderName: vendor?.accountHolderName,
        accountNumberMasked: vendor?.bankAccountNumber
          ? `•••• •••• ${vendor.bankAccountNumber.slice(-4)}`
          : "Not Added",
        ifsc: vendor?.bankIfsc,
      },
      settlements,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

