"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Check, Tag } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface ServiceItem {
  id: string;
  title: string;
  basePrice: number;
  category: { name: string; slug: string };
  vendor: { businessName: string; city: string; rating: number };
}

interface BudgetInspirationProps {
  services: ServiceItem[];
}

const BUDGET_TIERS = [
  {
    id: "intimate",
    label: "Under ₹25,000",
    description: "Ideal for intimate birthdays, baby showers & home gatherings",
    maxPaise: 2500000,
    minPaise: 0,
    exampleAllocations: [
      { category: "Decoration", share: "₹8,000 - ₹12,000" },
      { category: "Custom Cake", share: "₹2,500 - ₹4,500" },
      { category: "Photography", share: "₹6,000 - ₹10,000" },
    ],
  },
  {
    id: "moderate",
    label: "₹25,000 – ₹50,000",
    description: "Perfect for milestone anniversaries, engagements & festive parties",
    maxPaise: 5000000,
    minPaise: 2500000,
    exampleAllocations: [
      { category: "Theme Décor", share: "₹15,000 - ₹20,000" },
      { category: "Catering / Spread", share: "₹15,000 - ₹22,000" },
      { category: "Candid Photo & Video", share: "₹10,000 - ₹15,000" },
    ],
  },
  {
    id: "premium",
    label: "₹50,000 – ₹1,00,000",
    description: "Tailored for grand celebrations, weddings & multi-service occasions",
    maxPaise: 10000000,
    minPaise: 5000000,
    exampleAllocations: [
      { category: "Full Venue Styling", share: "₹30,000 - ₹45,000" },
      { category: "Multi-Cuisine Dining", share: "₹30,000 - ₹40,000" },
      { category: "Cinematic Coverage", share: "₹20,000 - ₹30,000" },
    ],
  },
  {
    id: "luxury",
    label: "₹1,00,000+",
    description: "Designed for luxury destination weddings & premier celebrations",
    maxPaise: 999999999,
    minPaise: 10000000,
    exampleAllocations: [
      { category: "Luxury Event Production", share: "₹45,000+" },
      { category: "Royal Buffet & Live Counters", share: "₹50,000+" },
      { category: "Premium Photo & Film Crew", share: "₹35,000+" },
    ],
  },
];

