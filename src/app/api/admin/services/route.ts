import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized administrative access" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");
    const status = searchParams.get("status");

    const where: any = {};
    if (categoryId) where.categoryId = categoryId;
    if (status) where.status = status;

    const services = await prisma.service.findMany({
      where,
      include: {
        vendor: { select: { id: true, businessName: true, vendorCode: true, verificationStatus: true } },
        category: true,
        packages: true,
        images: true,
        bookings: { select: { id: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ services });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized administrative access" }, { status: 403 });
    }

    const { serviceId, status, isApprovedByAdmin } = await req.json();

    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    const updated = await prisma.service.update({
      where: { id: serviceId },
      data: {
        status: status || service.status,
        isApprovedByAdmin: isApprovedByAdmin !== undefined ? isApprovedByAdmin : service.isApprovedByAdmin,
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId: session.userId,
        action: "UPDATE_SERVICE_STATUS",
        targetEntity: "Service",
        targetId: serviceId,
        previousValue: service.status,
        newValue: status || service.status,
      },
    });

    return NextResponse.json({ success: true, service: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

