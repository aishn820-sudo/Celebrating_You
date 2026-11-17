import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "VENDOR" || !session.vendorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const services = await prisma.service.findMany({
      where: { vendorId: session.vendorId },
      include: {
        category: true,
        packages: true,
        images: { orderBy: { sortOrder: "asc" } },
        addons: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ services });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "VENDOR" || !session.vendorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const vendor = await prisma.vendor.findUnique({
      where: { id: session.vendorId },
    });

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      title,
      categoryId,
      description,
      basePrice, // in paise or INR
      status, // "DRAFT" or "PUBLISHED"
      capacity,
      duration,
      setupTime,
      inclusions,
      exclusions,
      termsConditions,
      cancellationPolicy,
      travelCharges,
      packages,
      images,
    } = body;

    if (!title || !description) {
      return NextResponse.json({ error: "Title and description are required" }, { status: 400 });
    }

    // STRICT RULE: Only verified and active vendors can publish services!
    let targetStatus = status || "DRAFT";
    if (targetStatus === "PUBLISHED" && (!vendor.isVerified || vendor.verificationStatus !== "VERIFIED")) {
      return NextResponse.json(
        { error: "Only verified vendors can publish live services. Your service has been saved as DRAFT." },
        { status: 403 }
      );
    }

    const pricePaise = basePrice > 1000000 ? basePrice : Math.round((Number(basePrice) || 5000) * 100);
    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;

    const newService = await prisma.$transaction(async (tx) => {
      const s = await tx.service.create({
        data: {
          vendorId: vendor.id,
          categoryId: categoryId || vendor.categoryId,
          title,
          slug,
          description,
          basePrice: pricePaise,
          status: targetStatus,
          capacity: capacity || "",
          duration: duration || "",
          setupTime: setupTime || "",
          inclusions: Array.isArray(inclusions) ? JSON.stringify(inclusions) : inclusions || "[]",
          exclusions: Array.isArray(exclusions) ? JSON.stringify(exclusions) : exclusions || "[]",
          termsConditions: termsConditions || "",
          cancellationPolicy: cancellationPolicy || "",
          travelCharges: travelCharges ? Math.round(Number(travelCharges) * 100) : 0,
        },
      });

      // Create packages if provided
      if (Array.isArray(packages) && packages.length > 0) {
        for (const pkg of packages) {
          const pkgPrice = pkg.price > 1000000 ? pkg.price : Math.round((Number(pkg.price) || 5000) * 100);
          await tx.servicePackage.create({
            data: {
              serviceId: s.id,
              name: pkg.name || "Standard Package",
              description: pkg.description || "",
              price: pkgPrice,
              advancePercent: Number(pkg.advancePercent) || 25,
              features: Array.isArray(pkg.features) ? JSON.stringify(pkg.features) : pkg.features || "[]",
              duration: pkg.duration || "",
            },
          });
        }
      } else {
        // Create default standard package
        await tx.servicePackage.create({
          data: {
            serviceId: s.id,
            name: "Standard Package",
            description: "Standard service offering",
            price: pricePaise,
            advancePercent: 25,
          },
        });
      }

      // Add images if provided
      if (Array.isArray(images) && images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const img = images[i];
          const imgUrl = typeof img === "string" ? img : img.imageUrl;
          if (imgUrl) {
            await tx.serviceImage.create({
              data: {
                serviceId: s.id,
                imageUrl: imgUrl,
                isCover: i === 0,
                sortOrder: i,
              },
            });
          }
        }
      }

      return s;
    });

    return NextResponse.json({ success: true, service: newService });
  } catch (err: any) {
    console.error("Create service error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

