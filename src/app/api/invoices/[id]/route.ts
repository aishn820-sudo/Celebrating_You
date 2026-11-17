import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const invoice = await prisma.invoice.findFirst({
      where: {
        OR: [{ id: params.id }, { invoiceNumber: params.id }],
      },
      include: {
        booking: {
          include: {
            customer: true,
            vendor: true,
            service: true,
            package: true,
            event: true,
          },
        },
        transaction: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice document not found" }, { status: 404 });
    }

    // Role-based access control check
    if (session.role === "CUSTOMER" && invoice.booking.customerId !== session.customerId) {
      return NextResponse.json({ error: "Access denied to this invoice" }, { status: 403 });
    }
    if (session.role === "VENDOR" && invoice.booking.vendorId !== session.vendorId) {
      return NextResponse.json({ error: "Access denied to this invoice" }, { status: 403 });
    }

    return NextResponse.json({ invoice });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

