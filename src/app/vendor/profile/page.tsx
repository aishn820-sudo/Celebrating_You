import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import VendorNav from "@/components/VendorNav";
import VendorProfileClient from "./VendorProfileClient";

export default async function VendorProfilePage() {
  const session = await getCurrentUser();
  if (!session || session.role !== "VENDOR" || !session.vendorId) {
    redirect("/login");
  }

  const vendor = await prisma.vendor.findUnique({
    where: { id: session.vendorId },
    include: {
      category: true,
      documents: { orderBy: { uploadedAt: "desc" } },
      verifications: { orderBy: { submittedAt: "desc" } },
    },
  });

  if (!vendor) redirect("/login");

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-warm-50 text-stone-900 font-sans antialiased selection:bg-rose-100 selection:text-rose-900">
      <VendorNav vendor={vendor} />
      <VendorProfileClient vendor={vendor} />
    </div>
  );
}
