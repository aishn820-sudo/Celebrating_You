import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { checkAndExpireOverdueBookings } from "@/lib/bookingStateMachine";
import { sendNotification } from "@/lib/notificationService";

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "CUSTOMER" || !session.customerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Run 2-hour expiry check on access
    await checkAndExpireOverdueBookings();

    const bookings = await prisma.booking.findMany({
      where: { customerId: session.customerId },
      include: {
        event: true,
        service: {
          include: {
            category: true,
            images: true,
          },
        },
        vendor: {
          select: {
            id: true,
            businessName: true,
            city: true,
            state: true,
            rating: true,
            reviewCount: true,
            // phone/email will be filtered according to isVendorContactRevealed
            phone: true,
            email: true,
          },
        },
        package: true,
        invoices: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Enforce contact privacy masking before confirmation!
    const sanitized = bookings.map((b) => ({
      ...b,
      vendor: {
        ...b.vendor,
        phone: b.isVendorContactRevealed ? b.vendor.phone : "🔒 Unlocks on Advance Payment",
        email: b.isVendorContactRevealed ? b.vendor.email : "🔒 Unlocks on Advance Payment",
      },
    }));

    return NextResponse.json({ bookings: sanitized });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "CUSTOMER" || !session.customerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { eventId, serviceId, packageId, eventDate, specialRequirements, guestCount, locationAddress } = body;

    if (!eventId || !serviceId || !eventDate) {
      return NextResponse.json({ error: "Event, Service, and Event Date are required" }, { status: 400 });
    }

    // Verify service and vendor
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        vendor: true,
        packages: true,
      },
    });

    if (!service || service.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Selected service is currently unavailable" }, { status: 400 });
    }

    if (service.vendor.verificationStatus !== "VERIFIED") {
      return NextResponse.json({ error: "Vendor is not currently verified to accept bookings" }, { status: 400 });
    }

    // Double-Booking & Calendar Availability Check
    const blockedSlot = await prisma.serviceAvailability.findFirst({
      where: {
        vendorId: service.vendorId,
        date: eventDate,
        isBlocked: true,
      },
    });
    if (blockedSlot) {
      return NextResponse.json(
        { error: `Vendor has marked themselves unavailable on ${eventDate}. Please choose another date or vendor.` },
        { status: 400 }
      );
    }

    const existingConfirmedBooking = await prisma.booking.findFirst({
      where: {
        serviceId: service.id,
        eventDate,
        status: { in: ["CONFIRMED", "IN_PROGRESS"] },
      },
    });
    if (existingConfirmedBooking) {
      return NextResponse.json(
        { error: `This service already has a confirmed booking on ${eventDate}. Please select another date.` },
        { status: 400 }
      );
    }

    // Determine package and pricing
    let selectedPackage = service.packages.find((p) => p.id === packageId);
    if (!selectedPackage && service.packages.length > 0) {
      selectedPackage = service.packages[0];
    }

    const agreedValue = selectedPackage ? selectedPackage.price : service.basePrice;
    const advancePercent = selectedPackage ? selectedPackage.advancePercent : 25;
    const advanceRequired = Math.round((agreedValue * advancePercent) / 100);
    const finalBalanceDue = agreedValue - advanceRequired;

    // 2-Hour Response Rule: Response deadline is set to exactly 2 hours from now!
    const now = new Date();
    const responseDeadline = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    const bookingCount = await prisma.booking.count();
    const bookingCode = `CY-BK-${5000 + bookingCount + 1}`;

    const booking = await prisma.$transaction(async (tx) => {
      const newBooking = await tx.booking.create({
        data: {
          bookingCode,
          eventId,
          customerId: session.customerId!,
          vendorId: service.vendorId,
          serviceId: service.id,
          packageId: selectedPackage?.id || null,
          eventDate,
          status: "REQUEST_SUBMITTED",
          requestSubmittedAt: now,
          responseDeadlineAt: responseDeadline,
          agreedServiceValue: agreedValue,
          advanceRequired,
          advancePaid: 0,
          finalBalanceDue,
          finalPaid: 0,
          specialRequirements: specialRequirements || "",
          guestCount: guestCount ? Number(guestCount) : null,
          locationAddress: locationAddress || "",
          isCustomerContactRevealed: false,
          isVendorContactRevealed: false,
        },
      });

      // Record state history
      await tx.bookingStatusHistory.create({
        data: {
          bookingId: newBooking.id,
          fromStatus: "DRAFT",
          toStatus: "REQUEST_SUBMITTED",
          changedByRole: "CUSTOMER",
          changedByUserId: session.userId,
          note: `Booking request created with 2-hour response deadline (${responseDeadline.toLocaleTimeString()})`,
        },
      });

      return newBooking;
    });

    // Notify vendor about new request with 2-hour countdown
    await sendNotification({
      userId: service.vendor.userId,
      role: "VENDOR",
      title: "New Booking Request! (2-Hour Action Required)",
      message: `Booking #${booking.bookingCode} for "${service.title}" requires your acceptance by ${responseDeadline.toLocaleTimeString()}.`,
      link: `/vendor/bookings`,
      type: "BOOKING",
    });

    // Notify customer
    await sendNotification({
      userId: session.userId,
      role: "CUSTOMER",
      title: "Booking Request Submitted",
      message: `Your request #${booking.bookingCode} was sent to ${service.vendor.businessName}. Vendor has 2 hours to accept.`,
      link: `/customer/bookings/${booking.id}`,
      type: "BOOKING",
    });

    return NextResponse.json({ success: true, booking });
  } catch (err: any) {
    console.error("Booking error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

