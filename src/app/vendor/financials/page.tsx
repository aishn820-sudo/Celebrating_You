import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import VendorNav from "@/components/VendorNav";
import Link from "next/link";
import {
  IndianRupee,
  Building2,
  FileText,
  ShieldCheck,
  Clock,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export default async function VendorFinancialsPage() {
  const session = await getCurrentUser();
  if (!session || session.role !== "VENDOR" || !session.vendorId) {
    redirect("/login");
  }

  const [vendor, bookings, settlements, invoices] = await Promise.all([
    prisma.vendor.findUnique({
      where: { id: session.vendorId },
      include: { category: true },
    }),
    prisma.booking.findMany({
      where: { vendorId: session.vendorId },
      include: {
        service: true,
        customer: true,
        invoices: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.vendorSettlement.findMany({
      where: { vendorId: session.vendorId },
      include: {
        booking: { select: { bookingCode: true, eventDate: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.invoice.findMany({
      where: { booking: { vendorId: session.vendorId } },
      orderBy: { paymentDate: "desc" },
    }),
  ]);

  if (!vendor) redirect("/login");

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

  const totalCollected = advanceReceived + finalReceived;

  const settledTotal = settlements
    .filter((s) => s.status === "SETTLED")
    .reduce((sum, s) => sum + s.netSettlementAmount, 0);

  const dueTotal = settlements
    .filter((s) => s.status === "DUE" || s.status === "PROCESSING")
    .reduce((sum, s) => sum + s.netSettlementAmount, 0);

  const totalCommission = settlements.reduce((sum, s) => sum + s.platformCommission, 0);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-warm-50 text-stone-900 font-sans antialiased selection:bg-rose-100 selection:text-rose-900">
      <VendorNav vendor={vendor} />

      <main className="flex-1 p-6 sm:p-10 max-w-7xl overflow-y-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-semibold tracking-wider uppercase text-rose-700">Financial Ledger</span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-1">
              Earnings, Settlements & Payouts
            </h1>
            <p className="text-xs text-stone-600 mt-1">
              Real-time audit of contracted booking values, milestone collections, platform commissions, and bank disbursements.
            </p>
          </div>

          <Link
            href="/vendor/invoices"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-stone-50 text-stone-800 rounded-xl border border-stone-200 shadow-soft text-xs font-semibold transition"
          >
            <FileText className="w-4 h-4 text-rose-700" /> View Invoices
          </Link>
        </div>

        {/* Financial KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-soft">
            <span className="text-xs text-stone-500 font-medium block">Gross Booked Value</span>
            <span className="text-2xl font-bold text-stone-900 mt-1 block">
              ₹{(totalBookingValue / 100).toLocaleString("en-IN")}
            </span>
            <span className="text-[11px] text-stone-500 mt-1 block">Total agreed bookings</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-soft">
            <span className="text-xs text-stone-500 font-medium block">Total Collected</span>
            <span className="text-2xl font-bold text-emerald-700 mt-1 block">
              ₹{(totalCollected / 100).toLocaleString("en-IN")}
            </span>
            <span className="text-[11px] text-stone-500 mt-1 block">Advance + Final received</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-soft">
            <span className="text-xs text-stone-500 font-medium block">Disbursed to Bank</span>
            <span className="text-2xl font-bold text-stone-900 mt-1 block">
              ₹{(settledTotal / 100).toLocaleString("en-IN")}
            </span>
            <span className="text-[11px] text-emerald-700 font-medium mt-1 block">Transferred via NEFT/IMPS</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-soft">
            <span className="text-xs text-stone-500 font-medium block">Settlement in Pipeline</span>
            <span className="text-2xl font-bold text-amber-700 mt-1 block">
              ₹{(dueTotal / 100).toLocaleString("en-IN")}
            </span>
            <span className="text-[11px] text-stone-500 mt-1 block">Due upon completion</span>
          </div>
        </div>

        {/* Bank Details & Commission Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-xs">
          <div className="bg-white p-6 rounded-2xl border border-stone-200/90 shadow-soft">
            <h3 className="font-serif font-bold text-stone-900 text-base mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-rose-700" /> Registered Payout Bank Account
            </h3>
            <div className="space-y-3 text-stone-700">
              <div className="flex justify-between py-1.5 border-b border-stone-100">
                <span className="text-stone-500">Account Holder:</span>
                <span className="font-semibold text-stone-900">{vendor.accountHolderName || vendor.businessName}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-stone-100">
                <span className="text-stone-500">Bank Name:</span>
                <span className="font-semibold text-stone-900">{vendor.bankName || "HDFC Bank"}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-stone-100">
                <span className="text-stone-500">Account Number:</span>
                <span className="font-mono text-stone-900 font-semibold">
                  {vendor.bankAccountNumber
                    ? `•••• •••• ${vendor.bankAccountNumber.slice(-4)}`
                    : "Not configured"}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-stone-500">IFSC Code:</span>
                <span className="font-mono text-stone-900 font-semibold">{vendor.bankIfsc || "N/A"}</span>
              </div>
            </div>

            <Link
              href="/vendor/profile"
              className="mt-5 block text-center py-2.5 bg-warm-100 hover:bg-warm-200 text-stone-800 rounded-xl font-semibold transition"
            >
              Update Payout Account in Profile
            </Link>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200/90 shadow-soft">
            <h3 className="font-serif font-bold text-stone-900 text-base mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-700" /> Platform Tier & Commission
            </h3>
            <div className="space-y-4 text-stone-700">
              <p className="leading-relaxed text-stone-600 text-xs">
                Your artisan account is enrolled on the standard <strong>{vendor.commissionRate || 10}% platform commission</strong> tier based on your verified category.
              </p>
              <div className="p-4 bg-warm-50 rounded-xl space-y-2 border border-stone-200/80">
                <div className="flex justify-between text-stone-600 text-xs">
                  <span>Gross Value Invoiced:</span>
                  <span className="font-semibold text-stone-900">₹{(totalCollected / 100).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-stone-600 text-xs">
                  <span>Commission Retained (10%):</span>
                  <span className="font-semibold text-rose-700">₹{(totalCommission / 100).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-stone-800 pt-2 border-t border-stone-200 font-bold text-xs">
                  <span>Net Artisan Entitlement:</span>
                  <span className="text-emerald-700">₹{((totalCollected - totalCommission) / 100).toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Settlements Log */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200/90 shadow-soft">
          <h3 className="font-serif font-bold text-stone-900 text-base mb-4">Direct Bank Settlement Records</h3>

          {settlements.length === 0 ? (
            <p className="text-xs text-stone-500 py-8 text-center">
              No settlements logged yet. Settlements are calculated automatically upon full payment confirmation.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-stone-700">
                <thead className="text-[11px] uppercase tracking-wider text-stone-500 border-b border-stone-200">
                  <tr>
                    <th className="pb-3 font-semibold">Booking Code</th>
                    <th className="pb-3 font-semibold">Gross Amount</th>
                    <th className="pb-3 font-semibold">Commission ({vendor.commissionRate}%)</th>
                    <th className="pb-3 font-semibold">Net Disbursed</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Reference</th>
                    <th className="pb-3 text-right font-semibold">Settled Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {settlements.map((s) => (
                    <tr key={s.id} className="hover:bg-warm-50/60 transition">
                      <td className="py-3 font-mono font-bold text-stone-900">#{s.booking.bookingCode}</td>
                      <td className="py-3 font-medium">₹{(s.grossAmount / 100).toLocaleString("en-IN")}</td>
                      <td className="py-3 text-rose-700 font-medium">₹{(s.platformCommission / 100).toLocaleString("en-IN")}</td>
                      <td className="py-3 font-bold text-emerald-700">
                        ₹{(s.netSettlementAmount / 100).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3">
                        <Badge variant={s.status === "SETTLED" ? "success" : "warning"}>
                          {s.status}
                        </Badge>
                      </td>
                      <td className="py-3 font-mono text-stone-500">{s.settlementRef || "PENDING"}</td>
                      <td className="py-3 text-right text-stone-500">
                        {s.settledAt
                          ? new Date(s.settledAt).toLocaleDateString("en-IN")
                          : "Processing"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
