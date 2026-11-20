"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  Calendar,
  MapPin,
  Users,
  IndianRupee,
  Check,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Plus,
  Trash2,
  ShieldCheck,
  Star,
  Info,
  Clock,
  CheckCircle2,
  FileCheck2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";

interface PlanCelebrationProps {
  initialCategories: any[];
  initialServices: any[];
  templates: any[];
  defaultOccasion?: string;
  defaultTemplateId?: string;
  defaultBudgetTier?: string;
}

const OCCASIONS = [
  {
    name: "Birthday",
    tagline: "Milestone birthdays, kids themes & intimate dinners",
    icon: "🎂",
    defaultCategories: ["decoration-services", "bakeries-cloud-kitchens", "photography-editing"],
  },
  {
    name: "Wedding",
    tagline: "Bridal makeovers, grand mandap decor, royal banquets & cinema",
    icon: "💍",
    defaultCategories: ["photography-editing", "decoration-services", "catering-services", "makeup-beauty", "venues"],
  },
  {
    name: "Engagement",
    tagline: "Ring ceremonies, floral setups, cocktail catering & memories",
    icon: "✨",
    defaultCategories: ["decoration-services", "photography-editing", "catering-services"],
  },
  {
    name: "Anniversary",
    tagline: "Romantic dinners, acoustic live music, memory portraits & florals",
    icon: "🥂",
    defaultCategories: ["decoration-services", "photography-editing", "catering-services", "bakeries-cloud-kitchens"],
  },
  {
    name: "Baby Shower",
    tagline: "Pastel balloon installations, custom cakes & gentle setups",
    icon: "🍼",
    defaultCategories: ["decoration-services", "bakeries-cloud-kitchens", "photography-editing"],
  },
  {
    name: "Housewarming",
    tagline: "Auspicious pooja florals, traditional dining & festive lights",
    icon: "🏡",
    defaultCategories: ["decoration-services", "catering-services"],
  },
  {
    name: "Graduation",
    tagline: "Achievement photos, party catering, DJ music & celebration cake",
    icon: "🎓",
    defaultCategories: ["photography-editing", "bakeries-cloud-kitchens", "music-entertainment"],
  },
  {
    name: "Corporate Event",
    tagline: "Townhall setups, corporate gala catering, team photography",
    icon: "💼",
    defaultCategories: ["catering-services", "photography-editing", "venues"],
  },
  {
    name: "Festival Celebration",
    tagline: "Traditional festive decor, sweets & snacks, folk artists",
    icon: "🪔",
    defaultCategories: ["decoration-services", "catering-services"],
  },
  {
    name: "Other Special Occasion",
    tagline: "Retirement, reunions, farewells or bespoke family gatherings",
    icon: "🎉",
    defaultCategories: ["decoration-services", "photography-editing"],
  },
];

const SERVICE_CATEGORIES = [
  { slug: "photography-editing", name: "Photography & Videography", icon: "📷", desc: "Candid, traditional & cinematic reels" },
  { slug: "decoration-services", name: "Decoration", icon: "🎨", desc: "Floral, theme balloons, backdrops & stage" },
  { slug: "catering-services", name: "Catering & Dining", icon: "🍽️", desc: "Live counters, multi-cuisine buffets & spreads" },
  { slug: "bakeries-cloud-kitchens", name: "Cakes & Desserts", icon: "🍰", desc: "Custom celebration cakes & dessert tables" },
  { slug: "venues", name: "Venues & Spaces", icon: "🏛️", desc: "Banquet halls, lawns & boutique private terraces" },
  { slug: "makeup-beauty", name: "Makeup & Beauty", icon: "💄", desc: "Bridal makeovers & event grooming artists" },
  { slug: "music-entertainment", name: "Music & Entertainment", icon: "🎵", desc: "Live acoustic singers, DJs, magicians & emcees" },
  { slug: "invitations", name: "Invitations & Stationery", icon: "💌", desc: "Digital animated video invites & luxury cards" },
  { slug: "celebration-items", name: "Celebration Essentials", icon: "🎁", desc: "Return gifts, party props, varmalas & favors" },
];

