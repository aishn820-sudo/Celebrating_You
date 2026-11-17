import Navbar from "@/components/Navbar";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { isDatabaseUnavailableError } from "@/lib/dbErrors";
import ServiceBookingClient from "./ServiceBookingClient";

export const dynamic = "force-dynamic";

export default async function ServiceDetailPage({ params }: { params: { id: string } }) {
  let service: any = null;

  try {
    service = await prisma.service.findFirst({
      where: {
        OR: [{ id: params.id }, { slug: params.id }],
      },
      include: {
        category: true,
        vendor: true,
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
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      console.warn(`[ServiceDetailPage] Database uninitialized or unavailable for service ID: ${params.id}`);
      notFound();
    } else {
      throw error;
    }
  }

  if (!service) {
    notFound();
  }

  // Fetch customer's events if signed in, to allow selecting an event for the booking
  return (
    <>
      <Navbar />
      <ServiceBookingClient service={service} />
    </>
  );
}

