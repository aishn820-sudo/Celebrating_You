import prisma from "./prisma";
import { transitionBookingStatus } from "./bookingStateMachine";
import { generateInvoiceForTransaction } from "./invoiceGenerator";
import { sendNotification } from "./notificationService";

export interface ProcessPaymentParams {
  bookingId: string;
  type: "ADVANCE" | "FINAL";
  amount: number; // in paise
  gatewayProvider?: "SANDBOX" | "RAZORPAY" | "MANUAL";
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  gatewaySignature?: string;
  idempotencyKey?: string;
}

export async function processPaymentSuccess({
  bookingId,
  type,
  amount,
  gatewayProvider = "SANDBOX",
  gatewayOrderId,
  gatewayPaymentId,
  gatewaySignature,
  idempotencyKey,
}: ProcessPaymentParams) {
  // Check for idempotency
  if (idempotencyKey) {
    const existing = await prisma.paymentTransaction.findUnique({
      where: { idempotencyKey },
    });
    if (existing && existing.status === "SUCCESS") {
      return { transaction: existing, alreadyProcessed: true };
    }
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      customer: true,
      vendor: true,
      service: true,
      payments: true,
    },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  const now = new Date();
  const txnRef = `CY-TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  // Find or create Payment master record
  let paymentRecord = booking.payments[0];
  if (!paymentRecord) {
    paymentRecord = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        customerId: booking.customerId,
        totalAmount: booking.agreedServiceValue,
        paidAmount: 0,
        pendingAmount: booking.agreedServiceValue,
        status: "PENDING",
      },
    });
  }

  // Execute database transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create Transaction
    const transaction = await tx.paymentTransaction.create({
      data: {
        paymentId: paymentRecord.id,
        bookingId: booking.id,
        transactionRef: txnRef,
        type,
        amount,
        currency: "INR",
        status: "SUCCESS",
        gatewayProvider,
        gatewayOrderId,
        gatewayPaymentId: gatewayPaymentId || `pay_mock_${Date.now()}`,
        gatewaySignature,
        idempotencyKey,
        paidAt: now,
      },
    });

    // 2. Update booking balances & status
    if (type === "ADVANCE") {
      const newAdvancePaid = booking.advancePaid + amount;
      const newBalanceDue = Math.max(0, booking.agreedServiceValue - newAdvancePaid);

      await tx.booking.update({
        where: { id: booking.id },
        data: {
          advancePaid: newAdvancePaid,
          finalBalanceDue: newBalanceDue,
        },
      });

      // Update payment record
      await tx.payment.update({
        where: { id: paymentRecord.id },
        data: {
          paidAmount: newAdvancePaid,
          pendingAmount: newBalanceDue,
          status: newBalanceDue === 0 ? "FULLY_PAID" : "PARTIALLY_PAID",
        },
      });
    } else if (type === "FINAL") {
      const newFinalPaid = booking.finalPaid + amount;
      const newBalanceDue = Math.max(0, booking.finalBalanceDue - amount);

      await tx.booking.update({
        where: { id: booking.id },
        data: {
          finalPaid: newFinalPaid,
          finalBalanceDue: newBalanceDue,
        },
      });

      // Update payment record
      await tx.payment.update({
        where: { id: paymentRecord.id },
        data: {
          paidAmount: booking.advancePaid + newFinalPaid,
          pendingAmount: newBalanceDue,
          status: newBalanceDue === 0 ? "FULLY_PAID" : "PARTIALLY_PAID",
        },
      });

      // Create vendor settlement record when final payment is received
      let commissionPercent = booking.vendor.commissionRate;
      if (commissionPercent == null && booking.vendor.categoryId) {
        const catSetting = await tx.commissionSetting.findFirst({
          where: { categoryId: booking.vendor.categoryId },
        });
        if (catSetting) {
          commissionPercent = catSetting.defaultCommissionPercent;
        }
      }
      if (commissionPercent == null) {
        const defaultSetting = await tx.commissionSetting.findFirst({
          where: { isDefault: true },
        });
        commissionPercent = defaultSetting ? defaultSetting.defaultCommissionPercent : 10.0;
      }
      const platformCommission = Math.round((booking.agreedServiceValue * commissionPercent) / 100);
      const netSettlement = booking.agreedServiceValue - platformCommission;

      await tx.vendorSettlement.create({
        data: {
          vendorId: booking.vendorId,
          bookingId: booking.id,
          grossAmount: booking.agreedServiceValue,
          platformCommission,
          commissionPercent,
          netSettlementAmount: netSettlement,
          status: "DUE",
          remarks: "Settlement calculated upon completion of full booking payment",
        },
      });
    }

    return transaction;
  });

  // Generate invoice strictly after successful confirmation
  const invoice = await generateInvoiceForTransaction({
    bookingId: booking.id,
    transactionId: result.id,
    type,
  });

  // If this was an advance payment and status was ACCEPTED_AWAITING_ADVANCE, transition to CONFIRMED
  if (type === "ADVANCE" && booking.status === "ACCEPTED_AWAITING_ADVANCE") {
    await transitionBookingStatus({
      bookingId: booking.id,
      toStatus: "CONFIRMED",
      changedByRole: "SYSTEM",
      note: `Advance payment of ₹${(amount / 100).toLocaleString("en-IN")} received via ${gatewayProvider}. Booking confirmed.`,
    });
  }

  // Send notifications
  await sendNotification({
    userId: booking.customer.userId,
    role: "CUSTOMER",
    title: `Payment Successful (₹${(amount / 100).toLocaleString("en-IN")})`,
    message: `${type === "ADVANCE" ? "Advance" : "Final"} payment for booking #${booking.bookingCode} succeeded. Invoice #${invoice.invoiceNumber} is generated.`,
    link: `/customer/bookings/${booking.id}`,
    type: "PAYMENT",
  });

  await sendNotification({
    userId: booking.vendor.userId,
    role: "VENDOR",
    title: `Payment Received (₹${(amount / 100).toLocaleString("en-IN")})`,
    message: `${type === "ADVANCE" ? "Advance" : "Final"} payment received for booking #${booking.bookingCode}.`,
    link: `/vendor/invoices`,
    type: "PAYMENT",
  });

  return { transaction: result, invoice, alreadyProcessed: false };
}

export async function processPaymentFailure({
  bookingId,
  type,
  amount,
  gatewayProvider = "SANDBOX",
  gatewayOrderId,
  gatewayPaymentId,
  failureReason,
  idempotencyKey,
}: {
  bookingId: string;
  type: "ADVANCE" | "FINAL";
  amount: number;
  gatewayProvider?: "SANDBOX" | "RAZORPAY" | "MANUAL";
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  failureReason?: string;
  idempotencyKey?: string;
}) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { payments: true },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  let paymentRecord = booking.payments[0];
  if (!paymentRecord) {
    paymentRecord = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        customerId: booking.customerId,
        totalAmount: booking.agreedServiceValue,
        paidAmount: 0,
        pendingAmount: booking.agreedServiceValue,
        status: "PENDING",
      },
    });
  }

  const txnRef = `CY-TXN-FAIL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const transaction = await prisma.paymentTransaction.create({
    data: {
      paymentId: paymentRecord.id,
      bookingId: booking.id,
      transactionRef: txnRef,
      type,
      amount,
      currency: "INR",
      status: "FAILED",
      gatewayProvider,
      gatewayOrderId,
      gatewayPaymentId,
      idempotencyKey,
    },
  });

  // Note: NO invoice is generated, NO booking balances are altered, and NO status transition occurs.
  return { transaction, failureReason: failureReason || "Payment transaction marked as failed." };
}


