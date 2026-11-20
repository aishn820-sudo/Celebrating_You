"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Clock,
  ShieldCheck,
  CreditCard,
  FileText,
  AlertTriangle,
  Star,
  CheckCircle2,
  Lock,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertCircle,
  X,
  ArrowLeft,
  MessageSquare,
} from "lucide-react";
import InvoiceModal from "@/components/InvoiceModal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";

export default function CustomerBookingDetailClient({ booking: initialBooking }: { booking: any }) {
  const router = useRouter();
  const [booking, setBooking] = useState(initialBooking);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // Review modal state
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");

  // Dispute modal state
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);
  const [disputeSubject, setDisputeSubject] = useState("");
  const [disputeDesc, setDisputeDesc] = useState("");
  const [disputeLoading, setDisputeLoading] = useState(false);
  const [disputeSuccess, setDisputeSuccess] = useState(false);

  // Payment state
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");

  const handlePay = async (type: "ADVANCE" | "FINAL") => {
    setPaying(true);
    setPayError("");

    try {
      const res = await fetch("/api/customer/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          type,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Payment failed");
      }

      router.refresh();
      window.location.reload();
    } catch (err: any) {
      setPayError(err.message);
    } finally {
      setPaying(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewLoading(true);
    setReviewError("");

    try {
      const res = await fetch("/api/customer/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          rating,
          comment,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit review");
      }

      setIsReviewOpen(false);
      router.refresh();
      window.location.reload();
    } catch (err: any) {
      setReviewError(err.message);
    } finally {
      setReviewLoading(false);
    }
  };

  const handleDisputeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDisputeLoading(true);

    try {
      const res = await fetch("/api/customer/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          subject: disputeSubject,
          description: disputeDesc,
          priority: "HIGH",
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to report issue");
      }

      setDisputeSuccess(true);
      setTimeout(() => {
        setIsDisputeOpen(false);
        router.refresh();
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDisputeLoading(false);
    }
  };

  const formatPrice = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;

  const isConfirmed = booking.status === "CONFIRMED" || booking.status === "IN_PROGRESS";
  const isAwaitingAdvance = booking.status === "ACCEPTED_AWAITING_ADVANCE";
  const isCompleted = booking.status === "COMPLETED";

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-dark-bg flex flex-col font-sans text-stone-800 dark:text-dark-text-primary">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        {/* Back Link */}
        <Link
          href="/customer/bookings"
          className="inline-flex items-center gap-2 text-xs font-semibold text-stone-500 dark:text-dark-text-secondary hover:text-stone-900 dark:hover:text-dark-text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Bookings
        </Link>

        {/* Top Header Card */}
        <Card className="p-6 sm:p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-stone-100 dark:border-dark-border">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="text-xs font-mono font-bold text-stone-400 dark:text-stone-500">
                  #{booking.bookingCode}
                </span>
                <Badge
                  variant={
                    isConfirmed || isCompleted
                      ? "success"
                      : isAwaitingAdvance
                      ? "warning"
                      : ["DECLINED", "EXPIRED", "CANCELLED"].includes(booking.status)
                      ? "danger"
                      : "neutral"
                  }
                  size="sm"
                  dot
                >
                  {booking.status.replace(/_/g, " ")}
                </Badge>
              </div>

              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-dark-text-primary tracking-tight">
                {booking.service.title}
              </h1>
              <p className="text-xs text-stone-500 dark:text-dark-text-secondary mt-1">
                Artisan: <strong className="text-stone-800 dark:text-dark-text-primary">{booking.vendor.businessName}</strong> • Celebration:{" "}
                <strong className="text-stone-800 dark:text-dark-text-primary">{booking.event?.title}</strong> ({new Date(booking.eventDate).toLocaleDateString("en-IN")})
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-3">
              {isAwaitingAdvance && (
                <Button
                  variant="champagne"
                  size="sm"
                  isLoading={paying}
                  onClick={() => handlePay("ADVANCE")}
                >
                  Pay Advance ({formatPrice(booking.advanceRequired)})
                </Button>
              )}

              {isConfirmed && booking.finalBalanceDue > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  isLoading={paying}
                  onClick={() => handlePay("FINAL")}
                >
                  Pay Balance ({formatPrice(booking.finalBalanceDue)})
                </Button>
              )}

              {isCompleted && !booking.reviews?.[0] && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsReviewOpen(true)}
                  leftIcon={<Star className="w-4 h-4" />}
                >
                  Rate & Review Artisan
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDisputeOpen(true)}
                className="text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                Report Issue
              </Button>
            </div>
          </div>

          {/* Contact Disclosure Banner */}
          <div className="mt-6 pt-2">
            {booking.isVendorContactRevealed ? (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/80 dark:border-emerald-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-200 uppercase tracking-wide">
                      Direct Artisan Contact Unlocked
                    </h4>
                    <p className="text-xs text-emerald-900 dark:text-emerald-300 mt-0.5">
                      Advance deposit confirmed. You may now coordinate directly with the vendor.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-semibold text-emerald-950 dark:text-emerald-200">
                  <span className="flex items-center gap-1.5 bg-white dark:bg-dark-elevated px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> {booking.vendor.phone}
                  </span>
                  <span className="flex items-center gap-1.5 bg-white dark:bg-dark-elevated px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <Mail className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> {booking.vendor.email}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-warm-100/70 dark:bg-dark-elevated rounded-xl border border-stone-200 dark:border-dark-border flex items-center gap-3 text-xs text-stone-600 dark:text-dark-text-secondary">
                <Lock className="w-4 h-4 text-stone-500 dark:text-stone-400 shrink-0" />
                <span>
                  <strong>Privacy Protected:</strong> Direct phone and email details are revealed immediately after vendor acceptance and advance deposit confirmation.
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Two Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT 2 COLUMNS: Financial Breakdown & Official Documents */}
          <div className="lg:col-span-2 space-y-8">
            {/* Financial Ledger Card */}
            <Card className="p-6 sm:p-7">
              <CardTitle className="mb-4">Financial Ledger & Milestone Summary</CardTitle>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-stone-50 dark:bg-dark-elevated rounded-xl border border-stone-200/80 dark:border-dark-border">
                  <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider block">
                    Agreed Package Value
                  </span>
                  <span className="text-xl font-bold font-serif text-stone-900 dark:text-dark-text-primary mt-1 block">
                    {formatPrice(booking.agreedServiceValue)}
                  </span>
                </div>

                <div className="p-4 bg-stone-50 dark:bg-dark-elevated rounded-xl border border-stone-200/80 dark:border-dark-border">
                  <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider block">
                    Advance Paid
                  </span>
                  <span className={`text-xl font-bold font-serif mt-1 block ${booking.advancePaid > 0 ? "text-emerald-700 dark:text-emerald-400" : "text-stone-500 dark:text-stone-400"}`}>
                    {formatPrice(booking.advancePaid)}
                  </span>
                </div>

                <div className="p-4 bg-stone-50 dark:bg-dark-elevated rounded-xl border border-stone-200/80 dark:border-dark-border">
                  <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider block">
                    Remaining Balance Due
                  </span>
                  <span className="text-xl font-bold font-serif text-rose-700 dark:text-rose-400 mt-1 block">
                    {formatPrice(booking.finalBalanceDue)}
                  </span>
                </div>
              </div>

              {/* Invoices List */}
              <div>
                <h4 className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-3">
                  Transaction Invoices & Receipts
                </h4>
                {booking.invoices.length === 0 ? (
                  <p className="text-xs text-stone-400 dark:text-stone-500 italic">
                    No transaction receipts generated yet. Invoices generate instantly upon each confirmed milestone payment.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {booking.invoices.map((inv: any) => (
                      <div
                        key={inv.id}
                        className="p-4 rounded-xl border border-stone-200 dark:border-dark-border bg-white dark:bg-dark-surface flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-stone-100 dark:bg-dark-elevated flex items-center justify-center text-stone-700 dark:text-stone-300">
                            <FileText className="w-4 h-4 text-rose-700 dark:text-rose-400" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-stone-900 dark:text-dark-text-primary block">
                              {inv.type === "ADVANCE" ? "Document 1: Advance Receipt" : "Document 2: Final Tax Invoice"}
                            </span>
                            <span className="text-[11px] font-mono text-stone-400 dark:text-stone-500">
                              #{inv.invoiceNumber} • Paid on {new Date(inv.paymentDate).toLocaleDateString("en-IN")}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="text-sm font-bold text-stone-900 dark:text-dark-text-primary">
                            {formatPrice(inv.amountPaidThisDoc)}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedInvoice(inv)}
                          >
                            View & Download PDF
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Status History & Audit Timeline */}
            <Card className="p-6 sm:p-7">
              <CardTitle className="mb-4">Lifecycle Audit & History</CardTitle>
              <div className="space-y-4">
                {booking.statusHistory.map((hist: any, idx: number) => (
                  <div key={hist.id} className="flex items-start gap-3 text-xs">
                    <div className="w-2 h-2 rounded-full bg-rose-700 mt-1.5 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-900">
                          {hist.fromStatus} → {hist.toStatus}
                        </span>
                        <span className="text-[10px] text-stone-400 font-mono">
                          {new Date(hist.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-stone-600 mt-0.5">{hist.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* RIGHT COLUMN: Service Specification */}
          <div className="space-y-6">
            <Card className="p-6">
              <CardTitle className="mb-3">Booking Package Details</CardTitle>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-stone-400 dark:text-stone-500 block text-[10px] uppercase font-bold tracking-wider">Tier</span>
                  <span className="font-bold text-stone-900 dark:text-dark-text-primary text-sm">{booking.package?.name || "Standard Booking"}</span>
                </div>
                <div>
                  <span className="text-stone-400 dark:text-stone-500 block text-[10px] uppercase font-bold tracking-wider">Date</span>
                  <span className="font-medium text-stone-800 dark:text-stone-200">{new Date(booking.eventDate).toLocaleDateString("en-IN")}</span>
                </div>
                {booking.guestCount && (
                  <div>
                    <span className="text-stone-400 dark:text-stone-500 block text-[10px] uppercase font-bold tracking-wider">Guest Count</span>
                    <span className="font-medium text-stone-800 dark:text-stone-200">{booking.guestCount} Guests</span>
                  </div>
                )}
                {booking.specialRequirements && (
                  <div>
                    <span className="text-stone-400 dark:text-stone-500 block text-[10px] uppercase font-bold tracking-wider">Special Requests</span>
                    <p className="text-stone-600 dark:text-dark-text-secondary mt-0.5 bg-stone-50 dark:bg-dark-elevated p-2.5 rounded-lg border border-stone-200/80 dark:border-dark-border">
                      {booking.specialRequirements}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Response SLA reminder */}
            <Card className="p-6 bg-warm-100/50 dark:bg-dark-elevated border-stone-200 dark:border-dark-border">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-rose-700 dark:text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-stone-900 dark:text-dark-text-primary text-xs">2-Hour Guarantee</h4>
                  <p className="text-[11px] text-stone-600 dark:text-dark-text-secondary mt-0.5 leading-relaxed">
                    Celebrating YOU guarantees that unconfirmed requests automatically expire to ensure your event planning timeline is protected.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Invoice Modal Preview */}
        {selectedInvoice && (
          <InvoiceModal
            invoice={selectedInvoice}
            onClose={() => setSelectedInvoice(null)}
          />
        )}

        {/* Review Modal */}
        <Modal
          isOpen={isReviewOpen}
          onClose={() => setIsReviewOpen(false)}
          title="Rate & Review Artisan"
          description={`Share your experience with ${booking.vendor.businessName}`}
        >
          <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
            {reviewError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-900/40">
                {reviewError}
              </div>
            )}
            <div>
              <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">Star Rating (1 - 5)</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating
                          ? "fill-amber-500 text-amber-500"
                          : "text-stone-200 dark:text-stone-700 fill-stone-200 dark:fill-stone-700"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">Feedback</label>
              <textarea
                rows={4}
                required
                placeholder="How was the quality of service, punctuality, and professionalism?"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-dark-border text-stone-900 dark:text-dark-text-primary bg-white dark:bg-dark-elevated"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={reviewLoading}
              className="w-full"
            >
              Submit Verified Review
            </Button>
          </form>
        </Modal>

        {/* Dispute / Issue Modal */}
        <Modal
          isOpen={isDisputeOpen}
          onClose={() => setIsDisputeOpen(false)}
          title="Report Private Issue / Dispute"
          description="Submit an urgent inquiry to Celebrating YOU Support and the Vendor"
        >
          {disputeSuccess ? (
            <div className="py-6 text-center text-xs">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
              <p className="font-bold text-stone-900 dark:text-dark-text-primary text-sm">Issue Ticket Logged</p>
              <p className="text-stone-500 dark:text-dark-text-secondary mt-1">Our resolution team will inspect this ticket.</p>
            </div>
          ) : (
            <form onSubmit={handleDisputeSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Delay in arrival, missing inclusions"
                  value={disputeSubject}
                  onChange={(e) => setDisputeSubject(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-dark-border text-stone-900 dark:text-dark-text-primary bg-white dark:bg-dark-elevated"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">Description</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide all relevant details..."
                  value={disputeDesc}
                  onChange={(e) => setDisputeDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-dark-border text-stone-900 dark:text-dark-text-primary bg-white dark:bg-dark-elevated"
                />
              </div>

              <Button
                type="submit"
                variant="danger"
                size="md"
                isLoading={disputeLoading}
                className="w-full"
              >
                Submit Dispute Ticket
              </Button>
            </form>
          )}
        </Modal>
      </main>
    </div>
  );
}