export default function PlanCelebrationClient({
  initialCategories,
  initialServices,
  templates,
  defaultOccasion,
  defaultTemplateId,
  defaultBudgetTier,
}: PlanCelebrationProps) {
  const router = useRouter();

  // Find initial template if provided
  const preselectedTemplate = templates.find((t) => t.id === defaultTemplateId);

  // Initial budget based on tier or template
  let initialBudget = 50000;
  if (preselectedTemplate) {
    initialBudget = Math.round(preselectedTemplate.suggestedBudgetMin / 100);
  } else if (defaultBudgetTier === "intimate") {
    initialBudget = 25000;
  } else if (defaultBudgetTier === "moderate") {
    initialBudget = 45000;
  } else if (defaultBudgetTier === "premium") {
    initialBudget = 80000;
  } else if (defaultBudgetTier === "luxury") {
    initialBudget = 150000;
  }

  // Multi-step State
  const [step, setStep] = useState(1);
  const [occasion, setOccasion] = useState(
    defaultOccasion || (preselectedTemplate ? preselectedTemplate.category : "Birthday")
  );

  // Step 2: Event Details
  const [title, setTitle] = useState(
    preselectedTemplate ? preselectedTemplate.name : `${occasion} Celebration`
  );
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("18:00");
  const [city, setCity] = useState("Bangalore");
  const [address, setAddress] = useState("");
  const [guestCount, setGuestCount] = useState(
    preselectedTemplate ? preselectedTemplate.defaultGuestCount : 50
  );
  const [budget, setBudget] = useState(initialBudget);
  const [notes, setNotes] = useState("");

  // Step 3: Categories selected
  const initialCategorySlugs = useMemo(() => {
    const occ = OCCASIONS.find((o) => o.name === occasion);
    return occ ? occ.defaultCategories : ["decoration-services", "photography-editing"];
  }, [occasion]);

  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategorySlugs);

  // Step 4 & 5: Selected Services / Vendors
  const [shortlistedServices, setShortlistedServices] = useState<any[]>([]);

  // Submitting state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const formatPrice = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;
  const formatRupees = (inr: number) => `₹${inr.toLocaleString("en-IN")}`;

  const toggleCategory = (slug: string) => {
    if (selectedCategories.includes(slug)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== slug));
    } else {
      setSelectedCategories([...selectedCategories, slug]);
    }
  };

  const handleOccasionSelect = (occName: string) => {
    setOccasion(occName);
    setTitle(`${occName} Celebration`);
    const occObj = OCCASIONS.find((o) => o.name === occName);
    if (occObj) {
      setSelectedCategories(occObj.defaultCategories);
    }
  };

  // Filter recommendations based on transparent rules
  const recommendedServices = useMemo(() => {
    return initialServices.filter((service) => {
      // 1. Matches selected categories
      const matchCat =
        selectedCategories.includes(service.category?.slug) ||
        selectedCategories.some((slug) => service.category?.name.toLowerCase().includes(slug.split("-")[0]));

      // 2. City match or flexible
      const matchCity = !city || !service.vendor?.city || service.vendor.city.toLowerCase().includes(city.toLowerCase());

      return matchCat && matchCity;
    });
  }, [initialServices, selectedCategories, city]);

  const addServiceToCelebration = (service: any) => {
    if (!shortlistedServices.some((s) => s.id === service.id)) {
      setShortlistedServices([...shortlistedServices, service]);
    }
  };

  const removeServiceFromCelebration = (serviceId: string) => {
    setShortlistedServices(shortlistedServices.filter((s) => s.id !== serviceId));
  };

  const totalEstimatedCostPaise = shortlistedServices.reduce(
    (sum, s) => sum + (s.packages?.[0]?.price || s.basePrice || 0),
    0
  );
  const totalEstimatedCostRupees = Math.round(totalEstimatedCostPaise / 100);

  const handleSaveCelebration = async () => {
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/customer/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          eventType: occasion,
          eventDate: eventDate || new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
          eventTime,
          locationAddress: address || `${city}, Karnataka`,
          city,
          state: "Karnataka",
          pincode: "",
          guestCount: Number(guestCount) || 50,
          overallBudget: budget,
          notes,
          templateId: preselectedTemplate?.id || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          // Customer not logged in: redirect to login with return path
          router.push(`/login?redirect=/plan`);
          return;
        }
        throw new Error(data.error || "Failed to save celebration");
      }

      // Successfully created event! Redirect to its celebration dashboard
      router.push(`/customer/events/${data.event.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while saving your celebration.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
      {/* Header Banner */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <Badge variant="champagne" size="sm" className="mb-2">
          Guided Celebration Planner
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 tracking-tight">
          Plan My Celebration
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 mt-2">
          Bring your celebration to life one detail at a time. Tell us what you are imagining, and discover verified vendors tailored to your vision.
        </p>
      </div>

      {/* 5-Step Progress Stepper */}
      <div className="mb-10 bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/90 shadow-soft">
        <div className="grid grid-cols-5 gap-2 sm:gap-4 text-center">
          {[
            { num: 1, label: "Occasion" },
            { num: 2, label: "Event Details" },
            { num: 3, label: "Services" },
            { num: 4, label: "Recommendations" },
            { num: 5, label: "Summary" },
          ].map((s) => {
            const isCompleted = step > s.num;
            const isCurrent = step === s.num;
            return (
              <div key={s.num} className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                    isCurrent
                      ? "bg-rose-700 text-white shadow-sm ring-4 ring-rose-100"
                      : isCompleted
                      ? "bg-emerald-600 text-white"
                      : "bg-stone-100 text-stone-400"
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : s.num}
                </div>
                <span
                  className={`text-[10px] sm:text-xs font-semibold mt-1.5 hidden sm:block ${
                    isCurrent ? "text-stone-900" : isCompleted ? "text-emerald-700" : "text-stone-400"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="font-bold ml-2">×</button>
        </div>
      )}

      {/* STEP 1: OCCASION SELECTION */}
      {step === 1 && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200 shadow-soft animate-in fade-in duration-200">
          <div className="mb-6">
            <h2 className="text-xl font-serif font-bold text-stone-900">
              Step 1 — What are you celebrating?
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Select the milestone occasion to begin tailored planning.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-8">
            {OCCASIONS.map((occ) => {
              const isSelected = occasion === occ.name;
              return (
                <button
                  key={occ.name}
                  type="button"
                  onClick={() => handleOccasionSelect(occ.name)}
                  className={`p-4 rounded-xl text-left border transition-all flex items-start gap-3.5 ${
                    isSelected
                      ? "border-rose-600 bg-rose-50/50 shadow-sm ring-1 ring-rose-600/30"
                      : "border-stone-200 hover:border-stone-300 hover:bg-stone-50/60"
                  }`}
                >
                  <span className="text-2xl shrink-0 p-1 bg-white rounded-lg border border-stone-100 shadow-xs">
                    {occ.icon}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-sm font-bold ${isSelected ? "text-rose-800" : "text-stone-900"}`}>
                        {occ.name}
                      </h4>
                      {isSelected && <Check className="w-4 h-4 text-rose-700" />}
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5 line-clamp-1">
                      {occ.tagline}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex justify-end pt-4 border-t border-stone-100">
            <Button
              variant="primary"
              size="md"
              onClick={() => setStep(2)}
              rightIcon={<ChevronRight className="w-4 h-4" />}
            >
              Continue to Event Details
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: EVENT DETAILS */}
      {step === 2 && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200 shadow-soft animate-in fade-in duration-200">
          <div className="mb-6">
            <h2 className="text-xl font-serif font-bold text-stone-900">
              Step 2 — Celebration Details
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Give your event a name and specify key parameters like date, guest count, and estimated budget.
            </p>
          </div>

          <div className="space-y-5 mb-8">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Celebration Name *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Rohan's 30th Birthday Celebration"
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-warm-50/50"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Celebration Date *
                </label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-warm-50/50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Target Start Time
                </label>
                <input
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-warm-50/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  City *
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-warm-50/50"
                >
                  <option value="Bangalore">Bangalore</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Delhi NCR">Delhi NCR</option>
                  <option value="Hyderabad">Hyderabad</option>
                  <option value="Chennai">Chennai</option>
                  <option value="Pune">Pune</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Venue / Area Address *
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g., Indiranagar Club or Home Lawn"
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-warm-50/50"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Estimated Guest Count (~{guestCount} guests)
                </label>
                <input
                  type="range"
                  min="10"
                  max="1000"
                  step="10"
                  value={guestCount}
                  onChange={(e) => setGuestCount(Number(e.target.value))}
                  className="w-full accent-rose-600"
                />
                <span className="text-[11px] text-stone-500">
                  Approx. {guestCount} attendees
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Target Celebration Budget (₹)
                </label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  step="5000"
                  min="10000"
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-warm-50/50 font-mono font-bold text-stone-900"
                />
                <span className="text-[11px] text-stone-500">
                  Allocated: {formatRupees(budget)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Description & Special Preferences (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Specific color themes, dietary preferences, surprise element notes..."
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-warm-50/50"
              />
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-stone-100">
            <Button
              variant="outline"
              size="md"
              onClick={() => setStep(1)}
              leftIcon={<ChevronLeft className="w-4 h-4" />}
            >
              Back
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                if (!title) {
                  setError("Please provide a title for your celebration");
                  return;
                }
                setError("");
                setStep(3);
              }}
              rightIcon={<ChevronRight className="w-4 h-4" />}
            >
              Continue to Services Needed
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: WHAT DO YOU NEED? CATEGORY MULTI-SELECT */}
      {step === 3 && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200 shadow-soft animate-in fade-in duration-200">
          <div className="mb-6">
            <h2 className="text-xl font-serif font-bold text-stone-900">
              Step 3 — What does your celebration need?
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Select only the service categories you want to book. You are never forced into a package.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {SERVICE_CATEGORIES.map((cat) => {
              const isChecked = selectedCategories.includes(cat.slug);
              return (
                <div
                  key={cat.slug}
                  onClick={() => toggleCategory(cat.slug)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                    isChecked
                      ? "border-rose-600 bg-rose-50/40 shadow-xs ring-1 ring-rose-600/30"
                      : "border-stone-200 hover:border-stone-300 hover:bg-stone-50/50"
                  }`}
                >
                  <span className="text-2xl shrink-0 p-1 bg-white rounded-lg border border-stone-100">
                    {cat.icon}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-sm font-bold ${isChecked ? "text-rose-800" : "text-stone-900"}`}>
                        {cat.name}
                      </h4>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                      />
                    </div>
                    <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">
                      {cat.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between pt-4 border-t border-stone-100">
            <Button
              variant="outline"
              size="md"
              onClick={() => setStep(2)}
              leftIcon={<ChevronLeft className="w-4 h-4" />}
            >
              Back
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                if (selectedCategories.length === 0) {
                  setError("Please select at least one service category you need.");
                  return;
                }
                setError("");
                setStep(4);
              }}
              rightIcon={<ChevronRight className="w-4 h-4" />}
            >
              Discover Matching Vendors ({selectedCategories.length} Selected)
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: RECOMMENDATIONS & DISCOVERY */}
      {step === 4 && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200 shadow-soft animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-100 mb-6 gap-2">
            <div>
              <h2 className="text-xl font-serif font-bold text-stone-900">
                Step 4 — Recommended Vendors for Your Celebration
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Filtered transparently by: Occasion ({occasion}), City ({city}), and {selectedCategories.length} selected categories.
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Shortlisted</span>
              <span className="text-sm font-bold text-rose-700">
                {shortlistedServices.length} Services ({formatRupees(totalEstimatedCostRupees)})
              </span>
            </div>
          </div>

          {recommendedServices.length === 0 ? (
            <div className="py-12 text-center bg-warm-50 rounded-2xl border border-stone-200 mb-8 p-6">
              <Sparkles className="w-8 h-8 text-stone-400 mx-auto mb-2" />
              <h4 className="font-bold text-stone-800 text-sm">No specific vendor listings found for this exact filter</h4>
              <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
                You can proceed to save your celebration blueprint now and browse the directory as new verified vendors activate their listings.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {recommendedServices.map((service) => {
                const isShortlisted = shortlistedServices.some((s) => s.id === service.id);
                const startingPrice = service.packages?.[0]?.price || service.basePrice;

                return (
                  <div
                    key={service.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                      isShortlisted
                        ? "border-emerald-500 bg-emerald-50/30 ring-1 ring-emerald-500/30"
                        : "border-stone-200 bg-white hover:border-stone-300"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <Badge variant="champagne" size="sm">
                          {service.category?.name}
                        </Badge>
                        <div className="flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                          <ShieldCheck className="w-3.5 h-3.5" /> Verified
                        </div>
                      </div>

                      <h4 className="text-sm font-bold text-stone-900 leading-snug">
                        {service.title}
                      </h4>
                      <p className="text-xs text-stone-500 mt-0.5">
                        by <strong>{service.vendor?.businessName}</strong> • {service.vendor?.city || city}
                      </p>

                      <p className="text-xs text-stone-600 mt-2 line-clamp-2 leading-relaxed">
                        {service.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-stone-400 block uppercase font-bold">
                          Starting From
                        </span>
                        <span className="text-sm font-bold text-stone-900 font-mono">
                          {formatPrice(startingPrice)}
                        </span>
                      </div>

                      {isShortlisted ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeServiceFromCelebration(service.id)}
                          className="text-rose-700 hover:bg-rose-50 border-rose-200 text-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => addServiceToCelebration(service)}
                          className="text-xs"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" /> Add to Celebration
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-between pt-4 border-t border-stone-100">
            <Button
              variant="outline"
              size="md"
              onClick={() => setStep(3)}
              leftIcon={<ChevronLeft className="w-4 h-4" />}
            >
              Back
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => setStep(5)}
              rightIcon={<ChevronRight className="w-4 h-4" />}
            >
              Review Celebration Summary ({shortlistedServices.length} Selected)
            </Button>
          </div>
        </div>
      )}

      {/* STEP 5: CELEBRATION SUMMARY & SAVE */}
      {step === 5 && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200 shadow-soft animate-in fade-in duration-200">
          <div className="mb-6">
            <Badge variant="champagne" size="sm" className="mb-1">
              Final Blueprint
            </Badge>
            <h2 className="text-2xl font-serif font-bold text-stone-900">
              Step 5 — Celebration Summary
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Review your customized celebration blueprint. Once saved, your celebration dashboard will track your milestones, check vendor availability, and manage contracts independently.
            </p>
          </div>

          {/* Event Overview Box */}
          <div className="p-5 rounded-2xl bg-warm-50 border border-stone-200/90 mb-6 grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Celebration</span>
              <span className="font-bold text-stone-900 text-sm mt-0.5 block">{title}</span>
              <span className="text-[11px] text-rose-700 font-semibold">{occasion}</span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Date & Venue</span>
              <span className="font-bold text-stone-900 mt-0.5 block">
                {eventDate || "Date TBD"} ({eventTime})
              </span>
              <span className="text-stone-500">{address || city}</span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Guests & Scale</span>
              <span className="font-bold text-stone-900 mt-0.5 block">~{guestCount} Guests</span>
              <span className="text-stone-500">{selectedCategories.length} categories chosen</span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Target Budget</span>
              <span className="font-bold text-stone-900 text-sm mt-0.5 block font-mono">
                {formatRupees(budget)}
              </span>
              <span className="text-[11px] text-stone-500">
                Allocated Spend: {formatRupees(totalEstimatedCostRupees)}
              </span>
            </div>
          </div>

          {/* Budget Comparison Bar */}
          <div className="mb-8 p-4 rounded-xl border border-stone-200 bg-white">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-stone-700">Estimated Budget Utilization</span>
              <span className="font-bold font-mono text-stone-900">
                {Math.round((totalEstimatedCostRupees / (budget || 1)) * 100)}% of {formatRupees(budget)}
              </span>
            </div>
            <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  totalEstimatedCostRupees > budget ? "bg-amber-600" : "bg-emerald-600"
                }`}
                style={{
                  width: `${Math.min(100, Math.round((totalEstimatedCostRupees / (budget || 1)) * 100))}%`,
                }}
              />
            </div>
          </div>

          {/* Selected Services Table */}
          <div className="mb-8">
            <h3 className="text-sm font-bold text-stone-900 mb-3 flex items-center justify-between">
              <span>Shortlisted Services & Contracts ({shortlistedServices.length})</span>
              <button
                onClick={() => setStep(4)}
                className="text-xs font-semibold text-rose-700 hover:text-rose-800"
              >
                + Add More Services
              </button>
            </h3>

            {shortlistedServices.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-400 bg-stone-50 rounded-xl border border-stone-200">
                No individual vendors shortlisted yet. You can still save this celebration and explore vendors anytime from your dashboard.
              </div>
            ) : (
              <div className="space-y-3">
                {shortlistedServices.map((service) => {
                  const pkg = service.packages?.[0];
                  const agreedVal = pkg ? pkg.price : service.basePrice;
                  const advancePaise = Math.round((agreedVal * (pkg?.advancePercent || 25)) / 100);

                  return (
                    <div
                      key={service.id}
                      className="p-4 rounded-xl border border-stone-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="neutral" size="sm">
                            {service.category?.name}
                          </Badge>
                          <span className="text-xs font-bold text-stone-900">{service.title}</span>
                        </div>
                        <p className="text-xs text-stone-500">
                          Vendor: <strong>{service.vendor?.businessName}</strong> ({service.vendor?.city})
                        </p>
                      </div>

                      <div className="flex items-center gap-5 text-xs">
                        <div className="text-right">
                          <span className="font-bold text-stone-900 font-mono block">
                            {formatPrice(agreedVal)}
                          </span>
                          <span className="text-[10px] text-stone-500">
                            Advance deposit: {formatPrice(advancePaise)}
                          </span>
                        </div>
                        <button
                          onClick={() => removeServiceFromCelebration(service.id)}
                          className="p-1.5 text-stone-400 hover:text-rose-700 rounded-lg hover:bg-stone-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl bg-warm-50 border border-stone-200/80 mb-8 text-xs text-stone-600 flex items-start gap-3">
            <Info className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Zero Lock-in Guarantee:</strong> Saving this celebration does not commit you to immediate payments. You can review vendor portfolios, adjust checklist milestones, and request dates individually from your celebration dashboard.
            </p>
          </div>

          <div className="flex justify-between pt-4 border-t border-stone-100">
            <Button
              variant="outline"
              size="md"
              onClick={() => setStep(4)}
              leftIcon={<ChevronLeft className="w-4 h-4" />}
            >
              Back
            </Button>
            <Button
              variant="primary"
              size="lg"
              isLoading={saving}
              onClick={handleSaveCelebration}
              className="shadow-premium"
            >
              Save Celebration & Open Dashboard <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
