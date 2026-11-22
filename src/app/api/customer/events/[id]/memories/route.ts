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

    const memories = await prisma.eventMemory.findMany({
      where: { eventId: params.id },
      orderBy: [{ highlight: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ memories });
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
    const { imageUrl, publicId, caption, highlight, category } = body;

    if (!imageUrl) {
      return NextResponse.json({ error: "imageUrl is required" }, { status: 400 });
    }

    const memory = await prisma.eventMemory.create({
      data: {
        eventId: params.id,
        customerId: session.customerId,
        imageUrl,
        publicId: publicId || null,
        caption: caption?.trim() || null,
        highlight: Boolean(highlight),
        category: category || "MOMENTS",
      },
    });

    return NextResponse.json({ success: true, memory });
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
    const { memoryId, caption, highlight, category } = body;

    if (!memoryId) {
      return NextResponse.json({ error: "memoryId is required" }, { status: 400 });
    }

    const existing = await prisma.eventMemory.findFirst({
      where: { id: memoryId, eventId: params.id, customerId: session.customerId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Memory not found" }, { status: 404 });
    }

    const updated = await prisma.eventMemory.update({
      where: { id: memoryId },
      data: {
        caption: caption !== undefined ? caption : existing.caption,
        highlight: highlight !== undefined ? Boolean(highlight) : existing.highlight,
        category: category !== undefined ? category : existing.category,
      },
    });

    return NextResponse.json({ success: true, memory: updated });
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
    const memoryId = searchParams.get("memoryId");

    if (!memoryId) {
      return NextResponse.json({ error: "memoryId is required" }, { status: 400 });
    }

    const existing = await prisma.eventMemory.findFirst({
      where: { id: memoryId, eventId: params.id, customerId: session.customerId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Memory not found" }, { status: 404 });
    }

    await prisma.eventMemory.delete({
      where: { id: memoryId },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
