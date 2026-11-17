import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categorySlug = searchParams.get("category");
    const city = searchParams.get("city");
    const search = searchParams.get("search");
    const maxBudget = searchParams.get("maxBudget");
    const minRating = searchParams.get("minRating");

    const where: any = {
      status: "PUBLISHED",
      vendor: {
        verificationStatus: "VERIFIED",
      },
    };

    if (categorySlug && categorySlug !== "all") {
      where.category = { slug: categorySlug };
    }

    if (city) {
      where.vendor.city = { contains: city };
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { vendor: { businessName: { contains: search } } },
      ];
    }

    if (maxBudget) {
      // In paise or rupees
      const budgetPaise = Number(maxBudget) > 100000 ? Number(maxBudget) : Number(maxBudget) * 100;
      where.basePrice = { lte: budgetPaise };
    }

    if (minRating) {
      where.rating = { gte: Number(minRating) };
    }

    const services = await prisma.service.findMany({
      where,
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
          },
        },
        packages: { where: { isActive: true } },
        images: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: { rating: "desc" },
    });

    const categories = await prisma.vendorCategory.findMany({
      where: { isActive: true },
      include: { _count: { select: { services: true } } },
    });

    return NextResponse.json({ services, categories });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

