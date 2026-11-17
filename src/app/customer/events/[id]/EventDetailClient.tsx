"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Plus,
  AlertTriangle,
  Receipt,
  Check,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";

export default function EventDetailClient({ event: initialEvent }: { event: any }) {
  const router = useRouter();
  const [event, setEvent] = useState(initialEvent);
  const [newCheckpointTitle, setNewCheckpointTitle] = useState("");
  const [addingCheckpoint, setAddingCheckpoint] = useState(false);

  const toggleCheckpoint = async (cpId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "COMPLETED" ? "PENDING" : "COMPLETED";

    // Optimistic update
    setEvent((prev: any) => ({
      ...prev,
      checkpoints: prev.checkpoints.map((c: any) =>
        c.id === cpId ? { ...c, status: nextStatus } : c
      ),
    }));

    try {
      await fetch(`/api/customer/events/${event.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkpointUpdate: { checkpointId: cpId, cpStatus: nextStatus },
        }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const totalCommittedSpend = event.bookings
    .filter((b: any) => !["CANCELLED", "DECLINED", "EXPIRED"].includes(b.status))
    .reduce((sum: number, b: any) => sum + b.agreedServiceValue, 0);

  const totalPaid = event.bookings.reduce(
    (sum: number, b: any) => sum + b.advancePaid + b.finalPaid,
    0
  );

  const completedCheckpoints = event.checkpoints.filter((c: any) => c.status === "COMPLETED").length;
  const progressPercent =
    event.checkpoints.length > 0
      ? Math.round((completedCheckpoints / event.checkpoints.length) * 100)
      : 0;

  const formatPrice = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;

  return (
    <div className="min-h-screen bg-warm-50 flex flex-col font-sans text-stone-800">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        {/* Back Link */}
        <Link
          href="/customer/events"
          className="inline-flex items-center gap-2 text-xs font-semibold text-stone-500 hover:text-stone-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Events
        </Link>

        {/* Event Header Banner */}
        <Card className="p-6 sm:p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-stone-100">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="champagne" size="sm">
                  {event.eventType}
                </Badge>
                <Badge
                  variant={event.status === "COMPLETED" ? "success" : "neutral"}
                  size="sm"
                  dot
                >
                  {event.status}
                </Badge>
              </div>

              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight">
                {event.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs text-stone-600 mt-3">
                <span className="flex items-center gap-1.5 font-medium">
                  <Calendar className="w-4 h-4 text-rose-700" />
                  {new Date(event.eventDate).toLocaleDateString("en-IN", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}{" "}
                  at {event.eventTime || "18:00"}
                </span>
                <span className="flex items-center gap-1.5 font-medium text-stone-500">
                  <MapPin className="w-4 h-4 text-stone-400" />
                  {event.locationAddress}, {event.city}
                </span>
                <span className="flex items-center gap-1.5 font-medium text-stone-500">
                  <Users className="w-4 h-4 text-stone-400" />
                  ~{event.guestCount} Guests
                </span>
              </div>
            </div>

            <Link href="/explore">
              <Button variant="primary" size="sm" leftIcon={<Sparkles className="w-4 h-4" />}>
                Browse & Book Artisans
              </Button>
            </Link>
          </div>

          {/* Budget Overview Row */}
          <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200/80">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                Total Allocated Budget
              </span>
              <span className="text-xl font-serif font-bold text-stone-900 mt-1 block">
                {formatPrice(event.overallBudget)}
              </span>
            </div>

            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200/80">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                Committed Service Spend
              </span>
              <span className="text-xl font-serif font-bold text-stone-900 mt-1 block">
                {formatPrice(totalCommittedSpend)}
              </span>
              <span className="text-[10px] text-stone-500 mt-0.5 block">
                {Math.round((totalCommittedSpend / (event.overallBudget || 1)) * 100)}% of budget utilized
              </span>
            </div>

            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200/80">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                Actually Paid Out
              </span>
              <span className="text-xl font-serif font-bold text-emerald-700 mt-1 block">
                {formatPrice(totalPaid)}
              </span>
              <span className="text-[10px] text-stone-500 mt-0.5 block">
                Advance + Final balance cleared
              </span>
            </div>
          </div>
        </Card>

        {/* Two Columns: Interactive Checkpoints Checklist + Linked Bookings */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT 2 COLUMNS: Checkpoints Checklist */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="p-6 sm:p-7">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-5">
                <div>
                  <CardTitle>Milestone Checkpoints Checklist</CardTitle>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Click any checkpoint to toggle its completion state.
                  </p>
                </div>
                <Badge variant="rose" size="sm">
                  {completedCheckpoints}/{event.checkpoints.length} Completed
                </Badge>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden mb-6">
                <div
                  className="h-full bg-rose-700 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Checklist items */}
              <div className="space-y-3">
                {event.checkpoints.map((cp: any) => {
                  const isDone = cp.status === "COMPLETED";
                  return (
                    <div
                      key={cp.id}
                      onClick={() => toggleCheckpoint(cp.id, cp.status)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isDone
                          ? "bg-emerald-50/40 border-emerald-200/80 text-emerald-950"
                          : "bg-white border-stone-200 hover:border-stone-300 text-stone-800"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                            isDone ? "bg-emerald-700 text-white" : "border-2 border-stone-300"
                          }`}
                        >
                          {isDone && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <span className={`text-xs font-semibold ${isDone ? "line-through text-stone-500" : "text-stone-900"}`}>
                            {cp.title}
                          </span>
                          {cp.targetDate && (
                            <span className="block text-[10px] text-stone-400 mt-0.5">
                              Target Date: {cp.targetDate}
                            </span>
                          )}
                        </div>
                      </div>

                      <Badge variant={isDone ? "success" : "neutral"} size="sm">
                        {cp.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Linked Bookings under this event */}
            <Card className="p-6 sm:p-7">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-5">
                <div>
                  <CardTitle>Artisan Bookings for this Celebration</CardTitle>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Each vendor contract operates with an independent milestone schedule.
                  </p>
                </div>
                <Link href="/explore">
                  <Button variant="outline" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                    Add Service
                  </Button>
                </Link>
              </div>

              {event.bookings.length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-400">
                  No services booked for this celebration yet. Browse verified artisans to book cinematography, catering, cakes, and decor.
                </div>
              ) : (
                <div className="space-y-4">
                  {event.bookings.map((b: any) => (
                    <div
                      key={b.id}
                      className="p-4 rounded-xl border border-stone-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono font-bold text-stone-400">#{b.bookingCode}</span>
                          <Badge variant={b.status === "CONFIRMED" ? "success" : "neutral"} size="sm">
                            {b.status}
                          </Badge>
                        </div>
                        <h4 className="text-sm font-bold text-stone-900">{b.service.title}</h4>
                        <p className="text-xs text-stone-500 mt-0.5">
                          Artisan: <strong>{b.vendor.businessName}</strong> ({b.service.category.name})
                        </p>
                      </div>

                      <div className="flex items-center gap-4 text-xs">
                        <div className="text-right">
                          <span className="font-bold text-stone-900 block">{formatPrice(b.agreedServiceValue)}</span>
                          <span className="text-[10px] text-stone-500">
                            Paid: {formatPrice(b.advancePaid + b.finalPaid)}
                          </span>
                        </div>
                        <Link href={`/customer/bookings/${b.id}`}>
                          <Button variant="secondary" size="sm">
                            Manage Booking <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* RIGHT COLUMN: Notes & Planning Summary */}
          <div className="space-y-6">
            <Card className="p-6">
              <CardTitle className="mb-3">Event Notes</CardTitle>
              <p className="text-xs text-stone-600 leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-200/80">
                {event.notes || "No extra planning notes recorded for this celebration."}
              </p>
            </Card>

            <Card className="p-6 bg-warm-100/50">
              <h4 className="font-bold text-stone-900 text-xs mb-1">Independent Contracts</h4>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                Celebrating YOU allows you to hire individual photographers, caterers, and decorators independently under one celebration workspace without package lock-in.
              </p>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
