"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Plus,
  Sparkles,
  MapPin,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  X,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";

export default function EventsClient({
  initialEvents,
  templates,
  defaultTemplateId,
}: {
  initialEvents: any[];
  templates: any[];
  defaultTemplateId?: string;
}) {
  const router = useRouter();
  const [events, setEvents] = useState(initialEvents);
  const [isModalOpen, setIsModalOpen] = useState(Boolean(defaultTemplateId));
  const [selectedTemplateId, setSelectedTemplateId] = useState(defaultTemplateId || "");
  const [formData, setFormData] = useState({
    title: "",
    eventType: "Birthday",
    eventDate: "",
    eventTime: "18:00",
    locationAddress: "",
    city: "Bangalore",
    state: "Karnataka",
    pincode: "",
    guestCount: 50,
    overallBudget: 50000, // in INR
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTemplateSelect = (tplId: string) => {
    setSelectedTemplateId(tplId);
    const tpl = templates.find((t) => t.id === tplId);
    if (tpl) {
      setFormData((prev) => ({
        ...prev,
        eventType: tpl.category,
        title: `${tpl.name}`,
        guestCount: tpl.defaultGuestCount || 50,
        overallBudget: Math.round(tpl.suggestedBudgetMin / 100),
      }));
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/customer/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          templateId: selectedTemplateId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create event");
      }

      setIsModalOpen(false);
      router.push(`/customer/events/${data.event.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-dark-bg flex flex-col font-sans text-stone-800 dark:text-dark-text-primary">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div>
            <Badge variant="rose" size="sm" className="mb-2">
              Celebrations
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 dark:text-dark-text-primary tracking-tight">
              My Celebrations
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-dark-text-secondary mt-1 max-w-2xl">
              Organize your celebrations, manage vendor contracts, and preserve your special moments.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Link href="/plan">
              <Button variant="primary" size="md">
                Plan Celebration
              </Button>
            </Link>
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsModalOpen(true)}
            >
              Create Celebration
            </Button>
          </div>
        </div>

        {/* Events Grid */}
        {events.length === 0 ? (
          <EmptyState
            icon={<Calendar className="w-6 h-6" />}
            title="No events created yet"
            description="Start planning your wedding, birthday, or milestone celebration with custom checkpoints and budgets."
            action={
              <Button
                variant="primary"
                size="md"
                onClick={() => setIsModalOpen(true)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Plan An Event
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => {
              const completedCheckpoints = event.checkpoints.filter((c: any) => c.status === "COMPLETED").length;
              const totalCheckpoints = event.checkpoints.length;
              const progress =
                totalCheckpoints > 0 ? Math.round((completedCheckpoints / totalCheckpoints) * 100) : 0;

              return (
                <Card key={event.id} hoverEffect className="p-6 sm:p-7 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
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

                    <h3 className="text-xl font-serif font-bold text-stone-900 dark:text-dark-text-primary leading-snug">
                      {event.title}
                    </h3>

                    <div className="space-y-2 mt-4 text-xs text-stone-600 dark:text-dark-text-secondary">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-stone-400 dark:text-stone-500 shrink-0" />
                        <span>
                          {new Date(event.eventDate).toLocaleDateString("en-IN", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-stone-400 dark:text-stone-500 shrink-0" />
                        <span>
                          {event.locationAddress}, {event.city}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-stone-400 dark:text-stone-500 shrink-0" />
                        <span>~{event.guestCount} Guests</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-5 pt-4 border-t border-stone-100 dark:border-dark-border">
                      <div className="flex items-center justify-between text-xs text-stone-500 dark:text-dark-text-secondary mb-1.5">
                        <span className="font-semibold text-stone-700 dark:text-stone-300">Milestone Checkpoints</span>
                        <span>
                          {completedCheckpoints}/{totalCheckpoints} ({progress}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-stone-200 dark:bg-dark-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-rose-700 dark:bg-rose-500 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Bookings Count */}
                    <div className="mt-4 flex items-center justify-between text-xs text-stone-500 dark:text-dark-text-secondary">
                      <span>Vendor Bookings</span>
                      <span className="font-bold text-stone-800 dark:text-dark-text-primary">{event.bookings?.length || 0} Linked</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-stone-100 dark:border-dark-border">
                    <Link href={`/customer/events/${event.id}`}>
                      <Button variant="secondary" size="sm" className="w-full">
                        Open Celebration
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Guided Create Event Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Plan A New Celebration Event"
          description="Establish your event blueprint, milestone targets, and allocated budget"
          maxWidth="xl"
        >
          <form onSubmit={handleCreateEvent} className="space-y-4 text-xs">
            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 rounded-xl flex items-center gap-2 border border-rose-200 dark:border-rose-900/40">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Template Selector */}
            <div>
              <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1 uppercase tracking-wider text-[11px]">
                Start with a Celebration Blueprint (Optional)
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => handleTemplateSelect(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-dark-border text-stone-900 dark:text-dark-text-primary bg-white dark:bg-dark-elevated"
              >
                <option value="">Custom Planning (From Scratch)</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1 uppercase tracking-wider text-[11px]">
                Event Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Maya's 1st Birthday Gala, Roy & Priya's Sangeet"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-dark-border text-stone-900 dark:text-dark-text-primary bg-white dark:bg-dark-elevated"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1 uppercase tracking-wider text-[11px]">
                  Occasion Type
                </label>
                <select
                  value={formData.eventType}
                  onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-dark-border text-stone-900 dark:text-dark-text-primary bg-white dark:bg-dark-elevated"
                >
                  <option value="Birthday">Birthday</option>
                  <option value="Wedding">Wedding</option>
                  <option value="Anniversary">Anniversary</option>
                  <option value="Baby Shower">Baby Shower</option>
                  <option value="Housewarming">Housewarming</option>
                  <option value="Corporate">Corporate Gala</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1 uppercase tracking-wider text-[11px]">
                  Event Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.eventDate}
                  onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-dark-border text-stone-900 dark:text-dark-text-primary bg-white dark:bg-dark-elevated"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1 uppercase tracking-wider text-[11px]">
                  Location / Venue Address
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. The Leela Palace, Old Airport Rd"
                  value={formData.locationAddress}
                  onChange={(e) => setFormData({ ...formData, locationAddress: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-dark-border text-stone-900 dark:text-dark-text-primary bg-white dark:bg-dark-elevated"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1 uppercase tracking-wider text-[11px]">
                  City
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bangalore"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-dark-border text-stone-900 dark:text-dark-text-primary bg-white dark:bg-dark-elevated"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1 uppercase tracking-wider text-[11px]">
                  Guest Count
                </label>
                <input
                  type="number"
                  value={formData.guestCount}
                  onChange={(e) => setFormData({ ...formData, guestCount: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-dark-border text-stone-900 dark:text-dark-text-primary bg-white dark:bg-dark-elevated"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1 uppercase tracking-wider text-[11px]">
                  Overall Planned Budget (₹ INR)
                </label>
                <input
                  type="number"
                  value={formData.overallBudget}
                  onChange={(e) => setFormData({ ...formData, overallBudget: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-dark-border text-stone-900 dark:text-dark-text-primary bg-white dark:bg-dark-elevated"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={loading}
              className="w-full mt-2"
            >
              Initialize Celebration Workspace
            </Button>
          </form>
        </Modal>
      </main>
    </div>
  );
}
