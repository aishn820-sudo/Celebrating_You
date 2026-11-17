import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendNotification } from "@/lib/notificationService";

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "CUSTOMER" || !session.customerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookingId, subject, description, priority } = await req.json();

    if (!bookingId || !subject || !description) {
      return NextResponse.json({ error: "Booking, subject, and description are required" }, { status: 400 });
    }

    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, customerId: session.customerId },
      include: { vendor: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const complaint = await tx.complaint.create({
        data: {
          bookingId: booking.id,
          customerId: session.customerId!,
          vendorId: booking.vendorId,
          subject,
          description,
          priority: priority || "MEDIUM",
          status: "OPEN",
        },
      });

      // Also record as booking issue
      await tx.bookingIssue.create({
        data: {
          bookingId: booking.id,
          reporterRole: "CUSTOMER",
          reporterUserId: session.userId,
          title: subject,
          description,
          status: "OPEN",
        },
      });

      return complaint;
    });

    // Notify vendor privately
    await sendNotification({
      userId: booking.vendor.userId,
      role: "VENDOR",
      title: "New Customer Dispute / Issue Reported",
      message: `Customer reported an issue regarding booking #${booking.bookingCode}: "${subject}"`,
      link: `/vendor/bookings`,
      type: "ALERT",
    });

    return NextResponse.json({ success: true, complaint: result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

