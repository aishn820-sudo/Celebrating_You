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
    <div className="flex flex-col md:flex-row min-h-screen bg-warm-50 dark:bg-dark-bg text-stone-900 dark:text-dark-text-primary font-sans antialiased selection:bg-rose-100 selection:text-rose-900 transition-colors">
      <AdminNav />

      <main className="flex-1 p-6 sm:p-10 max-w-7xl overflow-y-auto">
        <div className="mb-8">
          <span className="text-xs font-semibold tracking-wider uppercase text-rose-700 dark:text-rose-400">Client Directory</span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-dark-text-primary mt-1">
            Customer Accounts & Engagement
          </h1>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
            Review registered host profiles, planned event milestones, contracts, and dispute history.
          </p>
        </div>

        <div className="bg-white dark:bg-dark-surface rounded-3xl border border-stone-200/90 dark:border-dark-border shadow-soft overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-stone-700 dark:text-stone-300">
              <thead className="text-[11px] uppercase tracking-wider text-stone-500 dark:text-stone-400 bg-warm-50/70 dark:bg-dark-elevated border-b border-stone-200 dark:border-dark-border">
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
              <tbody className="divide-y divide-stone-100 dark:divide-dark-border">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-warm-50/60 dark:hover:bg-dark-elevated/60 transition">
                    <td className="py-4 px-6 font-mono font-bold text-rose-700 dark:text-rose-400">
                      {c.customerCode}
                    </td>
                    <td className="py-4 px-4">
                      <strong className="text-stone-900 dark:text-dark-text-primary text-sm block">{c.name}</strong>
                      <span className="text-[11px] text-stone-500 dark:text-stone-400">{c.city}, {c.state}</span>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-semibold text-stone-900 dark:text-dark-text-primary">{c.phone}</p>
                      <p className="text-stone-500 dark:text-stone-400 text-[11px]">{c.email}</p>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-bold text-stone-900 dark:text-dark-text-primary">{c.events.length}</span> planned
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">{c.bookings.length}</span> services
                    </td>
                    <td className="py-4 px-4">
                      {c.complaints.length > 0 ? (
                        <Badge variant="danger">
                          {c.complaints.length} issue(s)
                        </Badge>
                      ) : (
                        <span className="text-stone-400 dark:text-stone-500">None</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right text-stone-500 dark:text-stone-400">
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
