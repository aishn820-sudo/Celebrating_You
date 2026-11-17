import prisma from "./prisma";
import { sendNotification } from "./notificationService";

export type BookingStatus =
  | "DRAFT"
  | "REQUEST_SUBMITTED"
  | "AWAITING_VENDOR_RESPONSE"
  | "ACCEPTED_AWAITING_ADVANCE"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "DECLINED"
  | "EXPIRED"
  | "CANCELLED"
  | "REFUND_PENDING"
  | "REFUNDED"
  | "DISPUTED";

// Allowed transitions
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["REQUEST_SUBMITTED", "CANCELLED"],
  REQUEST_SUBMITTED: ["AWAITING_VENDOR_RESPONSE", "ACCEPTED_AWAITING_ADVANCE", "DECLINED", "EXPIRED", "CANCELLED"],
  AWAITING_VENDOR_RESPONSE: ["ACCEPTED_AWAITING_ADVANCE", "DECLINED", "EXPIRED", "CANCELLED"],
  ACCEPTED_AWAITING_ADVANCE: ["CONFIRMED", "EXPIRED", "CANCELLED"],
  CONFIRMED: ["IN_PROGRESS", "COMPLETED", "CANCELLED", "DISPUTED"],
  IN_PROGRESS: ["COMPLETED", "DISPUTED"],
  COMPLETED: ["DISPUTED"],
  DECLINED: [],
  EXPIRED: ["REQUEST_SUBMITTED"], // Can be reactivated by customer
  CANCELLED: ["REFUND_PENDING", "REFUNDED"],
  REFUND_PENDING: ["REFUNDED"],
  REFUNDED: [],
  DISPUTED: ["IN_PROGRESS", "COMPLETED", "REFUND_PENDING", "CANCELLED"],
};

export async function checkAndExpireOverdueBookings() {
  const now = new Date();
  const overdueBookings = await prisma.booking.findMany({
    where: {
      status: { in: ["REQUEST_SUBMITTED", "AWAITING_VENDOR_RESPONSE"] },
      responseDeadlineAt: { lte: now },
    },
    include: { customer: true, vendor: true, service: true },
  });

  for (const booking of overdueBookings) {
    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: booking.id },
        data: { status: "EXPIRED" },
      });

      await tx.bookingStatusHistory.create({
        data: {
          bookingId: booking.id,
          fromStatus: booking.status,
          toStatus: "EXPIRED",
          changedByRole: "SYSTEM",
          note: "Auto-expired: Vendor did not respond within the mandatory 2-hour window.",
        },
      });
    });

    // Notify customer
    await sendNotification({
      userId: booking.customer.userId,
      role: "CUSTOMER",
      title: "Booking Request Expired",
      message: `Your booking request #${booking.bookingCode} for "${booking.service.title}" was not accepted within the 2-hour window and has expired.`,
      link: `/customer/bookings/${booking.id}`,
      type: "ALERT",
    });

    // Notify vendor
    await sendNotification({
      userId: booking.vendor.userId,
      role: "VENDOR",
      title: "Booking Request Missed",
      message: `Booking request #${booking.bookingCode} expired because response deadline passed.`,
      link: `/vendor/bookings`,
      type: "ALERT",
    });
  }
}

export async function transitionBookingStatus({
  bookingId,
  toStatus,
  changedByRole,
  changedByUserId,
  note,
  declineReason,
  cancellationReason,
}: {
  bookingId: string;
  toStatus: BookingStatus;
  changedByRole: "CUSTOMER" | "VENDOR" | "ADMIN" | "SYSTEM";
  changedByUserId?: string;
  note?: string;
  declineReason?: string;
  cancellationReason?: string;
}) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      customer: true,
      vendor: true,
      service: true,
    },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  const allowed = ALLOWED_TRANSITIONS[booking.status] || [];
  if (!allowed.includes(toStatus) && changedByRole !== "ADMIN") {
    throw new Error(
      `Invalid booking state transition from ${booking.status} to ${toStatus}`
    );
  }

  const updateData: any = {
    status: toStatus,
  };

  if (toStatus === "ACCEPTED_AWAITING_ADVANCE") {
    updateData.acceptedAt = new Date();
  } else if (toStatus === "DECLINED") {
    updateData.declinedAt = new Date();
    updateData.declineReason = declineReason || note || "Declined by vendor";
  } else if (toStatus === "CONFIRMED") {
    updateData.confirmedAt = new Date();
    // Unlock contact details on confirmed advance payment!
    updateData.isCustomerContactRevealed = true;
    updateData.isVendorContactRevealed = true;
  } else if (toStatus === "COMPLETED") {
    updateData.completedAt = new Date();
  } else if (toStatus === "CANCELLED") {
    updateData.cancelledAt = new Date();
    updateData.cancellationReason = cancellationReason || note || "Cancelled";
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.booking.update({
      where: { id: bookingId },
      data: updateData,
    });

    await tx.bookingStatusHistory.create({
      data: {
        bookingId,
        fromStatus: booking.status,
        toStatus,
        changedByRole,
        changedByUserId,
        note: note || `Status updated from ${booking.status} to ${toStatus}`,
      },
    });

    // If declined, increment vendor weekly decline count
    if (toStatus === "DECLINED") {
      await tx.vendor.update({
        where: { id: booking.vendorId },
        data: { declineCountCurrentWeek: { increment: 1 } },
      });
    }

    return updated;
  });

  // Notifications based on transition
  if (toStatus === "ACCEPTED_AWAITING_ADVANCE") {
    await sendNotification({
      userId: booking.customer.userId,
      role: "CUSTOMER",
      title: "Booking Accepted!",
      message: `Vendor accepted booking #${booking.bookingCode}. Please pay the advance to confirm your booking.`,
      link: `/customer/bookings/${booking.id}`,
      type: "BOOKING",
    });
  } else if (toStatus === "DECLINED") {
    await sendNotification({
      userId: booking.customer.userId,
      role: "CUSTOMER",
      title: "Booking Declined",
      message: `Vendor could not accept booking #${booking.bookingCode}. Reason: ${declineReason || "Unavailable"}.`,
      link: `/customer/bookings/${booking.id}`,
      type: "ALERT",
    });
  } else if (toStatus === "CONFIRMED") {
    await sendNotification({
      userId: booking.vendor.userId,
      role: "VENDOR",
      title: "Booking Confirmed & Paid",
      message: `Advance payment confirmed for booking #${booking.bookingCode}! Customer contact details are now unlocked.`,
      link: `/vendor/bookings`,
      type: "BOOKING",
    });
    await sendNotification({
      userId: booking.customer.userId,
      role: "CUSTOMER",
      title: "Booking Confirmed",
      message: `Your booking #${booking.bookingCode} is confirmed! Vendor contact details are now unlocked.`,
      link: `/customer/bookings/${booking.id}`,
      type: "BOOKING",
    });
  } else if (toStatus === "COMPLETED") {
    await sendNotification({
      userId: booking.customer.userId,
      role: "CUSTOMER",
      title: "Service Completed",
      message: `Booking #${booking.bookingCode} marked as completed. Please share your review!`,
      link: `/customer/bookings/${booking.id}`,
      type: "BOOKING",
    });
  }

  return result;
}

