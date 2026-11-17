import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import AdminNav from "@/components/AdminNav";
import AdminVendorsClient from "./AdminVendorsClient";

export default async function AdminVendorsPage() {
  const session = await getCurrentUser();
  if (!session || session.role !== "ADMIN") {
    redirect("/admin-portal/login");
  }

  const [vendors, categories] = await Promise.all([
    prisma.vendor.findMany({
      include: {
        category: true,
        documents: true,
        services: true,
        bookings: { select: { id: true, status: true, agreedServiceValue: true } },
        settlements: true,
        reviews: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.vendorCategory.findMany(),
  ]);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-warm-50 text-stone-900 font-sans antialiased selection:bg-rose-100 selection:text-rose-900">
      <AdminNav />
      <AdminVendorsClient initialVendors={vendors} categories={categories} />
    </div>
  );
}
