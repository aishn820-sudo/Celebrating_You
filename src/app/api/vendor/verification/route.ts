import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "VENDOR" || !session.vendorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { documentType, documentName, fileUrl } = await req.json();

    if (!documentType || !documentName || !fileUrl) {
      return NextResponse.json({ error: "Document type, name, and URL are required" }, { status: 400 });
    }

    const doc = await prisma.vendorDocument.create({
      data: {
        vendorId: session.vendorId,
        documentType,
        documentName,
        fileUrl,
        status: "PENDING",
      },
    });

    // Create verification request entry
    await prisma.vendorVerification.create({
      data: {
        vendorId: session.vendorId,
        status: "PENDING",
        remarks: `Document submitted: ${documentName} (${documentType})`,
      },
    });

    // Update vendor verificationStatus if it was INFO_REQUIRED
    await prisma.vendor.update({
      where: { id: session.vendorId },
      data: { verificationStatus: "PENDING" },
    });

    return NextResponse.json({ success: true, document: doc });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

