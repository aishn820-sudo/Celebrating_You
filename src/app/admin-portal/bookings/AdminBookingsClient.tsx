"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarRange,
  Clock,
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  FileText,
  AlertCircle,
  X,
  CreditCard,
} from "lucide-react";
import InvoiceModal from "@/components/InvoiceModal";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export default function AdminBookingsClient({ initialBookings }: { initialBookings: any[] }) {
  const router = useRouter();
  const [bookings, setBookings] = useState(initialBookings);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [inspectingBooking, setInspectingBooking] = useState<any>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // Refund dialog state
  const [refundBooking, setRefundBooking] = useState<any>(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("Administrative cancellation refund");
  const [loading, setLoading] = useState(false);

  const filtered = bookings.filter((b) => {
    if (statusFilter !== "ALL" && b.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchCode = b.bookingCode.toLowerCase().includes(q);
      const matchCust = b.customer?.name.toLowerCase().includes(q);
      const matchVendor = b.vendor?.businessName.toLowerCase().includes(q);
      if (!matchCode && !matchCust && !matchVendor) return false;
    }
    return true;
  });

  const handleProcessRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/admin/bookings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: refundBooking.id,
          action: "PROCESS_REFUND",
          reason: refundReason,
          refundAmount: Number(refundAmount),
        }),
      });

      if (!res.ok) throw new Error("Failed to process refund");

      setRefundBooking(null);
      router.refresh();
      window.location.reload();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 p-6 sm:p-10 max-w-7xl overflow-y-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-semibold tracking-wider uppercase text-rose-700">
            Booking Engine Operations
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-1">
            Bookings & Response Oversight
          </h1>
          <p className="text-xs text-stone-600 mt-1">
            Full auditability into booking state machines, 2-hour response windows, payment milestone receipts, and refunds.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-soft mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {[
            { label: "All Bookings", val: "ALL" },
            { label: "Awaiting Vendor", val: "REQUEST_SUBMITTED" },
            { label: "Awaiting Advance", val: "ACCEPTED_AWAITING_ADVANCE" },
            { label: "Confirmed", val: "CONFIRMED" },
            { label: "Completed", val: "COMPLETED" },
            { label: "Expired (2h)", val: "EXPIRED" },
            { label: "Refunded", val: "REFUNDED" },
          ].map((tab) => (
            <button
              key={tab.val}
              onClick={() => setStatusFilter(tab.val)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                statusFilter === tab.val
                  ? "bg-rose-700 text-white shadow-sm"
                  : "bg-warm-100 text-stone-700 hover:bg-warm-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search booking code, customer, vendor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-warm-50 border border-stone-300 text-stone-900 text-xs placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-stone-700">
            <thead className="text-[11px] uppercase tracking-wider text-stone-500 bg-warm-50/70 border-b border-stone-200">
              <tr>
                <th className="py-4 px-6 font-semibold">Booking Code</th>
                <th className="py-4 px-4 font-semibold">Service & Artisan</th>
                <th className="py-4 px-4 font-semibold">Customer</th>
                <th className="py-4 px-4 font-semibold">Event Date</th>
                <th className="py-4 px-4 font-semibold">Agreed Value</th>
                <th className="py-4 px-4 font-semibold">Status</th>
                <th className="py-4 px-4 font-semibold">Invoices</th>
                <th className="py-4 px-6 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-warm-50/60 transition">
                  <td className="py-4 px-6 font-mono font-bold text-rose-700">
                    #{b.bookingCode}
                  </td>
                  <td className="py-4 px-4">
                    <strong className="text-stone-900 text-sm block">{b.service.title}</strong>
                    <span className="text-[11px] text-stone-500">{b.vendor.businessName}</span>
                  </td>
                  <td className="py-4 px-4">
                    <p className="font-semibold text-stone-900">{b.customer.name}</p>
                    <p className="text-[11px] text-stone-500">{b.customer.phone}</p>
                  </td>
                  <td className="py-4 px-4 font-medium">{b.eventDate}</td>
                  <td className="py-4 px-4 font-bold text-stone-900">
                    ₹{(b.agreedServiceValue / 100).toLocaleString("en-IN")}
                  </td>
                  <td className="py-4 px-4">
                    <Badge
                      variant={
                        b.status === "CONFIRMED" || b.status === "COMPLETED"
                          ? "success"
                          : b.status === "REQUEST_SUBMITTED" || b.status === "ACCEPTED_AWAITING_ADVANCE"
                          ? "warning"
                          : b.status === "EXPIRED" || b.status === "CANCELLED" || b.status === "REFUNDED"
                          ? "danger"
                          : "neutral"
                      }
                    >
                      {b.status.replace(/_/g, " ")}
                    </Badge>
                  </td>
                  <td className="py-4 px-4">
                    {b.invoices?.length > 0 ? (
                      <span className="text-emerald-700 font-semibold">{b.invoices.length} receipt(s)</span>
                    ) : (
                      <span className="text-stone-400">None</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setInspectingBooking(b)}
                        className="px-3 py-1.5 bg-warm-100 hover:bg-warm-200 text-stone-800 rounded-xl font-semibold text-[11px] transition"
                      >
                        Audit
                      </button>

                      {b.advancePaid > 0 && b.status !== "REFUNDED" && (
                        <button
                          onClick={() => {
                            setRefundBooking(b);
                            setRefundAmount((b.advancePaid / 100).toString());
                          }}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-semibold text-[11px] transition"
                        >
                          Refund
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* INSPECT BOOKING MODAL */}
      {inspectingBooking && (
        <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 border border-stone-200 shadow-2xl text-xs text-stone-800 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-5">
              <div>
                <span className="font-mono text-stone-500 text-[10px] font-semibold">#{inspectingBooking.bookingCode}</span>
                <h3 className="font-serif font-bold text-stone-900 text-lg">{inspectingBooking.service.title}</h3>
              </div>
              <button
                onClick={() => setInspectingBooking(null)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-warm-50 rounded-2xl border border-stone-200 mb-5 space-y-2">
              <div className="flex justify-between">
                <span className="text-stone-500">Customer:</span>
                <span className="font-semibold text-stone-900">{inspectingBooking.customer.name} ({inspectingBooking.customer.phone})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Vendor:</span>
                <span className="font-semibold text-stone-900">{inspectingBooking.vendor.businessName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Event Date:</span>
                <span className="text-stone-900 font-medium">{inspectingBooking.eventDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Agreed Contract:</span>
                <span className="font-bold text-stone-900">₹{(inspectingBooking.agreedServiceValue / 100).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Advance Paid:</span>
                <span className="font-bold text-emerald-700">₹{(inspectingBooking.advancePaid / 100).toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Invoices List */}
            {inspectingBooking.invoices.length > 0 && (
              <div className="mb-4">
                <span className="font-semibold text-stone-900 block mb-2 text-xs">Generated Tax Invoices / Receipts</span>
                <div className="space-y-2">
                  {inspectingBooking.invoices.map((inv: any) => (
                    <div
                      key={inv.id}
                      className="p-3 bg-warm-50 rounded-xl border border-stone-200 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-mono text-rose-700 font-semibold">{inv.invoiceNumber}</span>
                        <p className="text-[11px] text-stone-500">{inv.type} • ₹{(inv.amount / 100).toLocaleString("en-IN")}</p>
                      </div>
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="px-3 py-1 bg-white hover:bg-stone-50 text-stone-800 border border-stone-200 rounded-lg font-semibold text-[11px] shadow-xs"
                      >
                        View PDF
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REFUND MODAL */}
      {refundBooking && (
        <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-stone-200 shadow-2xl text-xs text-stone-800">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-5">
              <h3 className="font-serif font-bold text-stone-900 text-lg">Process Administrative Refund</h3>
              <button onClick={() => setRefundBooking(null)} className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProcessRefund} className="space-y-4">
              <p className="text-stone-600 leading-relaxed text-xs">
                Refunding booking <strong className="font-mono text-stone-900">#{refundBooking.bookingCode}</strong> for{" "}
                {refundBooking.customer.name}.
              </p>

              <div>
                <label className="block font-semibold text-stone-800 mb-1">Refund Amount (INR)</label>
                <input
                  type="number"
                  required
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-800 mb-1">Reason for Refund</label>
                <input
                  type="text"
                  required
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-xs"
                />
              </div>

              <Button
                type="submit"
                variant="danger"
                disabled={loading}
                className="w-full justify-center py-2.5 shadow-soft"
              >
                {loading ? "Processing Refund..." : "Confirm & Authorize Refund"}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* INVOICE MODAL */}
      {selectedInvoice && (
        <InvoiceModal
          onClose={() => setSelectedInvoice(null)}
          invoice={selectedInvoice}
        />
      )}
    </main>
  );
}
