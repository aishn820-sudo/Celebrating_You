import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import AdminNav from "@/components/AdminNav";
import AdminServicesClient from "./AdminServicesClient";

export default async function AdminServicesPage() {
  const session = await getCurrentUser();
  if (!session || session.role !== "ADMIN") {
    redirect("/admin-portal/login");
  }

  const [services, categories] = await Promise.all([
    prisma.service.findMany({
      include: {
        vendor: true,
        category: true,
        packages: true,
        images: true,
        _count: { select: { bookings: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.vendorCategory.findMany({
      include: {
        _count: { select: { services: true, vendors: true } },
      },
    }),
  ]);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-warm-50 dark:bg-dark-bg text-stone-900 dark:text-dark-text-primary font-sans antialiased selection:bg-rose-100 selection:text-rose-900 transition-colors">
      <AdminNav />
      <AdminServicesClient initialServices={services} initialCategories={categories} />
    </div>
  );
}
