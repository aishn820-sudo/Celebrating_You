import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "CUSTOMER" || !session.customerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookingId, rating, comment } = await req.json();

    if (!bookingId || !rating || !comment) {
      return NextResponse.json({ error: "Booking, rating (1-5), and written feedback are required" }, { status: 400 });
    }

    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        customerId: session.customerId,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // STRICT RULE: Only completed bookings can be reviewed!
    if (booking.status !== "COMPLETED") {
      return NextResponse.json({ error: "Only completed bookings are eligible for public reviews" }, { status: 400 });
    }

    // Check duplicate review
    const existingReview = await prisma.review.findFirst({
      where: { bookingId: booking.id },
    });
    if (existingReview) {
      return NextResponse.json({ error: "You have already reviewed this booking" }, { status: 400 });
    }

    const review = await prisma.$transaction(async (tx) => {
      const rev = await tx.review.create({
        data: {
          bookingId: booking.id,
          customerId: session.customerId!,
          vendorId: booking.vendorId,
          serviceId: booking.serviceId,
          rating: Number(rating),
          comment,
        },
      });

      // Recalculate vendor rating
      const allVendorReviews = await tx.review.findMany({
        where: { vendorId: booking.vendorId },
        select: { rating: true },
      });

      const avg = allVendorReviews.reduce((sum, r) => sum + r.rating, 0) / allVendorReviews.length;

      await tx.vendor.update({
        where: { id: booking.vendorId },
        data: {
          rating: Number(avg.toFixed(1)),
          reviewCount: allVendorReviews.length,
        },
      });

      return rev;
    });

    return NextResponse.json({ success: true, review });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

