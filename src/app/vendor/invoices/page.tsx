import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import VendorNav from "@/components/VendorNav";
import VendorInvoicesClient from "./VendorInvoicesClient";

export default async function VendorInvoicesPage({
  searchParams,
}: {
  searchParams: { type?: string; search?: string };
}) {
  const session = await getCurrentUser();
  if (!session || session.role !== "VENDOR" || !session.vendorId) {
    redirect("/login");
  }

  const vendor = await prisma.vendor.findUnique({
    where: { id: session.vendorId },
    include: { category: true },
  });

  if (!vendor) redirect("/login");

  const invoices = await prisma.invoice.findMany({
    where: {
      booking: {
        vendorId: session.vendorId,
      },
    },
    include: {
      booking: {
        include: {
          customer: true,
          event: true,
        },
      },
      transaction: true,
    },
    orderBy: { paymentDate: "desc" },
  });

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-warm-50 dark:bg-dark-bg text-stone-800 dark:text-dark-text-primary font-sans transition-colors">
      <VendorNav vendor={vendor} />
      <VendorInvoicesClient initialInvoices={invoices} vendor={vendor} />
    </div>
  );
}
