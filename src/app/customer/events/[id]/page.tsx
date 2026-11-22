import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import EventDetailClient from "./EventDetailClient";

export default async function EventDashboardPage({ params }: { params: { id: string } }) {
  const session = await getCurrentUser();
  if (!session || session.role !== "CUSTOMER" || !session.customerId) {
    redirect("/login");
  }

  const event = await prisma.event.findFirst({
    where: {
      id: params.id,
      customerId: session.customerId,
    },
    include: {
      checkpoints: { orderBy: { createdAt: "asc" } },
      memories: { orderBy: [{ highlight: "desc" }, { createdAt: "desc" }] },
      bookings: {
        include: {
          service: {
            include: {
              category: true,
              images: true,
            },
          },
          vendor: true,
          package: true,
          invoices: {
            include: {
              transaction: true,
            },
          },
          payments: {
            include: {
              transactions: true,
            },
          },
        },
      },
    },
  });

  if (!event) {
    notFound();
  }

  // Strict server-side verification: mask vendor contact details if advance payment is not confirmed
  const sanitizedEvent = {
    ...event,
    bookings: event.bookings.map((b) => ({
      ...b,
      vendor: {
        ...b.vendor,
        phone: b.isVendorContactRevealed ? b.vendor.phone : "🔒 Unlocks upon Advance Payment",
        email: b.isVendorContactRevealed ? b.vendor.email : "🔒 Unlocks upon Advance Payment",
      },
    })),
  };

  return (
    <>
      <Navbar />
      <EventDetailClient event={sanitizedEvent} />
    </>
  );
}

