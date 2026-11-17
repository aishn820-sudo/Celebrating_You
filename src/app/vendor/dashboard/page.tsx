import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import VendorNav from "@/components/VendorNav";
import Link from "next/link";
import {
  CalendarCheck2,
  FileText,
  Clock,
  Layers,
  IndianRupee,
  Star,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  CalendarDays,
  Plus,
} from "lucide-react";
import { checkAndExpireOverdueBookings } from "@/lib/bookingStateMachine";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import VendorMarketingCard from "@/components/VendorMarketingCard";

export default async function VendorDashboardPage() {
  const session = await getCurrentUser();
  if (!session || session.role !== "VENDOR" || !session.vendorId) {
    redirect("/login");
  }

  // Enforce 2-hour rule on access
  await checkAndExpireOverdueBookings();

  const [vendor, services, bookings, settlements, invoices] = await Promise.all([
    prisma.vendor.findUnique({
      where: { id: session.vendorId },
      include: { category: true },
    }),
    prisma.service.findMany({
      where: { vendorId: session.vendorId },
      include: { packages: true },
    }),
    prisma.booking.findMany({
      where: { vendorId: session.vendorId },
      include: {
        customer: true,
        service: true,
        event: true,
        invoices: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.vendorSettlement.findMany({
      where: { vendorId: session.vendorId },
    }),
    prisma.invoice.findMany({
      where: { booking: { vendorId: session.vendorId } },
    }),
  ]);

  if (!vendor) redirect("/login");

  // Metrics
  const activeListings = services.filter((s) => s.status === "PUBLISHED").length;
  const pendingRequests = bookings.filter((b) =>
    ["REQUEST_SUBMITTED", "AWAITING_VENDOR_RESPONSE"].includes(b.status)
  );
  const confirmedBookings = bookings.filter((b) =>
    ["CONFIRMED", "IN_PROGRESS"].includes(b.status)
  );
  const completedBookings = bookings.filter((b) => b.status === "COMPLETED");

  let totalBookingValue = 0;
  let advanceReceived = 0;
  let finalReceived = 0;
  let pendingBalance = 0;

  for (const b of bookings) {
    if (!["DECLINED", "EXPIRED", "CANCELLED"].includes(b.status)) {
      totalBookingValue += b.agreedServiceValue;
      advanceReceived += b.advancePaid;
      finalReceived += b.finalPaid;
      pendingBalance += b.finalBalanceDue;
    }
  }

  const dueSettlementAmount = settlements
    .filter((s) => s.status === "DUE" || s.status === "PROCESSING")
    .reduce((sum, s) => sum + s.netSettlementAmount, 0);

  const formatPrice = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-warm-50 text-stone-800 font-sans">
      <VendorNav vendor={vendor} />

      <main className="flex-1 p-6 sm:p-10 max-w-7xl overflow-y-auto">
        {/* Verification Alert if not verified */}
        {!vendor.isVerified && (
          <div className="mb-8 p-5 bg-amber-50 rounded-2xl border border-amber-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h4 className="font-bold text-amber-950 text-sm">KYC Verification In Progress</h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  Your business documents are being screened. Once approved by administration, your listings will go live.
                </p>
              </div>
            </div>

            <Link href="/vendor/profile">
              <Button variant="champagne" size="sm" className="whitespace-nowrap">
                Review Business Documents
              </Button>
            </Link>
          </div>
        )}

        {/* Dashboard Top Header */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200/90 shadow-soft mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="rose" size="sm">
                {vendor.category?.name || "Artisan Business"}
              </Badge>
              <span className="text-xs text-stone-400 font-mono">{vendor.vendorCode}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight">
              {vendor.businessName}
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Rating: <strong className="text-stone-800">{vendor.rating.toFixed(1)} ★</strong> ({vendor.reviewCount} reviews) • Contact: {vendor.contactPerson}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/vendor/services">
              <Button variant="outline" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                Add Service Listing
              </Button>
            </Link>
            <Link href="/vendor/invoices">
              <Button variant="primary" size="sm" leftIcon={<FileText className="w-4 h-4" />}>
                Invoice Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Artisan Direct Marketing & Booking Link */}
        <VendorMarketingCard
          vendorCode={vendor.vendorCode}
          businessName={vendor.businessName}
          vendorId={vendor.id}
        />

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-5">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
              2-Hour Action Queue
            </span>
            <span className="text-2xl font-serif font-bold text-rose-700 mt-1 block">
              {pendingRequests.length}
            </span>
            <span className="text-[11px] text-stone-500 mt-0.5 block">Requests requiring response</span>
          </Card>

          <Card className="p-5">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
              Confirmed Bookings
            </span>
            <span className="text-2xl font-serif font-bold text-stone-900 mt-1 block">
              {confirmedBookings.length}
            </span>
            <span className="text-[11px] text-stone-500 mt-0.5 block">Active upcoming engagements</span>
          </Card>

          <Card className="p-5">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
              Gross Booked Value
            </span>
            <span className="text-2xl font-serif font-bold text-stone-900 mt-1 block">
              {formatPrice(totalBookingValue)}
            </span>
            <span className="text-[11px] text-stone-500 mt-0.5 block">Total contract values</span>
          </Card>

          <Card className="p-5">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
              Net Payouts Due
            </span>
            <span className="text-2xl font-serif font-bold text-emerald-700 mt-1 block">
              {formatPrice(dueSettlementAmount)}
            </span>
            <span className="text-[11px] text-stone-500 mt-0.5 block">Awaiting bank disbursement</span>
          </Card>
        </div>

        {/* Pending Requests Queue (Urgent 2-Hour SLA) */}
        {pendingRequests.length > 0 && (
          <Card className="mb-8 p-6 border-amber-300/80 bg-amber-50/20">
            <div className="flex items-center justify-between pb-4 border-b border-amber-200/60 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-rose-700" />
                <h3 className="font-serif font-bold text-base text-stone-900">
                  Incoming Booking Requests (2-Hour Mandatory SLA)
                </h3>
              </div>
              <Link href="/vendor/bookings" className="text-xs font-semibold text-rose-700 hover:text-rose-800">
                Go to Queue
              </Link>
            </div>

            <div className="space-y-3">
              {pendingRequests.map((b) => (
                <div
                  key={b.id}
                  className="p-4 rounded-xl border border-stone-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-bold text-stone-400">#{b.bookingCode}</span>
                      <Badge variant="warning" size="sm" dot>
                        2h Countdown Active
                      </Badge>
                    </div>
                    <h4 className="text-sm font-bold text-stone-900">{b.service.title}</h4>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Event Date: <strong>{new Date(b.eventDate).toLocaleDateString("en-IN")}</strong> • Value:{" "}
                      <strong>{formatPrice(b.agreedServiceValue)}</strong>
                    </p>
                  </div>

                  <Link href={`/vendor/bookings`}>
                    <Button variant="primary" size="sm">
                      Review & Respond <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Two Column Layout: Confirmed Bookings & Invoices */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Confirmed Engagements */}
          <Card className="flex flex-col justify-between">
            <div>
              <CardHeader>
                <CardTitle>Upcoming Confirmed Engagements</CardTitle>
                <Link href="/vendor/bookings" className="text-xs font-semibold text-rose-700 hover:text-rose-800">
                  View All
                </Link>
              </CardHeader>

              <CardContent className="space-y-3">
                {confirmedBookings.length === 0 ? (
                  <p className="text-xs text-stone-400 py-6 text-center italic">
                    No confirmed bookings currently active.
                  </p>
                ) : (
                  confirmedBookings.slice(0, 4).map((b) => (
                    <div
                      key={b.id}
                      className="p-4 rounded-xl border border-stone-200/80 bg-stone-50/50 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono font-bold text-stone-400">#{b.bookingCode}</span>
                          <Badge variant="success" size="sm">
                            {b.status}
                          </Badge>
                        </div>
                        <h4 className="text-xs font-bold text-stone-900">{b.service.title}</h4>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          Event Date: {new Date(b.eventDate).toLocaleDateString("en-IN")}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-stone-900 text-xs block">
                          {formatPrice(b.agreedServiceValue)}
                        </span>
                        <span className="text-[10px] text-emerald-700 block font-semibold mt-0.5">
                          Advance: {formatPrice(b.advancePaid)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </div>

            <div className="px-6 py-4 bg-stone-50/60 border-t border-stone-100 flex justify-end">
              <Link href="/vendor/bookings" className="text-xs font-semibold text-rose-700 hover:text-rose-800 flex items-center gap-1">
                Manage all bookings <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Card>

          {/* Recent Invoices Generated */}
          <Card className="flex flex-col justify-between">
            <div>
              <CardHeader>
                <CardTitle>Recent Transaction Documents</CardTitle>
                <Link href="/vendor/invoices" className="text-xs font-semibold text-rose-700 hover:text-rose-800">
                  Open Ledger
                </Link>
              </CardHeader>

              <CardContent className="space-y-3">
                {invoices.length === 0 ? (
                  <p className="text-xs text-stone-400 py-6 text-center italic">
                    No transaction invoices recorded yet.
                  </p>
                ) : (
                  invoices.slice(0, 4).map((inv) => (
                    <div
                      key={inv.id}
                      className="p-4 rounded-xl border border-stone-200/80 bg-stone-50/50 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-700">
                          <FileText className="w-4 h-4 text-rose-700" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-stone-900 block">
                            {inv.type === "ADVANCE" ? "Doc 1 (Advance)" : "Doc 2 (Final)"}
                          </span>
                          <span className="text-[10px] font-mono text-stone-400">
                            #{inv.invoiceNumber}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-stone-900 text-xs block">
                          {formatPrice(inv.amountPaidThisDoc)}
                        </span>
                        <span className="text-[10px] text-stone-500 block">
                          {new Date(inv.paymentDate).toLocaleDateString("en-IN")}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </div>

            <div className="px-6 py-4 bg-stone-50/60 border-t border-stone-100 flex justify-end">
              <Link href="/vendor/invoices" className="text-xs font-semibold text-rose-700 hover:text-rose-800 flex items-center gap-1">
                View all invoices & download PDFs <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
