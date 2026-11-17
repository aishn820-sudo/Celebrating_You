import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import VendorNav from "@/components/VendorNav";
import VendorServicesClient from "./VendorServicesClient";

export default async function VendorServicesPage() {
  const session = await getCurrentUser();
  if (!session || session.role !== "VENDOR" || !session.vendorId) {
    redirect("/login");
  }

  const [vendor, services, categories] = await Promise.all([
    prisma.vendor.findUnique({
      where: { id: session.vendorId },
      include: { category: true },
    }),
    prisma.service.findMany({
      where: { vendorId: session.vendorId },
      include: {
        category: true,
        packages: true,
        images: true,
        addons: true,
        _count: { select: { bookings: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.vendorCategory.findMany({ where: { isActive: true } }),
  ]);

  if (!vendor) redirect("/login");

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-warm-50 text-stone-900 font-sans antialiased selection:bg-rose-100 selection:text-rose-900">
      <VendorNav vendor={vendor} />
      <VendorServicesClient initialServices={services} vendor={vendor} categories={categories} />
    </div>
  );
}
