import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { processPaymentSuccess } from "@/lib/paymentService";

export async function POST(req: NextRequest) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return NextResponse.json(
        {
          status: "MOCK_MODE_ACTIVE",
          message: "Razorpay live webhook secret is not set in environment. Live gateway transactions require verified merchant credentials.",
        },
        { status: 503 }
      );
    }

    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature header" }, { status: 400 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const { event: eventType, payload } = event;

    if (eventType === "payment.captured") {
      const paymentEntity = payload.payment.entity;
      const bookingId = paymentEntity.notes?.bookingId;
      const type = paymentEntity.notes?.type as "ADVANCE" | "FINAL";
      const paymentId = paymentEntity.id;
      const amount = paymentEntity.amount; // in paise

      if (!bookingId || !type) {
        return NextResponse.json({ error: "Booking metadata missing in payment notes" }, { status: 400 });
      }

      // Check idempotency: if transaction already logged, return 200 OK
      const existingTxn = await prisma.paymentTransaction.findFirst({
        where: { gatewayPaymentId: paymentId },
      });

      if (existingTxn && existingTxn.status === "SUCCESS") {
        return NextResponse.json({ success: true, message: "Webhook already processed" });
      }

      // Process live confirmed payment
      await processPaymentSuccess({
        bookingId,
        type,
        amount,
        gatewayProvider: "RAZORPAY",
        gatewayOrderId: paymentEntity.order_id,
        gatewayPaymentId: paymentId,
        idempotencyKey: `razorpay_${paymentId}`,
      });

      return NextResponse.json({ success: true, message: "Payment captured and reconciled" });
    } else if (eventType === "payment.failed") {
      const paymentEntity = payload.payment.entity;
      const bookingId = paymentEntity.notes?.bookingId;

      if (bookingId) {
        const payment = await prisma.payment.findFirst({ where: { bookingId } });
        if (payment) {
          // Log failed transaction — strictly NO invoice generated for failed payments
          await prisma.paymentTransaction.create({
            data: {
              paymentId: payment.id,
              bookingId,
              transactionRef: `CY-TXN-FAILED-${Date.now()}`,
              type: (paymentEntity.notes?.type as "ADVANCE" | "FINAL") || "ADVANCE",
              amount: paymentEntity.amount || 0,
              status: "FAILED",
              gatewayProvider: "RAZORPAY",
              gatewayPaymentId: paymentEntity.id,
            },
          });
        }
      }

      return NextResponse.json({ success: true, message: "Failed payment recorded without invoice generation" });
    }

    return NextResponse.json({ success: true, message: `Event ${eventType} received` });
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

