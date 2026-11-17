import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized administrative access" }, { status: 403 });
    }

    const complaints = await prisma.complaint.findMany({
      include: {
        customer: { select: { id: true, name: true, phone: true, email: true } },
        vendor: { select: { id: true, businessName: true, phone: true, email: true } },
        booking: { select: { id: true, bookingCode: true, eventDate: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ complaints });
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

    const { complaintId, status, adminNotes } = await req.json();

    const complaint = await prisma.complaint.findUnique({ where: { id: complaintId } });
    if (!complaint) return NextResponse.json({ error: "Complaint not found" }, { status: 404 });

    const updated = await prisma.complaint.update({
      where: { id: complaintId },
      data: {
        status: status || complaint.status,
        adminNotes: adminNotes !== undefined ? adminNotes : complaint.adminNotes,
        resolvedByAdminId: status === "RESOLVED" || status === "CLOSED" ? session.userId : null,
        resolvedAt: status === "RESOLVED" || status === "CLOSED" ? new Date() : null,
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId: session.userId,
        action: "UPDATE_COMPLAINT",
        targetEntity: "Complaint",
        targetId: complaintId,
        previousValue: complaint.status,
        newValue: status || complaint.status,
      },
    });

    return NextResponse.json({ success: true, complaint: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

