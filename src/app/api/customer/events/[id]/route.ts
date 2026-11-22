import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "CUSTOMER" || !session.customerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const event = await prisma.event.findFirst({
      where: {
        id: params.id,
        customerId: session.customerId,
      },
      include: {
        checkpoints: { orderBy: { createdAt: "asc" } },
        memories: { orderBy: [{ highlight: "desc" }, { createdAt: "desc" }] },
        bookings: {
          include: {
            service: {
              include: {
                category: true,
                images: true,
              },
            },
            vendor: true,
            package: true,
            invoices: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ event });
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

    const body = await req.json();
    const { title, guestCount, overallBudget, notes, status, checkpointUpdate, newCheckpoint } = body;

    const event = await prisma.event.findFirst({
      where: { id: params.id, customerId: session.customerId },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (checkpointUpdate) {
      const { checkpointId, cpStatus } = checkpointUpdate;
      await prisma.eventCheckpoint.update({
        where: { id: checkpointId },
        data: { status: cpStatus },
      });
    }

    if (newCheckpoint && newCheckpoint.title) {
      await prisma.eventCheckpoint.create({
        data: {
          eventId: params.id,
          title: newCheckpoint.title,
          description: newCheckpoint.description || "",
          targetDate: newCheckpoint.targetDate || null,
          status: "PENDING",
        },
      });
    }

    const updated = await prisma.event.update({
      where: { id: params.id },
      data: {
        title: title || event.title,
        guestCount: guestCount ? Number(guestCount) : event.guestCount,
        overallBudget: overallBudget ? Number(overallBudget) : event.overallBudget,
        notes: notes !== undefined ? notes : event.notes,
        status: status || event.status,
      },
    });

    return NextResponse.json({ success: true, event: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "CUSTOMER" || !session.customerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const event = await prisma.event.findFirst({
      where: { id: params.id, customerId: session.customerId },
      include: {
        bookings: true,
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const activeBookings = event.bookings.filter((b) =>
      ["REQUEST_SUBMITTED", "ACCEPTED_AWAITING_ADVANCE", "CONFIRMED", "IN_PROGRESS"].includes(b.status)
    );

    if (activeBookings.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete an event with active or confirmed bookings. Please cancel them first." },
        { status: 400 }
      );
    }

    // Cascade delete checkpoints and event services, then delete event
    await prisma.$transaction([
      prisma.eventCheckpoint.deleteMany({ where: { eventId: params.id } }),
      prisma.eventService.deleteMany({ where: { eventId: params.id } }),
      prisma.event.delete({ where: { id: params.id } }),
    ]);

    return NextResponse.json({ success: true, message: "Event deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

