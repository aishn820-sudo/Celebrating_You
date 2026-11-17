"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Star,
  Clock,
  MapPin,
  Check,
  X,
  Sparkles,
  AlertCircle,
  ArrowRight,
  MessageSquare,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";

export default function ServiceBookingClient({ service }: { service: any }) {
  const router = useRouter();
  const [selectedPackage, setSelectedPackage] = useState<any>(
    service.packages?.[0] || null
  );
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [newEventTitle, setNewEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [guestCount, setGuestCount] = useState("50");
  const [specialRequirements, setSpecialRequirements] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Parse inclusions and exclusions safely
  let inclusions: string[] = [];
  let exclusions: string[] = [];
  try {
    inclusions = JSON.parse(service.inclusions || "[]");
  } catch (e) {
    inclusions = service.inclusions ? [service.inclusions] : [];
  }
  try {
    exclusions = JSON.parse(service.exclusions || "[]");
  } catch (e) {
    exclusions = service.exclusions ? [service.exclusions] : [];
  }

  const agreedPrice = selectedPackage ? selectedPackage.price : service.basePrice;
  const advancePercent = selectedPackage ? selectedPackage.advancePercent : 25;
  const advanceRequired = Math.round((agreedPrice * advancePercent) / 100);
  const balanceDue = agreedPrice - advanceRequired;

  const formatPrice = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;

  useEffect(() => {
    // Fetch customer's events
    fetch("/api/customer/events")
      .then((res) => {
        if (res.ok) return res.json();
        return { events: [] };
      })
      .then((data) => {
        if (data.events && data.events.length > 0) {
          setEvents(data.events);
          setSelectedEventId(data.events[0].id);
          setEventDate(data.events[0].eventDate || "");
        }
      })
      .catch(() => {});
  }, []);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let eventIdToUse = selectedEventId;

      // If user wants to create a new event on the fly
      if (!eventIdToUse && newEventTitle && eventDate) {
        const createEventRes = await fetch("/api/customer/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: newEventTitle,
            eventType: "Celebration",
            eventDate,
            locationAddress: service.vendor.city || "Bangalore",
            guestCount: Number(guestCount) || 50,
            overallBudget: agreedPrice,
          }),
        });

        if (!createEventRes.ok) {
          const errData = await createEventRes.json();
          throw new Error(errData.error || "Please sign in as a customer to create an event.");
        }

        const eventData = await createEventRes.json();
        eventIdToUse = eventData.event.id;
      }

      if (!eventIdToUse) {
        throw new Error("Please select or name an event to link this booking");
      }

      const res = await fetch("/api/customer/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: eventIdToUse,
          serviceId: service.id,
          packageId: selectedPackage?.id,
          eventDate,
          guestCount: Number(guestCount),
          specialRequirements,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit booking request");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/customer/bookings/${data.booking.id}`);
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-50 flex flex-col font-sans text-stone-800">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* LEFT COLUMN: Service Details, Images, Packages, Reviews */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header / Meta */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="rose" size="sm">
                  {service.category.name}
                </Badge>
                <Badge variant="success" size="sm" dot>
                  Verified Artisan
                </Badge>
              </div>

              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 tracking-tight">
                {service.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs text-stone-600 mt-3">
                <span className="font-semibold text-stone-900">{service.vendor.businessName}</span>
                <span className="flex items-center gap-1 font-bold text-amber-700">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  {service.vendor.rating.toFixed(1)} ({service.vendor.reviewCount} verified reviews)
                </span>
                <span className="flex items-center gap-1 text-stone-500">
                  <MapPin className="w-3.5 h-3.5 text-stone-400" /> {service.vendor.city}, {service.vendor.state}
                </span>
                <span className="flex items-center gap-1 text-stone-500">
                  <Clock className="w-3.5 h-3.5 text-rose-700" /> ~{service.vendor.responseTimeMinutes || 15}m response time
                </span>
              </div>
            </div>

            {/* Image Gallery */}
            <div className="space-y-3">
              <div className="h-80 sm:h-96 w-full rounded-2xl overflow-hidden bg-stone-200 border border-stone-200 shadow-sm relative">
                {service.images.length > 0 ? (
                  <img
                    src={service.images[selectedImageIndex]?.imageUrl || service.images[0]?.imageUrl}
                    alt={service.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-stone-100 text-stone-400">
                    <Sparkles className="w-8 h-8 mb-2" />
                    <span className="text-sm font-medium">Curated Artisan Portfolio</span>
                  </div>
                )}
              </div>

              {service.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {service.images.map((img: any, idx: number) => (
                    <button
                      key={img.id || idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`h-16 w-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                        selectedImageIndex === idx
                          ? "border-rose-600 ring-2 ring-rose-200"
                          : "border-stone-200 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Description Card */}
            <Card className="p-6 sm:p-8">
              <h3 className="font-serif font-bold text-lg text-stone-900 mb-3">Service Overview</h3>
              <p className="text-stone-600 text-sm leading-relaxed whitespace-pre-line">
                {service.description}
              </p>

              {(service.duration || service.setupTime || service.capacity) && (
                <div className="mt-6 pt-5 border-t border-stone-100 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  {service.duration && (
                    <div>
                      <span className="text-stone-400 block font-semibold uppercase tracking-wider text-[10px]">
                        Service Duration
                      </span>
                      <span className="font-bold text-stone-800 text-sm mt-0.5 block">{service.duration}</span>
                    </div>
                  )}
                  {service.setupTime && (
                    <div>
                      <span className="text-stone-400 block font-semibold uppercase tracking-wider text-[10px]">
                        Setup Time
                      </span>
                      <span className="font-bold text-stone-800 text-sm mt-0.5 block">{service.setupTime}</span>
                    </div>
                  )}
                  {service.capacity && (
                    <div>
                      <span className="text-stone-400 block font-semibold uppercase tracking-wider text-[10px]">
                        Capacity Cap
                      </span>
                      <span className="font-bold text-stone-800 text-sm mt-0.5 block">{service.capacity}</span>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Inclusions & Exclusions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-emerald-50/60 p-6 rounded-2xl border border-emerald-100">
                <h4 className="font-bold text-emerald-950 text-sm flex items-center gap-2 mb-3">
                  <Check className="w-4 h-4 text-emerald-700" /> What&apos;s Included
                </h4>
                <ul className="space-y-2 text-xs text-emerald-900">
                  {inclusions.length > 0 ? (
                    inclusions.map((inc, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-700 font-bold">•</span>
                        <span>{inc}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-stone-400">All standard equipment and artisan attendance.</li>
                  )}
                </ul>
              </div>

              <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200">
                <h4 className="font-bold text-stone-800 text-sm flex items-center gap-2 mb-3">
                  <X className="w-4 h-4 text-stone-400" /> What&apos;s Excluded
                </h4>
                <ul className="space-y-2 text-xs text-stone-600">
                  {exclusions.length > 0 ? (
                    exclusions.map((exc, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-stone-400 font-bold">•</span>
                        <span>{exc}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-stone-400">Extra travel beyond local metropolitan limits.</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Packages Selection */}
            {service.packages.length > 0 && (
              <Card className="p-6 sm:p-8">
                <div className="mb-5">
                  <h3 className="font-serif font-bold text-lg text-stone-900">Available Packages</h3>
                  <p className="text-xs text-stone-500 mt-0.5">Select your preferred tier for this celebration</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {service.packages.map((pkg: any) => {
                    const isSelected = selectedPackage?.id === pkg.id;
                    let features: string[] = [];
                    try {
                      features = JSON.parse(pkg.features || "[]");
                    } catch (e) {
                      features = pkg.features ? [pkg.features] : [];
                    }

                    return (
                      <div
                        key={pkg.id}
                        onClick={() => setSelectedPackage(pkg)}
                        className={`cursor-pointer p-5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                          isSelected
                            ? "border-rose-700 bg-rose-50/40 shadow-sm"
                            : "border-stone-200 hover:border-stone-300 bg-white"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-stone-900 text-sm">{pkg.name}</h4>
                            <span className="text-base font-bold text-stone-900">
                              {formatPrice(pkg.price)}
                            </span>
                          </div>
                          {pkg.description && (
                            <p className="text-xs text-stone-500 mb-3">{pkg.description}</p>
                          )}
                          <ul className="space-y-1.5 text-xs text-stone-600">
                            {features.map((feat, fIdx) => (
                              <li key={fIdx} className="flex items-center gap-1.5">
                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                          <span>Advance Deposit: {pkg.advancePercent}%</span>
                          <span className={`font-semibold ${isSelected ? "text-rose-700" : "text-stone-400"}`}>
                            {isSelected ? "Selected ✓" : "Click to select"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Verified Client Reviews */}
            <Card className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-serif font-bold text-lg text-stone-900">Verified Client Reviews</h3>
                  <p className="text-xs text-stone-500 mt-0.5">Reviews submitted exclusively after completed services</p>
                </div>
                <div className="flex items-center gap-1 px-3 py-1 bg-amber-50 rounded-xl border border-amber-200/80 text-amber-900 text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  {service.vendor.rating.toFixed(1)} / 5.0
                </div>
              </div>

              {service.reviews.length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-400">
                  <MessageSquare className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                  No client reviews yet for this listing. Be the first to share your experience!
                </div>
              ) : (
                <div className="space-y-4 divide-y divide-stone-100">
                  {service.reviews.map((rev: any) => (
                    <div key={rev.id} className="pt-4 first:pt-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-stone-900 text-xs">
                          {rev.customer?.name} • {rev.customer?.city || "Bangalore"}
                        </span>
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < rev.rating
                                  ? "fill-amber-500 text-amber-500"
                                  : "text-stone-200 fill-stone-200"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-stone-600 leading-relaxed">{rev.comment}</p>
                      {rev.vendorReply && (
                        <div className="mt-2.5 ml-3 p-3 bg-stone-50 rounded-xl border-l-2 border-rose-600 text-xs text-stone-600">
                          <span className="font-bold text-stone-800 block text-[11px] mb-0.5">
                            Artisan Response:
                          </span>
                          {rev.vendorReply}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* RIGHT COLUMN: Sticky Pricing Box & Request Booking */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 bg-white p-6 rounded-2xl border border-stone-200 shadow-premium space-y-6">
              <div>
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                  Package Price
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-bold font-serif text-stone-900">
                    {formatPrice(agreedPrice)}
                  </span>
                  <span className="text-xs text-stone-500">All-Inclusive</span>
                </div>
                <p className="text-xs text-stone-500 mt-1 font-medium">
                  {selectedPackage?.name || "Standard Package"}
                </p>
              </div>

              {/* Milestone Breakdown */}
              <div className="space-y-2.5 p-4 bg-warm-50 rounded-xl text-xs border border-stone-200/80">
                <div className="flex justify-between text-stone-600">
                  <span>Agreed Service Package</span>
                  <span className="font-semibold text-stone-900">{formatPrice(agreedPrice)}</span>
                </div>
                <div className="flex justify-between text-stone-700 font-medium">
                  <span>Advance Milestone ({advancePercent}%)</span>
                  <span className="font-bold text-rose-700">{formatPrice(advanceRequired)}</span>
                </div>
                <div className="flex justify-between text-stone-500 text-[11px] border-t border-stone-200 pt-2">
                  <span>Final Balance Due at Event</span>
                  <span>{formatPrice(balanceDue)}</span>
                </div>
              </div>

              {/* Protection Guarantees */}
              <div className="space-y-2.5 text-xs text-stone-600">
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                  <span>Vendor responds within <strong>2 Hours</strong> or request auto-expires.</span>
                </div>
                <div className="flex items-start gap-2">
                  <Lock className="w-4 h-4 text-stone-600 shrink-0 mt-0.5" />
                  <span>Advance payment required <strong>only after</strong> vendor accepts.</span>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                onClick={() => setIsBookingOpen(true)}
                className="w-full shadow-md"
              >
                Request Booking with Artisan <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* BOOKING MODAL */}
        <Modal
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
          title="Request Artisan Booking"
          description={`Submit request to ${service.vendor.businessName} (${selectedPackage?.name || "Standard"})`}
        >
          {success ? (
            <div className="py-8 text-center">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-stone-900 text-base">Booking Request Submitted!</h4>
              <p className="text-xs text-stone-500 mt-1">
                Vendor has been notified. 2-Hour response countdown is active. Redirecting to your booking...
              </p>
            </div>
          ) : (
            <form onSubmit={handleBookingSubmit} className="space-y-4 text-xs">
              {error && (
                <div className="p-3 bg-rose-50 text-rose-700 rounded-xl flex items-center gap-2 border border-rose-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Event Link */}
              {events.length > 0 ? (
                <div>
                  <label className="font-bold text-stone-700 block mb-1 uppercase tracking-wider text-[11px]">
                    Select Your Celebration Event
                  </label>
                  <select
                    value={selectedEventId}
                    onChange={(e) => {
                      setSelectedEventId(e.target.value);
                      const ev = events.find((x) => x.id === e.target.value);
                      if (ev) setEventDate(ev.eventDate);
                    }}
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-stone-900 bg-white"
                  >
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.title} ({ev.eventDate})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="font-bold text-stone-700 block mb-1 uppercase tracking-wider text-[11px]">
                    Create New Event Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Maya's 1st Birthday"
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    required
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-stone-900"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1 uppercase tracking-wider text-[11px]">
                    Event Date
                  </label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    required
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-stone-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1 uppercase tracking-wider text-[11px]">
                    Guest Count
                  </label>
                  <input
                    type="number"
                    value={guestCount}
                    onChange={(e) => setGuestCount(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1 uppercase tracking-wider text-[11px]">
                  Special Instructions & Requirements
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide timing details, themes, specific shots or dietary preferences..."
                  value={specialRequirements}
                  onChange={(e) => setSpecialRequirements(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-stone-900"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl text-amber-900 text-[11px] leading-relaxed border border-amber-200/80">
                <strong>Notice:</strong> Submitting begins a <strong>2-hour response window</strong> for the vendor. If accepted, you will confirm the booking by paying the advance of <strong>{formatPrice(advanceRequired)}</strong>.
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={loading}
                className="w-full"
              >
                Send Request to Artisan
              </Button>
            </form>
          )}
        </Modal>
      </main>
    </div>
  );
}
