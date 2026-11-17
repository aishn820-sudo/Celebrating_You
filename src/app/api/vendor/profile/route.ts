import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "VENDOR" || !session.vendorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const vendor = await prisma.vendor.findUnique({
      where: { id: session.vendorId },
      include: {
        category: true,
        documents: true,
        verifications: { orderBy: { submittedAt: "desc" } },
      },
    });

    if (!vendor) {
      return NextResponse.json({ error: "Vendor profile not found" }, { status: 404 });
    }

    return NextResponse.json({ vendor });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "VENDOR" || !session.vendorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      businessName,
      contactPerson,
      phone,
      city,
      state,
      pincode,
      serviceAreas,
      gstin,
      panNumber,
      bankAccountNumber,
      bankIfsc,
      bankName,
      accountHolderName,
    } = body;

    const updated = await prisma.vendor.update({
      where: { id: session.vendorId },
      data: {
        businessName,
        contactPerson,
        phone,
        city,
        state,
        pincode,
        serviceAreas,
        gstin,
        panNumber,
        bankAccountNumber,
        bankIfsc,
        bankName,
        accountHolderName,
      },
      include: { category: true },
    });

    return NextResponse.json({ success: true, vendor: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

