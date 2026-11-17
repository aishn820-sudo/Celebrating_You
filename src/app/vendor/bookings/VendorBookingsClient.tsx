"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Users,
  FileText,
  X,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import InvoiceModal from "@/components/InvoiceModal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";

export default function VendorBookingsClient({
  initialBookings,
  vendor,
}: {
  initialBookings: any[];
  vendor: any;
}) {
  const router = useRouter();
  const [bookings, setBookings] = useState(initialBookings);
  const [activeTab, setActiveTab] = useState("ALL");
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // Response modal state
  const [respondingBooking, setRespondingBooking] = useState<any>(null);
  const [responseDecision, setResponseDecision] = useState<"ACCEPT" | "DECLINE">("ACCEPT");
  const [declineReason, setDeclineReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [warningMessage, setWarningMessage] = useState("");

  // Live countdown update effect
  useEffect(() => {
    const timer = setInterval(() => {
      setBookings((prev) =>
        prev.map((b) => {
          if (b.timeRemainingSeconds > 0) {
            return { ...b, timeRemainingSeconds: b.timeRemainingSeconds - 1 };
          }
          return b;
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (seconds: number) => {
    if (seconds <= 0) return "EXPIRED";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m < 10 ? "0" : ""}${m}m ${s < 10 ? "0" : ""}${s}s`;
  };

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === "ALL") return true;
    if (activeTab === "NEW_REQUESTS")
      return ["REQUEST_SUBMITTED", "AWAITING_VENDOR_RESPONSE"].includes(b.status);
    if (activeTab === "AWAITING_ADVANCE") return b.status === "ACCEPTED_AWAITING_ADVANCE";
    if (activeTab === "CONFIRMED") return ["CONFIRMED", "IN_PROGRESS"].includes(b.status);
    if (activeTab === "COMPLETED") return b.status === "COMPLETED";
    if (activeTab === "DECLINED_EXPIRED")
      return ["DECLINED", "EXPIRED", "CANCELLED"].includes(b.status);
    return true;
  });

  const handleRespondSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/vendor/bookings/${respondingBooking.id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: responseDecision,
          reason: declineReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to respond");
      }

      if (data.warning) {
        setWarningMessage(data.warning);
      }

      setRespondingBooking(null);
      router.refresh();
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTransitionStatus = async (bookingId: string, status: "IN_PROGRESS" | "COMPLETED") => {
    try {
      const res = await fetch(`/api/vendor/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        router.refresh();
        window.location.reload();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const formatPrice = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;

  return (
    <main className="flex-1 p-6 sm:p-10 max-w-7xl overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <Badge variant="rose" size="sm" className="mb-2">
            Operations Queue
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight">
            Booking Requests & 2-Hour SLA
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Accept or decline new requests within the mandatory 2-hour window. Manage confirmed contracts.
          </p>
        </div>

        {warningMessage && (
          <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs font-semibold">
            {warningMessage}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {[
          { label: "All Bookings", val: "ALL" },
          { label: "New Requests (2h SLA)", val: "NEW_REQUESTS" },
          { label: "Awaiting Advance", val: "AWAITING_ADVANCE" },
          { label: "Confirmed Engagements", val: "CONFIRMED" },
          { label: "Completed", val: "COMPLETED" },
          { label: "Declined / Expired", val: "DECLINED_EXPIRED" },
        ].map((tab) => (
          <button
            key={tab.val}
            onClick={() => setActiveTab(tab.val)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === tab.val
                ? "bg-stone-900 text-white font-bold shadow-sm"
                : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bookings Queue */}
      {filteredBookings.length === 0 ? (
        <EmptyState
          icon={<Clock className="w-6 h-6" />}
          title="No bookings in this filter"
          description="Incoming client booking requests will appear here with an active 2-hour response timer."
        />
      ) : (
        <div className="space-y-6">
          {filteredBookings.map((b) => {
            const isNew = ["REQUEST_SUBMITTED", "AWAITING_VENDOR_RESPONSE"].includes(b.status);
            const isAwaitingAdvance = b.status === "ACCEPTED_AWAITING_ADVANCE";
            const isConfirmed = ["CONFIRMED", "IN_PROGRESS"].includes(b.status);
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
                            : isNew || isAwaitingAdvance
                            ? "warning"
                            : "danger"
                        }
                        size="sm"
                        dot
                      >
                        {b.status.replace(/_/g, " ")}
                      </Badge>

                      {isNew && b.timeRemainingSeconds > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full animate-pulse">
                          <Clock className="w-3.5 h-3.5" /> {formatCountdown(b.timeRemainingSeconds)}
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-serif font-bold text-stone-900 leading-snug">
                      {b.service.title}
                    </h3>
                    <p className="text-xs text-stone-500 mt-1">
                      Event: <strong className="text-stone-800">{b.event?.title}</strong> • Date:{" "}
                      <strong className="text-stone-800">{new Date(b.eventDate).toLocaleDateString("en-IN")}</strong>
                    </p>
                  </div>

                  {/* Financial Values */}
                  <div className="flex flex-wrap items-center gap-6 text-xs bg-stone-50 p-4 rounded-xl border border-stone-200/80">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">
                        Contract Value
                      </span>
                      <span className="font-bold text-stone-900 text-sm">
                        {formatPrice(b.agreedServiceValue)}
                      </span>
                    </div>
                    <div className="border-l border-stone-200 pl-4">
                      <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">
                        Advance Deposit
                      </span>
                      <span className={`font-bold text-sm ${b.advancePaid > 0 ? "text-emerald-700" : "text-stone-500"}`}>
                        {formatPrice(b.advancePaid)}
                      </span>
                    </div>
                    <div className="border-l border-stone-200 pl-4">
                      <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">
                        Final Balance Due
                      </span>
                      <span className="font-bold text-rose-700 text-sm">
                        {formatPrice(b.finalBalanceDue)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Client Contact Details (Masked or Unlocked) */}
                <div className="py-4 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-stone-800">Client: {b.customer?.name}</span>
                    <span className="text-stone-400">•</span>
                    <span className="text-stone-500">{b.customer?.phone}</span>
                    <span className="text-stone-400">•</span>
                    <span className="text-stone-500">{b.customer?.email}</span>
                  </div>

                  {!b.isCustomerContactRevealed && (
                    <span className="text-[11px] text-stone-400 flex items-center gap-1 italic">
                      <Lock className="w-3.5 h-3.5" /> Client phone & email unlock once advance is paid
                    </span>
                  )}
                </div>

                {/* Action Controls */}
                <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {b.invoices && b.invoices.length > 0 ? (
                      b.invoices.map((inv: any) => (
                        <button
                          key={inv.id}
                          onClick={() => setSelectedInvoice(inv)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5 text-stone-500" />
                          <span>{inv.type === "ADVANCE" ? "Doc 1 Receipt" : "Doc 2 Final"}</span>
                        </button>
                      ))
                    ) : (
                      <span className="text-xs text-stone-400 italic">No invoices issued yet</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {isNew && (
                      <>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            setRespondingBooking(b);
                            setResponseDecision("DECLINE");
                            setDeclineReason("");
                          }}
                        >
                          Decline Request
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setRespondingBooking(b);
                            setResponseDecision("ACCEPT");
                            setDeclineReason("");
                          }}
                        >
                          Accept Booking (2h SLA)
                        </Button>
                      </>
                    )}

                    {isConfirmed && b.status === "CONFIRMED" && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleTransitionStatus(b.id, "IN_PROGRESS")}
                      >
                        Start Service Execution
                      </Button>
                    )}

                    {isConfirmed && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleTransitionStatus(b.id, "COMPLETED")}
                      >
                        Mark Service Delivered / Completed
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Response Modal (Accept or Decline) */}
      <Modal
        isOpen={!!respondingBooking}
        onClose={() => setRespondingBooking(null)}
        title={responseDecision === "ACCEPT" ? "Accept Booking Request" : "Decline Booking Request"}
        description={`Booking #${respondingBooking?.bookingCode} • ${respondingBooking?.service?.title}`}
      >
        <form onSubmit={handleRespondSubmit} className="space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 rounded-xl border border-rose-200">
              {error}
            </div>
          )}

          {responseDecision === "ACCEPT" ? (
            <div className="p-4 bg-emerald-50 rounded-xl text-emerald-950 border border-emerald-200/80 leading-relaxed">
              <p className="font-bold text-sm mb-1">Accepting Commitment</p>
              By accepting, you confirm your availability for this event on{" "}
              <strong>{respondingBooking?.eventDate}</strong>. The client will be instructed to pay the advance deposit to lock your service.
            </div>
          ) : (
            <div>
              <label className="font-bold text-stone-700 block mb-1">Reason for Declining (Required)</label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Schedule already committed for evening reception, out of travel bounds..."
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-300 text-stone-900"
              />
              <p className="text-[11px] text-stone-400 mt-1">
                Note: Excessive weekly declines (above 3) may trigger platform administrative review.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              className="w-1/2"
              onClick={() => setRespondingBooking(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={responseDecision === "ACCEPT" ? "primary" : "danger"}
              size="md"
              isLoading={loading}
              className="w-1/2"
            >
              {responseDecision === "ACCEPT" ? "Confirm Acceptance" : "Decline Request"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Invoice Modal Preview */}
      {selectedInvoice && (
        <InvoiceModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </main>
  );
}
