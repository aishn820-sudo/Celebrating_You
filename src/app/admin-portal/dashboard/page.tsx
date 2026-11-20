import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import AdminNav from "@/components/AdminNav";
import Link from "next/link";
import {
  Users,
  Store,
  Layers,
  Sparkles,
  CalendarRange,
  BadgePercent,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  CreditCard,
  ArrowRight,
  Clock,
  History,
} from "lucide-react";
import { checkAndExpireOverdueBookings } from "@/lib/bookingStateMachine";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export default async function AdminDashboardPage() {
  const session = await getCurrentUser();
  if (!session || session.role !== "ADMIN") {
    redirect("/admin-portal/login");
  }

  await checkAndExpireOverdueBookings();

  const [
    totalCustomers,
    totalVendors,
    verifiedVendors,
    pendingVerifications,
    activeEvents,
    bookings,
    transactions,
    settlements,
    refunds,
    auditLogs,
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.vendor.count(),
    prisma.vendor.count({ where: { verificationStatus: "VERIFIED" } }),
    prisma.vendor.count({ where: { verificationStatus: "PENDING" } }),
    prisma.event.count({ where: { status: { in: ["PLANNING", "IN_PROGRESS"] } } }),
    prisma.booking.findMany({
      include: {
        customer: true,
        vendor: true,
        service: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.paymentTransaction.findMany({ where: { status: "SUCCESS" } }),
    prisma.vendorSettlement.findMany(),
    prisma.refund.findMany({ where: { status: "PROCESSED" } }),
    prisma.auditLog.findMany({ take: 5, orderBy: { timestamp: "desc" }, include: { admin: true } }),
  ]);

  const totalBookings = bookings.length;
  const pendingRequests = bookings.filter((b) =>
    ["REQUEST_SUBMITTED", "AWAITING_VENDOR_RESPONSE"].includes(b.status)
  ).length;
  const completedBookings = bookings.filter((b) => b.status === "COMPLETED").length;
  const cancelledBookings = bookings.filter((b) =>
    ["DECLINED", "EXPIRED", "CANCELLED", "REFUNDED"].includes(b.status)
  ).length;

  // Financial Metrics (Paise minor units)
  const totalBookingValue = bookings
    .filter((b) => !["DECLINED", "EXPIRED", "CANCELLED"].includes(b.status))
    .reduce((sum, b) => sum + b.agreedServiceValue, 0);

  const paymentsCollected = transactions.reduce((sum, t) => sum + t.amount, 0);
  const platformCommission = settlements.reduce((sum, s) => sum + s.platformCommission, 0);
  const settlementsDue = settlements
    .filter((s) => s.status === "DUE" || s.status === "PROCESSING")
    .reduce((sum, s) => sum + s.netSettlementAmount, 0);

  const totalRefunds = refunds.reduce((sum, r) => sum + r.amount, 0);
  const estProcessingCosts = Math.round((paymentsCollected * 2) / 100);
  const netPlatformRevenue = Math.max(0, platformCommission - estProcessingCosts);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-warm-50 dark:bg-dark-bg text-stone-900 dark:text-dark-text-primary font-sans antialiased selection:bg-rose-100 selection:text-rose-900 transition-colors">
      <AdminNav />

      <main className="flex-1 p-6 sm:p-10 max-w-7xl overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-semibold tracking-wider uppercase text-rose-700 dark:text-rose-400">
              Operations & Oversight
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-dark-text-primary mt-1">
              Executive Command Center
            </h1>
            <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
              Real-time monitoring of Gross Booking Value, verification pipeline, financial settlements, and audit trails.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin-portal/vendors"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-semibold shadow-soft transition"
            >
              <Store className="w-4 h-4" /> KYC Approvals ({pendingVerifications})
            </Link>
          </div>
        </div>

        {/* FINANCIAL REVENUE HIGHLIGHT (GBV vs NET COMMISSION SEPARATION) */}
        <div className="bg-white dark:bg-dark-surface p-6 sm:p-8 rounded-3xl border border-stone-200/90 dark:border-dark-border shadow-soft mb-8 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
              Core Financial Matrix (Audit Reconciled)
            </span>
            <span className="text-[11px] font-mono text-stone-600 dark:text-stone-300 bg-warm-100 dark:bg-dark-elevated px-3 py-1 rounded-full border border-stone-200 dark:border-dark-border">
              INR Minor Unit Precision (Paise)
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-4 bg-warm-50 dark:bg-dark-elevated rounded-2xl border border-stone-200/80 dark:border-dark-border transition-colors">
              <span className="text-stone-500 dark:text-stone-400 block text-[10px] uppercase font-bold tracking-wider">
                Gross Booking Value (GBV)
              </span>
              <span className="text-2xl font-bold text-stone-900 dark:text-dark-text-primary mt-1 block">
                ₹{(totalBookingValue / 100).toLocaleString("en-IN")}
              </span>
              <span className="text-[10px] text-stone-500 dark:text-stone-400 mt-1 block">Total customer contract volume</span>
            </div>

            <div className="p-4 bg-warm-50 dark:bg-dark-elevated rounded-2xl border border-stone-200/80 dark:border-dark-border transition-colors">
              <span className="text-stone-500 dark:text-stone-400 block text-[10px] uppercase font-bold tracking-wider">
                Payments Collected
              </span>
              <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1 block">
                ₹{(paymentsCollected / 100).toLocaleString("en-IN")}
              </span>
              <span className="text-[10px] text-stone-500 dark:text-stone-400 mt-1 block">Advance + Final Receipts</span>
            </div>

            <div className="p-4 bg-warm-50 dark:bg-dark-elevated rounded-2xl border border-stone-200/80 dark:border-dark-border transition-colors">
              <span className="text-stone-500 dark:text-stone-400 block text-[10px] uppercase font-bold tracking-wider">
                Platform Commission Earned
              </span>
              <span className="text-2xl font-bold text-rose-700 dark:text-rose-400 mt-1 block">
                ₹{(platformCommission / 100).toLocaleString("en-IN")}
              </span>
              <span className="text-[10px] text-rose-800 dark:text-rose-300 mt-1 block">10% Platform fee entitlement</span>
            </div>

            <div className="p-4 bg-warm-50 dark:bg-dark-elevated rounded-2xl border border-stone-200/80 dark:border-dark-border transition-colors">
              <span className="text-stone-500 dark:text-stone-400 block text-[10px] uppercase font-bold tracking-wider">
                Net Platform Revenue
              </span>
              <span className="text-2xl font-bold text-stone-900 dark:text-dark-text-primary mt-1 block">
                ₹{(netPlatformRevenue / 100).toLocaleString("en-IN")}
              </span>
              <span className="text-[10px] text-stone-500 dark:text-stone-400 mt-1 block">After est. 2% gateway costs</span>
            </div>
          </div>
        </div>

        {/* Operational Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-dark-surface p-5 rounded-2xl border border-stone-200/90 dark:border-dark-border shadow-soft transition-colors">
            <span className="text-xs text-stone-500 dark:text-stone-400 font-medium block">Total Customers</span>
            <span className="text-2xl font-bold text-stone-900 dark:text-dark-text-primary mt-1 block">{totalCustomers}</span>
            <span className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 block">{activeEvents} Active Events</span>
          </div>

          <div className="bg-white dark:bg-dark-surface p-5 rounded-2xl border border-stone-200/90 dark:border-dark-border shadow-soft transition-colors">
            <span className="text-xs text-stone-500 dark:text-stone-400 font-medium block">Registered Vendors</span>
            <span className="text-2xl font-bold text-stone-900 dark:text-dark-text-primary mt-1 block">{totalVendors}</span>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium mt-1 block">{verifiedVendors} Verified & Active</span>
          </div>

          <div className="bg-white dark:bg-dark-surface p-5 rounded-2xl border border-stone-200/90 dark:border-dark-border shadow-soft transition-colors">
            <span className="text-xs text-stone-500 dark:text-stone-400 font-medium block">Total Bookings</span>
            <span className="text-2xl font-bold text-stone-900 dark:text-dark-text-primary mt-1 block">{totalBookings}</span>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium mt-1 block">{completedBookings} Completed</span>
          </div>

          <div className="bg-white dark:bg-dark-surface p-5 rounded-2xl border border-stone-200/90 dark:border-dark-border shadow-soft transition-colors">
            <span className="text-xs text-stone-500 dark:text-stone-400 font-medium block">Vendor Settlements Due</span>
            <span className="text-2xl font-bold text-amber-700 dark:text-amber-400 mt-1 block">
              ₹{(settlementsDue / 100).toLocaleString("en-IN")}
            </span>
            <span className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 block">Disbursement pipeline</span>
          </div>
        </div>

        {/* Recent System Activity & Bookings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Bookings */}
          <div className="bg-white dark:bg-dark-surface p-6 rounded-3xl border border-stone-200/90 dark:border-dark-border shadow-soft transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif font-bold text-stone-900 dark:text-dark-text-primary text-base">Live Booking Activity</h3>
              <Link href="/admin-portal/bookings" className="text-xs font-semibold text-rose-700 dark:text-rose-400 hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {bookings.slice(0, 4).map((b) => (
                <div
                  key={b.id}
                  className="p-3 bg-warm-50 dark:bg-dark-elevated rounded-xl border border-stone-200/80 dark:border-dark-border flex items-center justify-between text-xs transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-stone-500 dark:text-stone-400 font-semibold">#{b.bookingCode}</span>
                      <Badge variant="rose">
                        {b.status}
                      </Badge>
                    </div>
                    <p className="font-semibold text-stone-900 dark:text-dark-text-primary">{b.service.title}</p>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400">
                      {b.vendor.businessName} ➔ {b.customer.name}
                    </p>
                  </div>

                  <span className="font-bold text-stone-900 dark:text-dark-text-primary text-sm">
                    ₹{(b.agreedServiceValue / 100).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Audit Logs */}
          <div className="bg-white dark:bg-dark-surface p-6 rounded-3xl border border-stone-200/90 dark:border-dark-border shadow-soft transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif font-bold text-stone-900 dark:text-dark-text-primary text-base">Administrative Audit Trail</h3>
              <Link href="/admin-portal/audit-logs" className="text-xs font-semibold text-rose-700 dark:text-rose-400 hover:underline">
                Full Log
              </Link>
            </div>

            <div className="space-y-3">
              {auditLogs.slice(0, 4).map((al) => (
                <div
                  key={al.id}
                  className="p-3 bg-warm-50 dark:bg-dark-elevated rounded-xl border border-stone-200/80 dark:border-dark-border text-xs transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] font-bold text-rose-700 dark:text-rose-400">{al.action}</span>
                    <span className="text-[10px] text-stone-500 dark:text-stone-400">
                      {new Date(al.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-stone-800 dark:text-stone-200 text-[11px]">{al.newValue || al.action}</p>
                  <span className="text-[10px] text-stone-500 dark:text-stone-400 font-mono mt-0.5 block">
                    Admin: {al.admin?.email || "System"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
