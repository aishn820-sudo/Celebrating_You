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

      // If created with template, automatically create checkpoints from template
      if (templateId) {
        const template = await tx.eventTemplate.findUnique({ where: { id: templateId } });
        if (template && template.checkpointsJson) {
          try {
            const parsedCheckpoints = JSON.parse(template.checkpointsJson);
            for (const cp of parsedCheckpoints) {
              await tx.eventCheckpoint.create({
                data: {
                  eventId: newEvent.id,
                  title: cp.title,
                  description: cp.description || "",
                  status: "PENDING",
                },
              });
            }
          } catch (e) {
            console.error("Error parsing template checkpoints:", e);
          }
        }
      } else {
        // Default standard checkpoints
        await tx.eventCheckpoint.createMany({
          data: [
            { eventId: newEvent.id, title: "Finalize Date & Budget", status: "COMPLETED" },
            { eventId: newEvent.id, title: "Book Core Vendors", status: "PENDING" },
            { eventId: newEvent.id, title: "Review Decor & Menu Details", status: "PENDING" },
            { eventId: newEvent.id, title: "Final Event Inspection", status: "PENDING" },
          ],
        });
      }

      return newEvent;
    });

    return NextResponse.json({ success: true, event });
  } catch (err: any) {
    console.error("Create event error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

