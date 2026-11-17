import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.vendorCategory.findMany({
      include: {
        _count: {
          select: { vendors: true, services: true },
        },
        commissionSettings: true,
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ categories });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { name, description, icon } = await req.json();
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const category = await prisma.vendorCategory.create({
      data: { name, slug, description, icon: icon || "Tag" },
    });

    // Create default commission setting
    await prisma.commissionSetting.create({
      data: {
        categoryId: category.id,
        defaultCommissionPercent: 10.0,
        minCommissionPercent: 5.0,
        maxCommissionPercent: 20.0,
        isDefault: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId: session.userId,
        action: "CREATE_CATEGORY",
        targetEntity: "VendorCategory",
        targetId: category.id,
        newValue: name,
      },
    });

    return NextResponse.json({ success: true, category });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

