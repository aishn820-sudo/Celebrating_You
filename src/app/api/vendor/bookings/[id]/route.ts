import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { transitionBookingStatus } from "@/lib/bookingStateMachine";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "VENDOR" || !session.vendorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { status, note } = await req.json();

    if (!status || !["IN_PROGRESS", "COMPLETED"].includes(status)) {
      return NextResponse.json({ error: "Valid target status is required (IN_PROGRESS or COMPLETED)" }, { status: 400 });
    }

    const booking = await prisma.booking.findFirst({
      where: {
        id: params.id,
        vendorId: session.vendorId,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found or unauthorized" }, { status: 404 });
    }

    const updated = await transitionBookingStatus({
      bookingId: booking.id,
      toStatus: status as any,
      changedByRole: "VENDOR",
      changedByUserId: session.userId,
      note: note || `Vendor transitioned service status to ${status}`,
    });

    return NextResponse.json({ success: true, booking: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

