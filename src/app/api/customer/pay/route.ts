import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { processPaymentSuccess } from "@/lib/paymentService";

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "CUSTOMER" || !session.customerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookingId, type, idempotencyKey } = await req.json();

    if (!bookingId || !type || !["ADVANCE", "FINAL"].includes(type)) {
      return NextResponse.json({ error: "Booking ID and valid payment type are required" }, { status: 400 });
    }

    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        customerId: session.customerId,
      },
      include: {
        vendor: true,
        service: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Determine amount to charge
    let amount = 0;
    if (type === "ADVANCE") {
      if (booking.advancePaid > 0) {
        return NextResponse.json({ error: "Advance has already been paid for this booking" }, { status: 400 });
      }
      amount = booking.advanceRequired;
    } else if (type === "FINAL") {
      if (booking.finalBalanceDue <= 0) {
        return NextResponse.json({ error: "No remaining balance due for this booking" }, { status: 400 });
      }
      amount = booking.finalBalanceDue;
    }

    // Process payment in sandbox mode (or razorpay if env keys configured)
    const result = await processPaymentSuccess({
      bookingId: booking.id,
      type,
      amount,
      gatewayProvider: "SANDBOX",
      idempotencyKey: idempotencyKey || `idem_${booking.id}_${type}_${Date.now()}`,
    });

    return NextResponse.json({
      success: true,
      message: `${type === "ADVANCE" ? "Advance" : "Final"} payment of ₹${(amount / 100).toLocaleString("en-IN")} completed successfully!`,
      transaction: result.transaction,
      invoice: result.invoice,
    });
  } catch (err: any) {
    console.error("Payment error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

