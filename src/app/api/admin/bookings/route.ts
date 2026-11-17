import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { checkAndExpireOverdueBookings, transitionBookingStatus } from "@/lib/bookingStateMachine";

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized administrative access" }, { status: 403 });
    }

    // Run 2-hour expiry check
    await checkAndExpireOverdueBookings();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { bookingCode: { contains: search } },
        { customer: { name: { contains: search } } },
        { vendor: { businessName: { contains: search } } },
      ];
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        customer: true,
        vendor: { select: { id: true, businessName: true, vendorCode: true, phone: true, email: true } },
        service: true,
        package: true,
        event: true,
        statusHistory: { orderBy: { timestamp: "desc" } },
        invoices: true,
        payments: { include: { transactions: true } },
        issues: true,
        refunds: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ bookings });
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

    const { bookingId, action, reason, refundAmount } = await req.json();

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payments: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (action === "PROCESS_REFUND") {
      const amountPaise = refundAmount ? Number(refundAmount) * 100 : booking.advancePaid;

      const refund = await prisma.$transaction(async (tx) => {
        const ref = await tx.refund.create({
          data: {
            bookingId: booking.id,
            amount: amountPaise,
            reason: reason || "Admin approved refund",
            status: "PROCESSED",
            approvedByAdminId: session.userId,
            processedAt: new Date(),
            refundRef: `REF-${Date.now()}`,
          },
        });

        await tx.booking.update({
          where: { id: booking.id },
          data: { status: "REFUNDED" },
        });

        await tx.bookingStatusHistory.create({
          data: {
            bookingId: booking.id,
            fromStatus: booking.status,
            toStatus: "REFUNDED",
            changedByRole: "ADMIN",
            changedByUserId: session.userId,
            note: `Refund of ₹${(amountPaise / 100).toLocaleString("en-IN")} processed. Reason: ${reason || "N/A"}`,
          },
        });

        await tx.auditLog.create({
          data: {
            adminId: session.userId,
            action: "ADMIN_REFUND_PROCESSED",
            targetEntity: "Booking",
            targetId: booking.id,
            newValue: `Refund of ₹${amountPaise / 100} approved and processed`,
          },
        });

        return ref;
      });

      return NextResponse.json({ success: true, refund });
    } else if (action === "OVERRIDE_STATUS") {
      const updated = await transitionBookingStatus({
        bookingId: booking.id,
        toStatus: reason as any,
        changedByRole: "ADMIN",
        changedByUserId: session.userId,
        note: `Administrative status override to ${reason}`,
      });

      return NextResponse.json({ success: true, booking: updated });
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

