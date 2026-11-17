import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import CustomerInvoicesClient from "./CustomerInvoicesClient";

export default async function CustomerInvoicesPage() {
  const session = await getCurrentUser();
  if (!session || session.role !== "CUSTOMER" || !session.customerId) {
    redirect("/login");
  }

  const invoices = await prisma.invoice.findMany({
    where: { booking: { customerId: session.customerId } },
    include: {
      booking: {
        select: {
          bookingCode: true,
          eventDate: true,
          service: { select: { title: true } },
          vendor: { select: { businessName: true, phone: true, email: true } },
        },
      },
      transaction: true,
    },
    orderBy: { paymentDate: "desc" },
  });

  return (
    <div className="min-h-screen bg-warm-50 text-stone-900 font-sans antialiased selection:bg-rose-100 selection:text-rose-900">
      <Navbar />
      <CustomerInvoicesClient initialInvoices={invoices} />
    </div>
  );
}
