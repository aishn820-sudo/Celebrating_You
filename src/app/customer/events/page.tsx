import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import EventsClient from "./EventsClient";

export default async function CustomerEventsPage({
  searchParams,
}: {
  searchParams: { templateId?: string };
}) {
  const session = await getCurrentUser();
  if (!session || session.role !== "CUSTOMER" || !session.customerId) {
    redirect("/login");
  }

  const [events, templates] = await Promise.all([
    prisma.event.findMany({
      where: { customerId: session.customerId },
      include: {
        checkpoints: { orderBy: { createdAt: "asc" } },
        bookings: {
          include: {
            service: true,
            vendor: true,
            package: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.eventTemplate.findMany({ where: { isActive: true } }),
  ]);

  return (
    <>
      <Navbar />
      <EventsClient
        initialEvents={events}
        templates={templates}
        defaultTemplateId={searchParams.templateId}
      />
    </>
  );
}

