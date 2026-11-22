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
      where: { id: params.id, customerId: session.customerId },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const checkpoints = await prisma.eventCheckpoint.findMany({
      where: { eventId: params.id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ checkpoints });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "CUSTOMER" || !session.customerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const event = await prisma.event.findFirst({
      where: { id: params.id, customerId: session.customerId },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const body = await req.json();
    const { title, description, targetDate } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Checkpoint title is required" }, { status: 400 });
    }

    const checkpoint = await prisma.eventCheckpoint.create({
      data: {
        eventId: params.id,
        title: title.trim(),
        description: description?.trim() || null,
        targetDate: targetDate || null,
        status: "PENDING",
        isCustom: true,
      },
    });

    return NextResponse.json({ success: true, checkpoint });
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

    const event = await prisma.event.findFirst({
      where: { id: params.id, customerId: session.customerId },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const body = await req.json();
    const { checkpointId, title, description, targetDate, status } = body;

    if (!checkpointId) {
      return NextResponse.json({ error: "checkpointId is required" }, { status: 400 });
    }

    const existing = await prisma.eventCheckpoint.findFirst({
      where: { id: checkpointId, eventId: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Checkpoint not found" }, { status: 404 });
    }

    const updated = await prisma.eventCheckpoint.update({
      where: { id: checkpointId },
      data: {
        title: title !== undefined ? title.trim() : existing.title,
        description: description !== undefined ? description : existing.description,
        targetDate: targetDate !== undefined ? targetDate : existing.targetDate,
        status: status !== undefined ? status : existing.status,
      },
    });

    return NextResponse.json({ success: true, checkpoint: updated });
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

    const { searchParams } = new URL(req.url);
    const checkpointId = searchParams.get("checkpointId");

    if (!checkpointId) {
      return NextResponse.json({ error: "checkpointId is required" }, { status: 400 });
    }

    const existing = await prisma.eventCheckpoint.findFirst({
      where: { id: checkpointId, eventId: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Checkpoint not found" }, { status: 404 });
    }

    await prisma.eventCheckpoint.delete({
      where: { id: checkpointId },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
