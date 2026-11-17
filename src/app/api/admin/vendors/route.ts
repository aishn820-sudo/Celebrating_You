import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendNotification } from "@/lib/notificationService";

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized administrative access" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const where: any = {};
    if (status) where.verificationStatus = status;
    if (category) where.categoryId = category;
    if (search) {
      where.OR = [
        { businessName: { contains: search } },
        { contactPerson: { contains: search } },
        { email: { contains: search } },
        { vendorCode: { contains: search } },
      ];
    }

    const vendors = await prisma.vendor.findMany({
      where,
      include: {
        category: true,
        documents: true,
        services: { select: { id: true, title: true, status: true } },
        bookings: { select: { id: true, status: true, agreedServiceValue: true } },
        settlements: { select: { id: true, netSettlementAmount: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ vendors });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized administrative access" }, { status: 403 });
    }

    const body = await req.json();
    const { businessName, contactPerson, email, phone, city, state, categoryId, temporaryPassword } = body;

    if (!businessName || !email || !categoryId) {
      return NextResponse.json({ error: "Business name, email, and category are required" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 });
    }

    const tempPass = temporaryPassword || "Welcome@CY2026";
    const passwordHash = await hashPassword(tempPass);
    const vendorCount = await prisma.vendor.count();
    const vendorCode = `CY-VEND-${2000 + vendorCount + 1}`;

    const vendor = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: cleanEmail,
          passwordHash,
          role: "VENDOR",
          isFirstLogin: true, // FORCED password change on first login!
        },
      });

      const newVendor = await tx.vendor.create({
        data: {
          userId: user.id,
          vendorCode,
          businessName,
          contactPerson: contactPerson || businessName,
          email: cleanEmail,
          phone: phone || "",
          city: city || "Bangalore",
          state: state || "Karnataka",
          categoryId,
          verificationStatus: "PENDING",
          isVerified: false,
          canPublish: false,
        },
        include: { category: true },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          adminId: session.userId,
          action: "CREATE_VENDOR_INVITE",
          targetEntity: "Vendor",
          targetId: newVendor.id,
          newValue: `Created vendor account ${vendorCode} (${businessName}) with temporary password`,
        },
      });

      return newVendor;
    });

    return NextResponse.json({
      success: true,
      message: `Vendor created with temporary password "${tempPass}". Forced password change will apply on first login.`,
      vendor,
    });
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

    const { vendorId, action, remarks, commissionRate } = await req.json();

    if (!vendorId || !action) {
      return NextResponse.json({ error: "Vendor ID and action are required" }, { status: 400 });
    }

    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    let targetStatus = vendor.verificationStatus;
    let isVerified = vendor.isVerified;
    let canPublish = vendor.canPublish;

    if (action === "APPROVE") {
      targetStatus = "VERIFIED";
      isVerified = true;
      canPublish = true;
    } else if (action === "REJECT") {
      targetStatus = "REJECTED";
      isVerified = false;
      canPublish = false;
    } else if (action === "REQUEST_INFO") {
      targetStatus = "INFO_REQUIRED";
      isVerified = false;
      canPublish = false;
    } else if (action === "SUSPEND") {
      targetStatus = "SUSPENDED";
      isVerified = false;
      canPublish = false;
    } else if (action === "REACTIVATE") {
      targetStatus = "VERIFIED";
      isVerified = true;
      canPublish = true;
    } else if (action === "UPDATE_COMMISSION") {
      // update commission rate
    }

    const updated = await prisma.$transaction(async (tx) => {
      const v = await tx.vendor.update({
        where: { id: vendorId },
        data: {
          verificationStatus: targetStatus,
          isVerified,
          canPublish,
          commissionRate: commissionRate !== undefined ? Number(commissionRate) : vendor.commissionRate,
        },
        include: { category: true },
      });

      // Record verification log
      await tx.vendorVerification.create({
        data: {
          vendorId,
          reviewedByAdminId: session.userId,
          status: targetStatus,
          remarks: remarks || `Action: ${action}`,
          reviewedAt: new Date(),
        },
      });

      // Record audit log
      await tx.auditLog.create({
        data: {
          adminId: session.userId,
          action: `VENDOR_${action}`,
          targetEntity: "Vendor",
          targetId: vendorId,
          previousValue: vendor.verificationStatus,
          newValue: targetStatus,
        },
      });

      return v;
    });

    // Notify vendor
    await sendNotification({
      userId: vendor.userId,
      role: "VENDOR",
      title: `Verification Status: ${targetStatus}`,
      message: remarks || `Your vendor account verification status has been updated to ${targetStatus}.`,
      link: `/vendor/profile`,
      type: "SYSTEM",
    });

    return NextResponse.json({ success: true, vendor: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

