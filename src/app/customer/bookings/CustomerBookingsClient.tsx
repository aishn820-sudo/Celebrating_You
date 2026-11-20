"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Calendar,
  CreditCard,
  FileText,
  Clock,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Lock,
} from "lucide-react";
import InvoiceModal from "@/components/InvoiceModal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";

export default function CustomerBookingsClient({ initialBookings }: { initialBookings: any[] }) {
  const router = useRouter();
  const [bookings, setBookings] = useState(initialBookings);
  const [filter, setFilter] = useState("ALL");
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [payingBooking, setPayingBooking] = useState<any>(null);
  const [payType, setPayType] = useState<"ADVANCE" | "FINAL">("ADVANCE");
  const [payLoading, setPayLoading] = useState(false);
  const [payMessage, setPayMessage] = useState("");

  const filteredBookings = bookings.filter((b) => {
    if (filter === "ALL") return true;
    if (filter === "AWAITING_ADVANCE") return b.status === "ACCEPTED_AWAITING_ADVANCE";
    if (filter === "CONFIRMED") return b.status === "CONFIRMED" || b.status === "IN_PROGRESS";
    if (filter === "COMPLETED") return b.status === "COMPLETED";
    if (filter === "CANCELLED") return ["CANCELLED", "REFUNDED", "DECLINED", "EXPIRED"].includes(b.status);
    return true;
  });

  const handlePay = async (booking: any, type: "ADVANCE" | "FINAL") => {
    setPayingBooking(booking);
    setPayType(type);
    setPayLoading(false);
    setPayMessage("");
  };

  const executePayment = async () => {
    if (!payingBooking) return;
    setPayLoading(true);
    setPayMessage("");

    try {
      const res = await fetch("/api/customer/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: payingBooking.id,
          type: payType,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Payment failed");
      }

      setPayMessage("Payment processed successfully!");
      setTimeout(() => {
        setPayingBooking(null);
        router.refresh();
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      setPayMessage(`Error: ${err.message}`);
    } finally {
      setPayLoading(false);
    }
  };

  const formatPrice = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;

  return (
    <div className="min-h-screen bg-warm-50 flex flex-col font-sans text-stone-800">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        {/* Header */}
        <div className="mb-8">
          <Badge variant="rose" size="sm" className="mb-2">
            Client Center
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 tracking-tight">
            My Celebration Bookings & Invoices
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl">
            Track vendor responses, settle advance and balance milestones, and view official transaction receipts.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { label: "All Bookings", val: "ALL" },
            { label: "Awaiting Advance", val: "AWAITING_ADVANCE" },
            { label: "Confirmed", val: "CONFIRMED" },
            { label: "Completed", val: "COMPLETED" },
            { label: "Cancelled / Expired", val: "CANCELLED" },
          ].map((tab) => (
            <button
              key={tab.val}
              onClick={() => setFilter(tab.val)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                filter === tab.val
                  ? "bg-stone-900 text-white shadow-sm font-bold"
                  : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="w-6 h-6" />}
            title="No bookings in this view"
            description="Explore our marketplace to book top-tier photographers, caterers, bakers, or decorators."
            action={
              <Link href="/explore">
                <Button variant="primary" size="sm">
                  Explore Vendors
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-6">
            {filteredBookings.map((b) => {
              const isAwaitingAdvance = b.status === "ACCEPTED_AWAITING_ADVANCE";
              const isConfirmed = b.status === "CONFIRMED" || b.status === "IN_PROGRESS";
              const isCompleted = b.status === "COMPLETED";

              return (
                <Card key={b.id} hoverEffect className="p-6 sm:p-7">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-stone-100">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-mono font-bold text-stone-400">
                          #{b.bookingCode}
                        </span>
                        <Badge
                          variant={
                            isConfirmed || isCompleted
                              ? "success"
                              : isAwaitingAdvance
                              ? "warning"
                              : ["DECLINED", "EXPIRED", "CANCELLED"].includes(b.status)
                              ? "danger"
                              : "neutral"
                          }
                          size="sm"
                          dot
                        >
                          {b.status.replace(/_/g, " ")}
                        </Badge>
                      </div>

                      <h3 className="text-xl font-serif font-bold text-stone-900 leading-snug">
                        {b.service?.title || "Custom Service"}
                      </h3>
                      <p className="text-xs text-stone-500 mt-1">
                        By <strong className="text-stone-800">{b.vendor?.businessName || "Verified Vendor"}</strong> • Event:{" "}
                        <strong className="text-stone-800">{b.event?.title || "Independent Celebration"}</strong> ({b.eventDate ? new Date(b.eventDate).toLocaleDateString("en-IN") : "Date TBD"})
                      </p>
                    </div>

                    {/* Financial Summary */}
                    <div className="flex flex-wrap items-center gap-6 text-xs bg-stone-50 p-4 rounded-xl border border-stone-200/80">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">
                          Agreed Total
                        </span>
                        <span className="font-bold text-stone-900 text-sm">
                          {formatPrice(b.agreedServiceValue)}
                        </span>
                      </div>
                      <div className="border-l border-stone-200 pl-4">
                        <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">
                          Advance Paid
                        </span>
                        <span className={`font-bold text-sm ${b.advancePaid > 0 ? "text-emerald-700" : "text-stone-500"}`}>
                          {formatPrice(b.advancePaid)}
                        </span>
                      </div>
                      <div className="border-l border-stone-200 pl-4">
                        <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">
                          Balance Due
                        </span>
                        <span className="font-bold text-rose-700 text-sm">
                          {formatPrice(b.finalBalanceDue)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Lower Row: Invoices & Action Controls */}
                  <div className="pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Invoices */}
                    <div className="flex flex-wrap items-center gap-2">
                      {b.invoices && b.invoices.length > 0 ? (
                        b.invoices.map((inv: any) => (
                          <button
                            key={inv.id}
                            onClick={() => setSelectedInvoice(inv)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5 text-stone-500" />
                            <span>
                              {inv.type === "ADVANCE" ? "Doc 1 (Advance)" : "Doc 2 (Final)"} Receipt
                            </span>
                          </button>
                        ))
                      ) : (
                        <span className="text-xs text-stone-400 flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5" /> Official receipts generate upon payment
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                      {isAwaitingAdvance && (
                        <Button
                          variant="champagne"
                          size="sm"
                          onClick={() => handlePay(b, "ADVANCE")}
                        >
                          Pay Advance ({formatPrice(b.advanceRequired)})
                        </Button>
                      )}

                      {isConfirmed && b.finalBalanceDue > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePay(b, "FINAL")}
                        >
                          Pay Remaining Balance ({formatPrice(b.finalBalanceDue)})
                        </Button>
                      )}

                      <Link href={`/customer/bookings/${b.id}`}>
                        <Button variant="secondary" size="sm">
                          Details & Timeline <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Invoice Modal Preview */}
        {selectedInvoice && (
          <InvoiceModal
            invoice={selectedInvoice}
            onClose={() => setSelectedInvoice(null)}
          />
        )}

        {/* Payment Confirmation Modal */}
        <Modal
          isOpen={!!payingBooking}
          onClose={() => setPayingBooking(null)}
          title={`Confirm ${payType === "ADVANCE" ? "Advance Deposit" : "Final Balance"} Payment`}
          description={payingBooking?.service?.title}
        >
          {payMessage ? (
            <div className="py-6 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-stone-900">{payMessage}</p>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                <div className="flex justify-between text-stone-600">
                  <span>Vendor</span>
                  <span className="font-bold text-stone-900">{payingBooking?.vendor?.businessName}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Payment Type</span>
                  <span className="font-bold text-stone-900">
                    {payType === "ADVANCE" ? "Advance Milestone" : "Final Milestone"}
                  </span>
                </div>
                <div className="flex justify-between text-stone-900 font-bold border-t border-stone-200 pt-2 text-sm">
                  <span>Amount to Pay</span>
                  <span className="text-rose-700">
                    {formatPrice(
                      payType === "ADVANCE"
                        ? payingBooking?.advanceRequired
                        : payingBooking?.finalBalanceDue
                    )}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-900 text-[11px] leading-relaxed border border-emerald-200/80">
                <strong>Instant Reconciled Invoice:</strong> A compliant PDF receipt will be instantly generated, and vendor direct contact details will be unlocked.
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  size="md"
                  className="w-1/2"
                  onClick={() => setPayingBooking(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  className="w-1/2"
                  isLoading={payLoading}
                  onClick={executePayment}
                >
                  Pay Now
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </main>
    </div>
  );
}
