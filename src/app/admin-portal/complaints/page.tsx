import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import AdminNav from "@/components/AdminNav";
import AdminComplaintsClient from "./AdminComplaintsClient";

export default async function AdminComplaintsPage() {
  const session = await getCurrentUser();
  if (!session || session.role !== "ADMIN") {
    redirect("/admin-portal/login");
  }

  const complaints = await prisma.complaint.findMany({
    include: {
      customer: true,
      vendor: true,
      booking: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-warm-50 text-stone-900 font-sans antialiased selection:bg-rose-100 selection:text-rose-900">
      <AdminNav />
      <AdminComplaintsClient initialComplaints={complaints} />
    </div>
  );
}
