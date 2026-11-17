import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "VENDOR" || !session.vendorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [bookings, blockedDates] = await Promise.all([
      prisma.booking.findMany({
        where: {
          vendorId: session.vendorId,
          status: { in: ["CONFIRMED", "IN_PROGRESS", "ACCEPTED_AWAITING_ADVANCE", "REQUEST_SUBMITTED"] },
        },
        select: {
          id: true,
          bookingCode: true,
          eventDate: true,
          status: true,
          service: { select: { title: true } },
          event: { select: { title: true, eventTime: true, locationAddress: true } },
        },
      }),
      prisma.serviceAvailability.findMany({
        where: { vendorId: session.vendorId, isBlocked: true },
        select: { id: true, date: true, reason: true },
      }),
    ]);

    return NextResponse.json({ bookings, blockedDates });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "VENDOR" || !session.vendorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { date, reason, action } = await req.json();

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    if (action === "UNBLOCK") {
      await prisma.serviceAvailability.deleteMany({
        where: { vendorId: session.vendorId, date },
      });
      return NextResponse.json({ success: true, message: `Date ${date} unblocked` });
    } else {
      // Check if already booked
      const existingBooking = await prisma.booking.findFirst({
        where: {
          vendorId: session.vendorId,
          eventDate: date,
          status: { in: ["CONFIRMED", "IN_PROGRESS"] },
        },
      });

      if (existingBooking) {
        return NextResponse.json({ error: `Cannot block ${date} as there is an active confirmed booking` }, { status: 400 });
      }

      const blocked = await prisma.serviceAvailability.create({
        data: {
          vendorId: session.vendorId,
          date,
          isBlocked: true,
          reason: reason || "Vendor unavailable",
        },
      });

      return NextResponse.json({ success: true, blocked });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

