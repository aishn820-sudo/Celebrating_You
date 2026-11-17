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
    const { title, guestCount, overallBudget, notes, status, checkpointUpdate } = body;

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

