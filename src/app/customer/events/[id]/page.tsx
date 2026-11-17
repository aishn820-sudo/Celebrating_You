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
          invoices: true,
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

  return (
    <>
      <Navbar />
      <EventDetailClient event={event} />
    </>
  );
}