export default function BudgetInspirationSection({ services }: BudgetInspirationProps) {
  const [selectedTier, setSelectedTier] = useState(BUDGET_TIERS[0]);

  const matchingServices = services.filter((s) => {
    if (selectedTier.id === "luxury") {
      return s.basePrice >= 5000000;
    }
    return s.basePrice <= selectedTier.maxPaise;
  }).slice(0, 4);

  const formatPrice = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;

  return (
    <section className="py-20 bg-warm-100/60 dark:bg-dark-bg border-y border-stone-200/80 dark:border-dark-border transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12">
          <p className="text-xs uppercase tracking-widest font-bold text-rose-700 dark:text-rose-400">
            Budget-Conscious Planning
          </p>
          <h2 className="text-2xl sm:text-4xl font-serif font-bold text-stone-900 dark:text-dark-text-primary tracking-tight mt-1.5">
            A beautiful celebration doesn&apos;t need a complicated budget.
          </h2>
          <p className="text-sm text-stone-600 dark:text-dark-text-secondary mt-3 leading-relaxed">
            Select your target budget range to see how services can be organized across photography, décor, catering, and cakes—with real prices from verified vendors.
          </p>
        </div>

        {/* Tier Selector Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {BUDGET_TIERS.map((tier) => {
            const isSelected = selectedTier.id === tier.id;
            return (
              <button
                key={tier.id}
                onClick={() => setSelectedTier(tier)}
                className={`p-4 rounded-2xl text-left border transition-all ${
                  isSelected
                    ? "bg-white dark:bg-dark-surface border-rose-600 dark:border-rose-500 shadow-premium ring-2 ring-rose-600/20"
                    : "bg-white/70 dark:bg-dark-elevated/70 border-stone-200 dark:border-dark-border hover:border-stone-300 dark:hover:border-stone-600 hover:bg-white dark:hover:bg-dark-surface"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-bold ${isSelected ? "text-rose-700 dark:text-rose-400" : "text-stone-900 dark:text-dark-text-primary"}`}>
                    {tier.label}
                  </span>
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px]">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-stone-500 dark:text-dark-text-secondary line-clamp-2 leading-relaxed">
                  {tier.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Breakdown Card + Real Service Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Suggested Breakdown Box */}
          <div className="bg-white dark:bg-dark-surface rounded-2xl p-6 sm:p-7 border border-stone-200 dark:border-dark-border shadow-soft">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-rose-700 dark:text-rose-400" />
              <h3 className="font-serif font-bold text-stone-900 dark:text-dark-text-primary text-base">
                Recommended Budget Distribution
              </h3>
            </div>
            <p className="text-xs text-stone-500 dark:text-dark-text-secondary mb-6 leading-relaxed">
              Based on actual celebration configurations booked on Celebrating YOU for {selectedTier.label}:
            </p>

            <div className="space-y-3.5">
              {selectedTier.exampleAllocations.map((alloc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-warm-50 dark:bg-dark-elevated border border-stone-200/80 dark:border-dark-border text-xs"
                >
                  <span className="font-medium text-stone-700 dark:text-dark-text-primary">{alloc.category}</span>
                  <span className="font-bold text-stone-900 dark:text-white font-mono">{alloc.share}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-5 border-t border-stone-100 dark:border-dark-border">
              <p className="text-[11px] text-stone-500 dark:text-dark-text-secondary mb-4">
                You maintain complete freedom to book services independently or tailor allocations to your vision.
              </p>
              <Link href={`/plan?budget=${selectedTier.id}`}>
                <Button variant="primary" size="sm" className="w-full">
                  Plan in this Budget <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Real Services matching this bracket */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs uppercase tracking-widest font-bold text-stone-500 dark:text-dark-text-secondary">
                Verified Services Within This Range
              </h4>
              <Link
                href="/explore"
                className="text-xs font-semibold text-rose-700 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 flex items-center gap-1"
              >
                Explore all services <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {matchingServices.length === 0 ? (
              <div className="bg-white dark:bg-dark-surface rounded-2xl p-8 border border-stone-200 dark:border-dark-border text-center">
                <Tag className="w-8 h-8 text-stone-300 dark:text-stone-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-stone-700 dark:text-dark-text-primary">Services in this budget bracket are currently loading.</p>
                <p className="text-[11px] text-stone-500 dark:text-dark-text-secondary mt-1">Browse our explore directory to view all available listings.</p>
                <div className="mt-4">
                  <Link href="/explore">
                    <Button variant="outline" size="sm">Browse Directory</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {matchingServices.map((service) => (
                  <div
                    key={service.id}
                    className="p-5 rounded-2xl border border-stone-200 dark:border-dark-border bg-white dark:bg-dark-surface hover:border-stone-300 dark:hover:border-stone-600 transition-all flex flex-col justify-between shadow-soft"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-2">
                        <Badge variant="champagne" size="sm">
                          {service.category.name}
                        </Badge>
                        <span className="text-stone-500 dark:text-dark-text-secondary font-medium">
                          {service.vendor.city || "Bangalore"}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-stone-900 dark:text-dark-text-primary line-clamp-1">
                        {service.title}
                      </h4>
                      <p className="text-xs text-stone-500 dark:text-dark-text-secondary mt-0.5">
                        by {service.vendor.businessName}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-100 dark:border-dark-border flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-stone-400 dark:text-stone-500 uppercase font-semibold block">
                          Starts From
                        </span>
                        <span className="text-sm font-bold text-stone-900 dark:text-dark-text-primary font-mono">
                          {formatPrice(service.basePrice)}
                        </span>
                      </div>
                      <Link href={`/services/${service.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
