"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Lock,
  Unlock,
  Plus,
  Clock,
  MapPin,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

export default function VendorCalendarClient({
  vendor,
  bookings,
  blockedDates,
}: {
  vendor: any;
  bookings: any[];
  blockedDates: any[];
}) {
  const router = useRouter();
  const [dateToBlock, setDateToBlock] = useState("");
  const [blockReason, setBlockReason] = useState("Personal Holiday / Fully Booked");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleBlockDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateToBlock) return;
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/vendor/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: dateToBlock,
          reason: blockReason,
          action: "BLOCK",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to block date");
      }

      setSuccess(`Date ${dateToBlock} has been blocked to prevent double bookings.`);
      setDateToBlock("");
      router.refresh();
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (date: string) => {
    try {
      await fetch("/api/vendor/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, action: "UNBLOCK" }),
      });
      router.refresh();
      window.location.reload();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <main className="flex-1 p-6 sm:p-10 max-w-7xl overflow-y-auto">
      <div className="mb-8">
        <Badge variant="rose" size="sm" className="mb-2">
          Availability & Blackout Dates
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-dark-text-primary tracking-tight">
          Calendar & Schedule Manager
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 dark:text-dark-text-secondary mt-1">
          Review upcoming event dates, setup arrival windows, and block off personal blackout days to prevent double-booking.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT 2 COLUMNS: Confirmed Event Schedule */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 sm:p-7">
            <CardTitle className="mb-4">Upcoming Schedule</CardTitle>

            {bookings.length === 0 ? (
              <EmptyState
                icon={<CalendarDays className="w-6 h-6" />}
                title="No engagements scheduled"
                description="When clients book your services and advance milestones are verified, their dates will be mapped here."
              />
            ) : (
              <div className="space-y-4">
                {bookings.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 rounded-xl border border-stone-200 dark:border-dark-border bg-white dark:bg-dark-surface flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-bold text-stone-400 dark:text-stone-500">#{b.bookingCode}</span>
                        <Badge
                          variant={b.status === "CONFIRMED" ? "success" : "warning"}
                          size="sm"
                        >
                          {b.status}
                        </Badge>
                      </div>

                      <h4 className="text-sm font-bold text-stone-900 dark:text-dark-text-primary">{b.service.title}</h4>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 dark:text-dark-text-secondary mt-2">
                        <span className="flex items-center gap-1 font-semibold text-stone-800 dark:text-stone-200">
                          <Calendar className="w-3.5 h-3.5 text-rose-700 dark:text-rose-400" />
                          {new Date(b.eventDate).toLocaleDateString("en-IN", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500" />
                          {b.event?.city || vendor.city}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500" />
                          Arrival setup: {b.service?.setupTime || "1-2 hours prior"}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-stone-400 dark:text-stone-500 block">Client</span>
                      <span className="font-bold text-stone-900 dark:text-dark-text-primary text-xs block">{b.customer?.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* RIGHT COLUMN: Blackout Dates Manager */}
        <div className="space-y-6">
          <Card className="p-6">
            <CardTitle className="mb-2">Block Off Dates</CardTitle>
            <p className="text-xs text-stone-500 dark:text-dark-text-secondary mb-4 leading-relaxed">
              Dates marked as blocked prevent customer bookings on that day instantly.
            </p>

            {success && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 text-xs rounded-xl mb-3 border border-emerald-200 dark:border-emerald-900/40">
                {success}
              </div>
            )}
            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 text-xs rounded-xl mb-3 border border-rose-200 dark:border-rose-900/40">
                {error}
              </div>
            )}

            <form onSubmit={handleBlockDate} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1 uppercase tracking-wider text-[10px]">
                  Select Date to Block
                </label>
                <input
                  type="date"
                  required
                  value={dateToBlock}
                  onChange={(e) => setDateToBlock(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-dark-border text-stone-900 dark:text-dark-text-primary bg-white dark:bg-dark-elevated"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1 uppercase tracking-wider text-[10px]">
                  Reason / Label
                </label>
                <input
                  type="text"
                  required
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-dark-border text-stone-900 dark:text-dark-text-primary bg-white dark:bg-dark-elevated"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={loading}
                className="w-full mt-2"
              >
                Mark Date Unavailable
              </Button>
            </form>

            {/* List of currently blocked dates */}
            <div className="mt-6 pt-5 border-t border-stone-100 dark:border-dark-border">
              <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider block mb-3">
                Active Blackout Dates ({blockedDates.length})
              </span>

              {blockedDates.length === 0 ? (
                <p className="text-xs text-stone-400 dark:text-stone-500 italic">No blackout dates currently registered.</p>
              ) : (
                <div className="space-y-2">
                  {blockedDates.map((d) => (
                    <div
                      key={d.id}
                      className="p-2.5 rounded-xl border border-stone-200 dark:border-dark-border bg-stone-50 dark:bg-dark-elevated flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-stone-900 dark:text-dark-text-primary block">{d.date}</span>
                        <span className="text-[10px] text-stone-500 dark:text-dark-text-secondary">{d.reason || "Blocked slot"}</span>
                      </div>

                      <button
                        onClick={() => handleUnblock(d.date)}
                        className="p-1.5 text-stone-400 dark:text-stone-500 hover:text-rose-700 dark:hover:text-rose-400 rounded-lg transition-colors"
                        title="Remove Block"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
