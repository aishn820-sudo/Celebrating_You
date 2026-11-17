import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { checkAndExpireOverdueBookings } from "@/lib/bookingStateMachine";

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "VENDOR" || !session.vendorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Enforce 2-hour rule on the backend automatically
    await checkAndExpireOverdueBookings();

    const bookings = await prisma.booking.findMany({
      where: { vendorId: session.vendorId },
      include: {
        event: true,
        service: true,
        package: true,
        customer: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
            phone: true,
            email: true,
          },
        },
        invoices: true,
        issues: true,
        reviews: true,
      },
      orderBy: { createdAt: "desc" },
    });

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
          // Mask until acceptance AND advance payment confirmed!
          phone: b.isCustomerContactRevealed ? b.customer.phone : "🔒 Unlocks upon Advance Payment",
          email: b.isCustomerContactRevealed ? b.customer.email : "🔒 Unlocks upon Advance Payment",
        },
      };
    });

    return NextResponse.json({ bookings: sanitized });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

