import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { transitionBookingStatus } from "@/lib/bookingStateMachine";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "CUSTOMER" || !session.customerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const booking = await prisma.booking.findFirst({
      where: {
        id: params.id,
        customerId: session.customerId,
      },
      include: {
        event: true,
        service: {
          include: {
            category: true,
            images: true,
          },
        },
        vendor: true,
        package: true,
        statusHistory: { orderBy: { timestamp: "desc" } },
        invoices: { orderBy: { createdAt: "desc" } },
        payments: {
          include: {
            transactions: { orderBy: { createdAt: "desc" } },
          },
        },
        reviews: true,
        issues: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Mask contact if not yet revealed
    const responseBooking = {
      ...booking,
      vendor: {
        ...booking.vendor,
        phone: booking.isVendorContactRevealed ? booking.vendor.phone : "🔒 Unlocks on Advance Payment",
        email: booking.isVendorContactRevealed ? booking.vendor.email : "🔒 Unlocks on Advance Payment",
        bankAccountNumber: undefined,
        bankIfsc: undefined,
        bankName: undefined,
      },
    };

    return NextResponse.json({ booking: responseBooking });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "CUSTOMER" || !session.customerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, cancellationReason } = await req.json();

    // Verify booking belongs to this customer
    const booking = await prisma.booking.findFirst({
      where: {
        id: params.id,
        customerId: session.customerId,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found or unauthorized" }, { status: 404 });
    }

    if (action === "CANCEL") {
      const updated = await transitionBookingStatus({
        bookingId: params.id,
        toStatus: "CANCELLED",
        changedByRole: "CUSTOMER",
        changedByUserId: session.userId,
        cancellationReason: cancellationReason || "Customer cancelled booking",
      });
      return NextResponse.json({ success: true, booking: updated });
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

