import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import AdminNav from "@/components/AdminNav";
import { Users, Calendar, BookOpen, AlertCircle, Phone, Mail, MapPin } from "lucide-react";
import Badge from "@/components/ui/Badge";

export default async function AdminCustomersPage() {
  const session = await getCurrentUser();
  if (!session || session.role !== "ADMIN") {
    redirect("/admin-portal/login");
  }

  const customers = await prisma.customer.findMany({
    include: {
      events: true,
      bookings: {
        include: { service: true, vendor: true },
      },
      complaints: true,
      reviews: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-warm-50 text-stone-900 font-sans antialiased selection:bg-rose-100 selection:text-rose-900">
      <AdminNav />

      <main className="flex-1 p-6 sm:p-10 max-w-7xl overflow-y-auto">
        <div className="mb-8">
          <span className="text-xs font-semibold tracking-wider uppercase text-rose-700">Client Directory</span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-1">
            Customer Accounts & Engagement
          </h1>
          <p className="text-xs text-stone-600 mt-1">
            Review registered host profiles, planned event milestones, contracts, and dispute history.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-stone-200/90 shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-stone-700">
              <thead className="text-[11px] uppercase tracking-wider text-stone-500 bg-warm-50/70 border-b border-stone-200">
                <tr>
                  <th className="py-4 px-6 font-semibold">Customer ID</th>
                  <th className="py-4 px-4 font-semibold">Name / Location</th>
                  <th className="py-4 px-4 font-semibold">Contact</th>
                  <th className="py-4 px-4 font-semibold">Events</th>
                  <th className="py-4 px-4 font-semibold">Bookings</th>
                  <th className="py-4 px-4 font-semibold">Disputes</th>
                  <th className="py-4 px-6 text-right font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-warm-50/60 transition">
                    <td className="py-4 px-6 font-mono font-bold text-rose-700">
                      {c.customerCode}
                    </td>
                    <td className="py-4 px-4">
                      <strong className="text-stone-900 text-sm block">{c.name}</strong>
                      <span className="text-[11px] text-stone-500">{c.city}, {c.state}</span>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-semibold text-stone-900">{c.phone}</p>
                      <p className="text-stone-500 text-[11px]">{c.email}</p>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-bold text-stone-900">{c.events.length}</span> planned
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-bold text-emerald-700">{c.bookings.length}</span> services
                    </td>
                    <td className="py-4 px-4">
                      {c.complaints.length > 0 ? (
                        <Badge variant="danger">
                          {c.complaints.length} issue(s)
                        </Badge>
                      ) : (
                        <span className="text-stone-400">None</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right text-stone-500">
                      {new Date(c.createdAt).toLocaleDateString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
