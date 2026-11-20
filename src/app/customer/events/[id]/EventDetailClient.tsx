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
  FileText,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Edit3,
  Trash2,
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
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: initialEvent.title || "",
    guestCount: initialEvent.guestCount || 50,
    overallBudget: Math.round((initialEvent.overallBudget || 5000000) / 100),
    notes: initialEvent.notes || "",
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState("");

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingEdit(true);
    setActionError("");

    try {
      const res = await fetch(`/api/customer/events/${event.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editFormData.title,
          guestCount: Number(editFormData.guestCount),
          overallBudget: Number(editFormData.overallBudget) * 100,
          notes: editFormData.notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update event");
      }

      setEvent((prev: any) => ({
        ...prev,
        title: editFormData.title,
        guestCount: Number(editFormData.guestCount),
        overallBudget: Number(editFormData.overallBudget) * 100,
        notes: editFormData.notes,
      }));
      setIsEditModalOpen(false);
      router.refresh();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteEvent = async () => {
    setIsDeleting(true);
    setActionError("");

    try {
      const res = await fetch(`/api/customer/events/${event.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete event");
      }

      router.push("/customer/events");
      router.refresh();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

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

  const handleAddCheckpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCheckpointTitle.trim()) return;

    setAddingCheckpoint(true);
    try {
      const res = await fetch(`/api/customer/events/${event.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newCheckpoint: {
            title: newCheckpointTitle.trim(),
            description: "Custom checkpoint",
          },
        }),
      });

      if (res.ok) {
        setNewCheckpointTitle("");
        router.refresh();
        // Update local state
        setEvent((prev: any) => ({
          ...prev,
          checkpoints: [
            ...prev.checkpoints,
            {
              id: `temp-${Date.now()}`,
              title: newCheckpointTitle.trim(),
              status: "PENDING",
            },
          ],
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAddingCheckpoint(false);
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

  const daysLeft = Math.ceil(
    (new Date(event.eventDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const formatPrice = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-dark-bg flex flex-col font-sans text-stone-800 dark:text-dark-text-primary">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        {/* Back Link */}
        <Link
          href="/customer/events"
          className="inline-flex items-center gap-2 text-xs font-semibold text-stone-500 dark:text-dark-text-secondary hover:text-stone-900 dark:hover:text-dark-text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Celebrations
        </Link>

        {/* Event Header Banner */}
        <Card className="p-6 sm:p-8 mb-8 shadow-soft">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-stone-100 dark:border-dark-border">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="champagne" size="sm">
                  {event.eventType}
                </Badge>
                {daysLeft >= 0 && (
                  <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/50 px-2.5 py-0.5 rounded-full">
                    {daysLeft === 0 ? "Celebrating Today!" : `${daysLeft} days to celebration`}
                  </span>
                )}
                <Badge
                  variant={event.status === "COMPLETED" ? "success" : "neutral"}
                  size="sm"
                  dot
                >
                  {event.status}
                </Badge>
              </div>

              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-dark-text-primary tracking-tight">
                {event.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs text-stone-600 dark:text-dark-text-secondary mt-3">
                <span className="flex items-center gap-1.5 font-medium">
                  <Calendar className="w-4 h-4 text-rose-700 dark:text-rose-400" />
                  {new Date(event.eventDate).toLocaleDateString("en-IN", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}{" "}
                  at {event.eventTime || "18:00"}
                </span>
                <span className="flex items-center gap-1.5 font-medium text-stone-500 dark:text-dark-text-secondary">
                  <MapPin className="w-4 h-4 text-stone-400 dark:text-stone-500" />
                  {event.locationAddress}, {event.city}
                </span>
                <span className="flex items-center gap-1.5 font-medium text-stone-500 dark:text-dark-text-secondary">
                  <Users className="w-4 h-4 text-stone-400 dark:text-stone-500" />
                  ~{event.guestCount} Guests
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActionError("");
                  setIsEditModalOpen(true);
                }}
                leftIcon={<Edit3 className="w-4 h-4" />}
              >
                Edit Details
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                onClick={() => {
                  setActionError("");
                  setIsDeleteModalOpen(true);
                }}
                leftIcon={<Trash2 className="w-4 h-4" />}
              >
                Delete Event
              </Button>
              <Link href={`/explore?city=${encodeURIComponent(event.city)}`}>
                <Button variant="primary" size="sm" leftIcon={<Sparkles className="w-4 h-4" />}>
                  Add Another Vendor
                </Button>
              </Link>
            </div>
          </div>

          {/* Budget Overview Row */}
          <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-stone-50 dark:bg-dark-elevated rounded-xl border border-stone-200/80 dark:border-dark-border">
              <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider block">
                Total Allocated Budget
              </span>
              <span className="text-xl font-serif font-bold text-stone-900 dark:text-dark-text-primary mt-1 block font-mono">
                {formatPrice(event.overallBudget)}
              </span>
            </div>

            <div className="p-4 bg-stone-50 dark:bg-dark-elevated rounded-xl border border-stone-200/80 dark:border-dark-border">
              <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider block">
                Committed Service Spend
              </span>
              <span className="text-xl font-serif font-bold text-stone-900 dark:text-dark-text-primary mt-1 block font-mono">
                {formatPrice(totalCommittedSpend)}
              </span>
              <span className="text-[10px] text-stone-500 dark:text-dark-text-secondary mt-0.5 block">
                {Math.round((totalCommittedSpend / (event.overallBudget || 1)) * 100)}% of budget utilized
              </span>
            </div>

            <div className="p-4 bg-stone-50 dark:bg-dark-elevated rounded-xl border border-stone-200/80 dark:border-dark-border">
              <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider block">
                Actually Paid Out
              </span>
              <span className="text-xl font-serif font-bold text-emerald-700 dark:text-emerald-400 mt-1 block font-mono">
                {formatPrice(totalPaid)}
              </span>
              <span className="text-[10px] text-stone-500 dark:text-dark-text-secondary mt-0.5 block">
                Advance + Final milestones cleared
              </span>
            </div>
          </div>
        </Card>

        {/* Two Columns: Interactive Checkpoints Checklist + Linked Bookings */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT 2 COLUMNS: Checkpoints Checklist & Linked Bookings */}
          <div className="lg:col-span-2 space-y-8">
            {/* Interactive Planning Checkpoints */}
            <Card className="p-6 sm:p-7 shadow-soft">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-dark-border mb-5">
                <div>
                  <CardTitle>Milestone Planning Checkpoints</CardTitle>
                  <p className="text-xs text-stone-500 dark:text-dark-text-secondary mt-0.5">
                    Click any checkpoint to mark complete. Stay organized across all preparations.
                  </p>
                </div>
                <Badge variant="rose" size="sm">
                  {completedCheckpoints}/{event.checkpoints.length} Done
                </Badge>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-stone-100 dark:bg-dark-border rounded-full overflow-hidden mb-6">
                <div
                  className="h-full bg-rose-700 dark:bg-rose-500 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Checklist items */}
              <div className="space-y-3 mb-6">
                {event.checkpoints.map((cp: any) => {
                  const isDone = cp.status === "COMPLETED";
                  return (
                    <div
                      key={cp.id}
                      onClick={() => toggleCheckpoint(cp.id, cp.status)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isDone
                          ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/40 text-emerald-950 dark:text-emerald-200"
                          : "bg-white dark:bg-dark-surface border-stone-200 dark:border-dark-border hover:border-stone-300 dark:hover:border-stone-600 text-stone-800 dark:text-stone-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                            isDone ? "bg-emerald-700 dark:bg-emerald-600 text-white" : "border-2 border-stone-300 dark:border-stone-600"
                          }`}
                        >
                          {isDone && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <span className={`text-xs font-semibold ${isDone ? "line-through text-stone-500 dark:text-stone-400" : "text-stone-900 dark:text-dark-text-primary"}`}>
                            {cp.title}
                          </span>
                          {cp.targetDate && (
                            <span className="block text-[10px] text-stone-400 dark:text-stone-500 mt-0.5">
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

              {/* Add Custom Checkpoint Input */}
              <form onSubmit={handleAddCheckpoint} className="flex gap-2 pt-4 border-t border-stone-100 dark:border-dark-border">
                <input
                  type="text"
                  value={newCheckpointTitle}
                  onChange={(e) => setNewCheckpointTitle(e.target.value)}
                  placeholder="Add custom checkpoint (e.g. Confirm floral color palette, send family invites...)"
                  className="flex-1 text-xs px-3.5 py-2 rounded-xl border border-stone-200 dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-warm-50/50 dark:bg-dark-elevated text-stone-900 dark:text-dark-text-primary"
                />
                <Button variant="secondary" size="sm" isLoading={addingCheckpoint} type="submit">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add
                </Button>
              </form>
            </Card>

            {/* Linked Bookings under this celebration */}
            <Card className="p-6 sm:p-7 shadow-soft">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-dark-border mb-5">
                <div>
                  <CardTitle>My Services & Vendor Contracts</CardTitle>
                  <p className="text-xs text-stone-500 dark:text-dark-text-secondary mt-0.5">
                    Each vendor contract operates with an independent milestone schedule. Cancelling one does not affect others.
                  </p>
                </div>
                <Link href={`/explore?city=${encodeURIComponent(event.city)}`}>
                  <Button variant="outline" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                    Add Service
                  </Button>
                </Link>
              </div>

              {event.bookings.length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-400 dark:text-stone-500">
                  No services booked for this celebration yet. Browse verified vendors to book photography, catering, cakes, and décor.
                </div>
              ) : (
                <div className="space-y-4">
                  {event.bookings.map((b: any) => {
                    const isExpanded = expandedBookingId === b.id;
                    const hasAdvancePaid = b.advancePaid > 0;
                    const hasFinalPaid = b.finalPaid > 0;

                    return (
                      <div
                        key={b.id}
                        className="rounded-2xl border border-stone-200 dark:border-dark-border bg-white dark:bg-dark-surface overflow-hidden transition-all shadow-xs"
                      >
                        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-xs font-mono font-bold text-stone-400 dark:text-stone-500">#{b.bookingCode}</span>
                              <Badge
                                variant={
                                  b.status === "CONFIRMED" || b.status === "COMPLETED"
                                    ? "success"
                                    : b.status === "ACCEPTED_AWAITING_ADVANCE"
                                    ? "warning"
                                    : b.status === "DECLINED" || b.status === "EXPIRED"
                                    ? "danger"
                                    : "neutral"
                                }
                                size="sm"
                              >
                                {b.status.replace(/_/g, " ")}
                              </Badge>
                            </div>
                            <h4 className="text-sm font-bold text-stone-900 dark:text-dark-text-primary">{b.service.title}</h4>
                            <p className="text-xs text-stone-500 dark:text-dark-text-secondary mt-0.5">
                              Vendor: <strong>{b.vendor.businessName}</strong> • {b.service.category.name}
                            </p>
                          </div>

                          <div className="flex items-center gap-4 text-xs">
                            <div className="text-right">
                              <span className="font-bold text-stone-900 dark:text-dark-text-primary block font-mono">
                                {formatPrice(b.agreedServiceValue)}
                              </span>
                              <span className="text-[10px] text-stone-500 dark:text-dark-text-secondary">
                                Paid: {formatPrice(b.advancePaid + b.finalPaid)}
                              </span>
                            </div>

                            <button
                              onClick={() => setExpandedBookingId(isExpanded ? null : b.id)}
                              className="p-2 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-dark-text-primary rounded-lg hover:bg-stone-50 dark:hover:bg-dark-elevated border border-stone-200 dark:border-dark-border"
                              title="Toggle Booking Timeline & Details"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>

                            <Link href={`/customer/bookings/${b.id}`}>
                              <Button variant="secondary" size="sm">
                                Manage <ArrowRight className="w-3.5 h-3.5 ml-1" />
                              </Button>
                            </Link>
                          </div>
                        </div>

                        {/* Expandable Booking Timeline & Payment Breakdown */}
                        {isExpanded && (
                          <div className="px-5 pb-5 pt-3 bg-warm-50/60 dark:bg-dark-elevated/60 border-t border-stone-100 dark:border-dark-border text-xs">
                            <h5 className="font-bold text-stone-800 dark:text-dark-text-primary text-[11px] uppercase tracking-wider mb-3">
                              Booking Lifecycle Timeline
                            </h5>

                            {/* Timeline Stepper */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                              <div className="p-2.5 rounded-xl bg-white dark:bg-dark-surface border border-stone-200 dark:border-dark-border">
                                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 block">✓ 1. Requested</span>
                                <span className="text-[10px] text-stone-500 dark:text-dark-text-secondary">Date & slot submitted</span>
                              </div>
                              <div className="p-2.5 rounded-xl bg-white dark:bg-dark-surface border border-stone-200 dark:border-dark-border">
                                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 block">
                                  {b.status === "REQUEST_SUBMITTED" ? "⏳ 2. Response Pending" : "✓ 2. Accepted"}
                                </span>
                                <span className="text-[10px] text-stone-500 dark:text-dark-text-secondary">2-hr response window</span>
                              </div>
                              <div className="p-2.5 rounded-xl bg-white dark:bg-dark-surface border border-stone-200 dark:border-dark-border">
                                <span className={`text-[10px] font-bold block ${hasAdvancePaid ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"}`}>
                                  {hasAdvancePaid ? "✓ 3. Advance Cleared" : "⏳ 3. Advance Pending"}
                                </span>
                                <span className="text-[10px] text-stone-500 dark:text-dark-text-secondary">Document 1 Generated</span>
                              </div>
                              <div className="p-2.5 rounded-xl bg-white dark:bg-dark-surface border border-stone-200 dark:border-dark-border">
                                <span className={`text-[10px] font-bold block ${hasFinalPaid ? "text-emerald-700 dark:text-emerald-400" : "text-stone-400 dark:text-stone-500"}`}>
                                  {hasFinalPaid ? "✓ 4. Final Cleared" : "⏳ 4. Final Balance"}
                                </span>
                                <span className="text-[10px] text-stone-500 dark:text-dark-text-secondary">Document 2 Generated</span>
                              </div>
                            </div>

                            {/* Invoices */}
                            {b.invoices && b.invoices.length > 0 && (
                              <div className="pt-2 flex flex-wrap gap-2 items-center">
                                <span className="text-[11px] font-semibold text-stone-600 dark:text-dark-text-secondary">Official Documents:</span>
                                {b.invoices.map((inv: any) => (
                                  <Link
                                    key={inv.id}
                                    href={`/customer/invoices`}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-dark-surface border border-stone-200 dark:border-dark-border text-stone-700 dark:text-stone-300 font-medium text-[11px] hover:border-rose-300"
                                  >
                                    <FileText className="w-3.5 h-3.5 text-rose-700 dark:text-rose-400" />
                                    {inv.type === "ADVANCE" ? "Doc 1: Advance Voucher" : "Doc 2: Final Invoice"} ({inv.invoiceNumber})
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* RIGHT COLUMN: Notes & Celebration Guidance */}
          <div className="space-y-6">
            <Card className="p-6 shadow-soft">
              <CardTitle className="mb-3">Celebration Notes & Vision</CardTitle>
              <p className="text-xs text-stone-600 dark:text-dark-text-secondary leading-relaxed bg-warm-50 dark:bg-dark-elevated p-3.5 rounded-xl border border-stone-200/80 dark:border-dark-border">
                {event.notes || "No extra planning notes recorded for this celebration. Edit to capture theme preferences, dietary restrictions, or musical styles."}
              </p>
            </Card>

            <Card className="p-6 bg-warm-100/60 dark:bg-dark-elevated border-stone-200/80 dark:border-dark-border shadow-soft">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-rose-700 dark:text-rose-400" />
                <h4 className="font-bold text-stone-900 dark:text-dark-text-primary text-xs">Every Celebration. One Place.</h4>
              </div>
              <p className="text-[11px] text-stone-600 dark:text-dark-text-secondary leading-relaxed">
                Celebrating YOU allows you to coordinate photographers, caterers, bakers, decorators, and entertainers under one centralized event dashboard with zero package lock-in.
              </p>
            </Card>
          </div>
        </div>

        {/* EDIT EVENT MODAL */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Celebration Details"
          description="Update guest count, budget targets, or planning vision."
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
            {actionError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 rounded-xl text-xs">
                {actionError}
              </div>
            )}

            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">Celebration Title</label>
              <input
                type="text"
                required
                value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-dark-border text-stone-900 dark:text-dark-text-primary bg-white dark:bg-dark-elevated focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">Expected Guests</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={editFormData.guestCount}
                  onChange={(e) => setEditFormData({ ...editFormData, guestCount: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-dark-border text-stone-900 dark:text-dark-text-primary bg-white dark:bg-dark-elevated focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">Target Budget (₹)</label>
                <input
                  type="number"
                  min="5000"
                  step="1000"
                  required
                  value={editFormData.overallBudget}
                  onChange={(e) => setEditFormData({ ...editFormData, overallBudget: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-dark-border text-stone-900 dark:text-dark-text-primary bg-white dark:bg-dark-elevated focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">Notes & Theme Preferences</label>
              <textarea
                rows={3}
                value={editFormData.notes}
                onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                placeholder="Theme inspirations, dietary restrictions, musical genres..."
                className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-dark-border text-stone-900 dark:text-dark-text-primary bg-white dark:bg-dark-elevated focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex gap-3 pt-3">
              <Button
                type="button"
                variant="outline"
                size="md"
                className="w-1/2"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-1/2"
                isLoading={isSavingEdit}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>

        {/* DELETE CONFIRMATION MODAL */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Delete Celebration Event"
          description="Are you sure you want to remove this celebration? This action cannot be undone."
        >
          <div className="space-y-4 text-xs">
            {actionError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 rounded-xl text-xs">
                {actionError}
              </div>
            )}

            <p className="text-stone-600 dark:text-dark-text-secondary leading-relaxed">
              Deleting <strong>{event.title}</strong> will remove all custom checkpoints and unlink celebration preferences.
              Events with active or confirmed bookings cannot be deleted until bookings are concluded or cancelled.
            </p>

            <div className="flex gap-3 pt-3">
              <Button
                type="button"
                variant="outline"
                size="md"
                className="w-1/2"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="md"
                className="w-1/2"
                isLoading={isDeleting}
                onClick={handleDeleteEvent}
              >
                Delete Celebration
              </Button>
            </div>
          </div>
        </Modal>
      </main>
    </div>
  );
}
