import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "CUSTOMER" || !session.customerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const events = await prisma.event.findMany({
      where: { customerId: session.customerId },
      include: {
        checkpoints: { orderBy: { createdAt: "asc" } },
        bookings: {
          include: {
            service: true,
            vendor: true,
            package: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ events });
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
    const {
      title,
      eventType,
      eventDate,
      eventTime,
      locationAddress,
      city,
      state,
      pincode,
      guestCount,
      overallBudget, // in paise or rupees
      notes,
      templateId,
      selectedCategories = [],
    } = body;

    if (!title || !eventType || !eventDate || !locationAddress) {
      return NextResponse.json({ error: "Title, event type, date, and address are required" }, { status: 400 });
    }

    // Convert rupees to paise if less than 10,000,000 or treat as integer paise
    const budgetPaise = overallBudget > 1000000 ? overallBudget : Math.round((overallBudget || 50000) * 100);

    const event = await prisma.$transaction(async (tx) => {
      const newEvent = await tx.event.create({
        data: {
          customerId: session.customerId!,
          templateId: templateId || null,
          title,
          eventType,
          eventDate,
          eventTime: eventTime || "18:00",
          locationAddress,
          city: city || "Bangalore",
          state: state || "Karnataka",
          pincode: pincode || "",
          guestCount: Number(guestCount) || 50,
          overallBudget: budgetPaise,
          notes: notes || "",
          status: "PLANNING",
        },
      });

      // Dynamic checkpoints tailored to the selected services & celebration
      const checkpointList: { title: string; status: string }[] = [];
      const catArray = Array.isArray(selectedCategories) ? selectedCategories : [];

      if (catArray.some((c: string) => c.includes("photo"))) {
        checkpointList.push({ title: "Review photography shot list & candid moments", status: "PENDING" });
      }
      if (catArray.some((c: string) => c.includes("decor"))) {
        checkpointList.push({ title: "Confirm stage styling & floral color palette", status: "PENDING" });
      }
      if (catArray.some((c: string) => c.includes("cater") || c.includes("dining"))) {
        checkpointList.push({ title: "Finalize dining menu & banquet timing", status: "PENDING" });
      }
      if (catArray.some((c: string) => c.includes("cake") || c.includes("bak"))) {
        checkpointList.push({ title: "Confirm cake flavor, tier design & delivery time", status: "PENDING" });
      }
      if (catArray.some((c: string) => c.includes("venue"))) {
        checkpointList.push({ title: "Inspect venue layout & guest seating", status: "PENDING" });
      }
      if (catArray.some((c: string) => c.includes("music") || c.includes("entertain"))) {
        checkpointList.push({ title: "Curate celebration playlist & sound setup", status: "PENDING" });
      }
      if (catArray.some((c: string) => c.includes("makeup") || c.includes("beauty"))) {
        checkpointList.push({ title: "Schedule makeup & styling arrival time", status: "PENDING" });
      }

      if (checkpointList.length === 0) {
        checkpointList.push(
          { title: "Select celebration theme & color palette", status: "PENDING" },
          { title: "Book core celebration vendors", status: "PENDING" },
          { title: "Review dining & cake arrangements", status: "PENDING" }
        );
      }

      // Completion milestones
      checkpointList.unshift({ title: "Celebration details & date confirmed", status: "COMPLETED" });
      checkpointList.push({ title: "Final celebration walkthrough & welcome guests", status: "PENDING" });

      await tx.eventCheckpoint.createMany({
        data: checkpointList.map((cp) => ({
          eventId: newEvent.id,
          title: cp.title,
          status: cp.status,
          isCustom: false,
        })),
      });

      return newEvent;
    });

    return NextResponse.json({ success: true, event });
  } catch (err: any) {
    console.error("Create event error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

