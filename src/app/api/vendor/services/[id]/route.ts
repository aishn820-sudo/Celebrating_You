import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "VENDOR" || !session.vendorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const service = await prisma.service.findFirst({
      where: { id: params.id, vendorId: session.vendorId },
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    const body = await req.json();
    const { title, description, basePrice, status, capacity, duration, setupTime, inclusions, exclusions } = body;

    const pricePaise = basePrice ? (basePrice > 1000000 ? basePrice : Math.round(Number(basePrice) * 100)) : service.basePrice;

    const updated = await prisma.service.update({
      where: { id: params.id },
      data: {
        title: title || service.title,
        description: description || service.description,
        basePrice: pricePaise,
        status: status || service.status,
        capacity: capacity !== undefined ? capacity : service.capacity,
        duration: duration !== undefined ? duration : service.duration,
        setupTime: setupTime !== undefined ? setupTime : service.setupTime,
        inclusions: inclusions ? (Array.isArray(inclusions) ? JSON.stringify(inclusions) : inclusions) : service.inclusions,
        exclusions: exclusions ? (Array.isArray(exclusions) ? JSON.stringify(exclusions) : exclusions) : service.exclusions,
      },
    });

    return NextResponse.json({ success: true, service: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "VENDOR" || !session.vendorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.service.deleteMany({
      where: { id: params.id, vendorId: session.vendorId },
    });

    return NextResponse.json({ success: true, message: "Service deleted" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

