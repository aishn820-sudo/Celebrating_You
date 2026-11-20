import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import AdminNav from "@/components/AdminNav";
import AdminTemplatesClient from "./AdminTemplatesClient";

export default async function AdminTemplatesPage() {
  const session = await getCurrentUser();
  if (!session || session.role !== "ADMIN") {
    redirect("/admin-portal/login");
  }

  const templates = await prisma.eventTemplate.findMany({
    include: {
      _count: { select: { events: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-warm-50 dark:bg-dark-bg text-stone-900 dark:text-dark-text-primary font-sans antialiased selection:bg-rose-100 selection:text-rose-900 transition-colors">
      <AdminNav />
      <AdminTemplatesClient initialTemplates={templates} />
    </div>
  );
}
