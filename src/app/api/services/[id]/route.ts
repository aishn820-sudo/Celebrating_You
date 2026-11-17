import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const service = await prisma.service.findFirst({
      where: {
        OR: [{ id: params.id }, { slug: params.id }],
      },
      include: {
        category: true,
        vendor: {
          select: {
            id: true,
            businessName: true,
            city: true,
            state: true,
            rating: true,
            reviewCount: true,
            verificationStatus: true,
            serviceAreas: true,
            responseTimeMinutes: true,
          },
        },
        packages: { where: { isActive: true } },
        images: { orderBy: { sortOrder: "asc" } },
        addons: { where: { isActive: true } },
        reviews: {
          where: { isApproved: true },
          include: { customer: { select: { name: true, city: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    return NextResponse.json({ service });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

