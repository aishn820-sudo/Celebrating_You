import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { transitionBookingStatus } from "@/lib/bookingStateMachine";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "VENDOR" || !session.vendorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { decision, reason } = await req.json();

    if (!decision || !["ACCEPT", "DECLINE"].includes(decision)) {
      return NextResponse.json({ error: "Decision must be ACCEPT or DECLINE" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        vendor: true,
        customer: true,
        service: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.vendorId !== session.vendorId) {
      return NextResponse.json({ error: "Forbidden: Not your booking" }, { status: 403 });
    }

    // Verify booking is still awaiting response
    if (!["REQUEST_SUBMITTED", "AWAITING_VENDOR_RESPONSE"].includes(booking.status)) {
      return NextResponse.json(
        { error: `Cannot respond to booking in '${booking.status}' status` },
        { status: 400 }
      );
    }

    // Check if response deadline has expired
    if (booking.responseDeadlineAt && new Date() > new Date(booking.responseDeadlineAt)) {
      await transitionBookingStatus({
        bookingId: booking.id,
        toStatus: "EXPIRED",
        changedByRole: "SYSTEM",
        note: "Automatically expired: Vendor exceeded 2-hour response SLA window",
      });
      return NextResponse.json(
        { error: "The 2-hour response window for this request has expired" },
        { status: 400 }
      );
    }

    if (decision === "ACCEPT") {
      const updated = await transitionBookingStatus({
        bookingId: booking.id,
        toStatus: "ACCEPTED_AWAITING_ADVANCE",
        changedByRole: "VENDOR",
        changedByUserId: session.userId,
        note: "Vendor accepted the booking request within 2-hour SLA",
      });

      return NextResponse.json({
        success: true,
        message: "Booking request accepted! Customer has been notified to complete the advance payment.",
        booking: updated,
      });
    } else {
      // DECLINE
      if (!reason) {
        return NextResponse.json({ error: "Please provide a reason for declining" }, { status: 400 });
      }

      // Check rolling 7-day decline count against policy
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentDeclines = await prisma.booking.count({
        where: {
          vendorId: booking.vendorId,
          status: "DECLINED",
          declinedAt: { gte: sevenDaysAgo },
        },
      });

      const maxDeclines = booking.vendor.maxWeeklyDeclines || 3;
      let warning: string | null = null;

      if (recentDeclines + 1 > maxDeclines) {
        warning = `Policy Alert: You have recorded ${recentDeclines + 1} declines in the past 7 days, exceeding the policy limit of ${maxDeclines}. This event has been logged for quality review.`;
        await prisma.auditLog.create({
          data: {
            action: "EXCESSIVE_VENDOR_DECLINES_WARNING",
            targetEntity: "Vendor",
            targetId: booking.vendorId,
            newValue: `Vendor recorded ${recentDeclines + 1} declines in 7 days (limit: ${maxDeclines}). Decline reason: ${reason}`,
          },
        });
      } else if (recentDeclines + 1 === maxDeclines) {
        warning = `Notice: You have reached ${maxDeclines} of ${maxDeclines} permitted declines for this 7-day period. Further declines may affect marketplace priority.`;
      }

      const updated = await transitionBookingStatus({
        bookingId: booking.id,
        toStatus: "DECLINED",
        changedByRole: "VENDOR",
        changedByUserId: session.userId,
        declineReason: reason,
        note: `Vendor declined: ${reason}`,
      });

      return NextResponse.json({
        success: true,
        message: "Booking declined.",
        warning,
        booking: updated,
      });
    }
  } catch (err: any) {
    console.error("Vendor respond error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

