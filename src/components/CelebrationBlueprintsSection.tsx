"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  ArrowRight,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";

interface BlueprintItem {
  id?: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  suggestedBudgetMin: number;
  suggestedBudgetMax: number;
  defaultGuestCount: number;
  coverImage?: string;
  suggestedServices?: string[];
  serviceChecklist?: string[];
  stagesJson?: string;
  checkpointsJson?: string;
}

interface BlueprintsSectionProps {
  templates: any[];
}

const DEFAULT_BLUEPRINTS: BlueprintItem[] = [
  {
    slug: "dream-birthday-celebration",
    name: "Dream Birthday Celebration",
    category: "Birthday",
    description: "The complete milestone birthday package: thematic balloon backdrops, artisan custom cake, candid celebration photojournalism, gourmet banquet, and engaging party entertainment.",
    suggestedBudgetMin: 2500000,
    suggestedBudgetMax: 5000000,
    defaultGuestCount: 50,
    coverImage: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?q=80&w=1000&auto=format&fit=crop",
    suggestedServices: ["Decoration", "Custom Cake", "Photography", "Catering", "Entertainment"],
    serviceChecklist: ["Stage Backdrop", "Organic Balloon Garland", "2-Tier Theme Cake", "4-Hour Photojournalism", "Multi-Cuisine Buffet", "Party DJ & Sound"],
  },
  {
    slug: "elegant-wedding-celebration",
    name: "Elegant Wedding Celebration",
    category: "Wedding",
    description: "A breathtaking celebration bringing together luxury venue decor, cinematic photo and drone film crews, royal banquet catering, and celebratory bridal makeover artists.",
    suggestedBudgetMin: 20000000,
    suggestedBudgetMax: 50000000,
    defaultGuestCount: 200,
    coverImage: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1000&auto=format&fit=crop",
    suggestedServices: ["Venue", "Photography", "Catering", "Decoration", "Makeup & Beauty", "Entertainment"],
    serviceChecklist: ["Royal Mandap Styling", "Cinematic 4K Wedding Film", "Gourmet Banquet Feast", "Bridal & Party Makeover", "Live Classical & DJ"],
  },
  {
    slug: "intimate-engagement-soiree",
    name: "Intimate Engagement Soiree",
    category: "Engagement",
    description: "An intimate, romantic gathering with floral ring-ceremony archways, champagne canapés, bespoke engagement cake, and couple portraiture.",
    suggestedBudgetMin: 5000000,
    suggestedBudgetMax: 10000000,
    defaultGuestCount: 60,
    coverImage: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1000&auto=format&fit=crop",
    suggestedServices: ["Decoration", "Photography", "Catering", "Cake", "Venue"],
    serviceChecklist: ["Floral Ring Arch", "Artisan Tier Cake", "Couple & Family Portraits", "Appetizer & Dinner Spread"],
  },
  {
    slug: "romantic-anniversary-dinner",
    name: "Romantic Anniversary Celebration",
    category: "Anniversary",
    description: "Celebrate enduring love with candlelit floral tablescapes, gourmet dining, nostalgic photo slideshow, and signature anniversary cake.",
    suggestedBudgetMin: 1000000,
    suggestedBudgetMax: 2500000,
    defaultGuestCount: 25,
    coverImage: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=1000&auto=format&fit=crop",
    suggestedServices: ["Decoration", "Photography", "Cake", "Dining or Catering"],
    serviceChecklist: ["Candlelit Floral Table", "Artisan Heart Cake", "Couple Milestone Photo Shoot", "Multi-Course Dining"],
  },
  {
    slug: "beautiful-baby-shower",
    name: "Beautiful Baby Shower",
    category: "Baby Shower",
    description: "Welcome the arrival with pastel floral backdrops, gender-neutral dessert tables, sweet mom-to-be portraits, and delicious hi-tea bites.",
    suggestedBudgetMin: 2000000,
    suggestedBudgetMax: 4000000,
    defaultGuestCount: 40,
    coverImage: "https://images.unsplash.com/photo-1519689680058-324335c77eba?q=80&w=1000&auto=format&fit=crop",
    suggestedServices: ["Decoration", "Cake & Desserts", "Photography", "Hi-Tea Catering", "Return Favors"],
    serviceChecklist: ["Pastel Floral Backdrop", "Cute Gender-Neutral Cake", "Mom-to-Be Portrait Session", "Gourmet Finger Foods"],
  },
  {
    slug: "auspicious-housewarming-celebration",
    name: "Auspicious Housewarming Celebration",
    category: "Housewarming",
    description: "Bless your new home with traditional marigold pooja decor, traditional banana-leaf welcome dining, auspicious floral rangoli, and family milestone photos.",
    suggestedBudgetMin: 1500000,
    suggestedBudgetMax: 3500000,
    defaultGuestCount: 45,
    coverImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000&auto=format&fit=crop",
    suggestedServices: ["Traditional Decor", "Traditional Feast Catering", "Photography", "Pooja Essentials"],
    serviceChecklist: ["Marigold Entrance Toran & Rangoli", "Traditional Banana Leaf Catering", "Family Blessing Photo Coverage"],
  },
  {
    slug: "triumphant-graduation-party",
    name: "Triumphant Graduation Celebration",
    category: "Graduation",
    description: "Celebrate academic achievement with custom diploma cake, graduate cap balloon arch, high-energy sound & DJ setup, and celebratory buffet spread.",
    suggestedBudgetMin: 2000000,
    suggestedBudgetMax: 4500000,
    defaultGuestCount: 50,
    coverImage: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1000&auto=format&fit=crop",
    suggestedServices: ["Balloon Arch & Photo Booth", "Theme Cake", "Sound & DJ", "Buffet Catering"],
    serviceChecklist: ["Diploma & Cap Balloon Arch", "Custom Trophy Cake", "Sound System & Playlist", "Celebration Snack Bar"],
  },
  {
    slug: "corporate-milestone-gala",
    name: "Corporate Milestone & Annual Celebration",
    category: "Corporate Event",
    description: "Professional annual galas, product launches and team milestones with state-of-the-art AV staging, executive hi-tea banquet, emcee hosting and documentary coverage.",
    suggestedBudgetMin: 7500000,
    suggestedBudgetMax: 20000000,
    defaultGuestCount: 100,
    coverImage: "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1000&auto=format&fit=crop",
    suggestedServices: ["Venue", "AV Tech & Stage", "Banquet Catering", "Emcee & Entertainment", "Corporate Photography"],
    serviceChecklist: ["LED Stage Backdrop & Mic Setup", "Executive Multi-Cuisine Spread", "Awards Ceremony Emcee", "Milestone Photojournalism"],
  },
];

export default function CelebrationBlueprintsSection({ templates }: BlueprintsSectionProps) {
  const router = useRouter();
  const [selectedBlueprint, setSelectedBlueprint] = useState<BlueprintItem | null>(null);

  const formatPrice = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;

  const defaultSlugs = new Set(DEFAULT_BLUEPRINTS.map((b) => b.slug));
  const mappedDbTemplates: BlueprintItem[] = (templates || []).map((t) => {
    const existingDefault = DEFAULT_BLUEPRINTS.find((d) => d.slug === t.slug);
    let recServices: string[] = [];
    try {
      if (t.recommendedServicesJson) {
        recServices = JSON.parse(t.recommendedServicesJson);
      }
    } catch {}

    return {
      id: t.id,
      slug: t.slug,
      name: t.name,
      category: t.category,
      description: t.description,
      suggestedBudgetMin: t.suggestedBudgetMin,
      suggestedBudgetMax: t.suggestedBudgetMax,
      defaultGuestCount: t.defaultGuestCount,
      coverImage: existingDefault?.coverImage || "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1000&auto=format&fit=crop",
      suggestedServices: recServices.length > 0 ? recServices : existingDefault?.suggestedServices || ["Decoration", "Photography", "Catering"],
      serviceChecklist: existingDefault?.serviceChecklist || ["Custom Theme Styling", "Photography & Video", "Catering & Delicacies"],
      stagesJson: t.stagesJson,
      checkpointsJson: t.checkpointsJson,
    };
  });

  const combinedBlueprints: BlueprintItem[] = [
    ...mappedDbTemplates,
    ...DEFAULT_BLUEPRINTS.filter((d) => !templates?.some((t) => t.slug === d.slug)),
  ].slice(0, 8);

  const handlePlanCelebration = (bp: BlueprintItem) => {
    const query = new URLSearchParams({
      occasion: bp.category,
      budget: bp.suggestedBudgetMin.toString(),
      guests: bp.defaultGuestCount.toString(),
      title: bp.name,
      blueprint: bp.slug,
    });
    router.push(`/plan?${query.toString()}`);
  };

  return (
    <section className="py-20 bg-warm-50/50 dark:bg-dark-surface border-b border-stone-200/80 dark:border-dark-border transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div className="max-w-2xl">
            <Badge variant="champagne" size="sm" className="mb-2">
              Structured Event Blueprints
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-serif font-bold text-stone-900 dark:text-dark-text-primary tracking-tight">
              Curated Celebration Blueprints
            </h2>
            <p className="text-sm text-stone-600 dark:text-dark-text-secondary mt-2 leading-relaxed">
              Thoughtfully designed inspiration to help you plan every special occasion. Indicative budgets, checklists, and vendor bundles tailored to your celebration style.
            </p>
          </div>

          <Link href="/templates">
            <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              View All Blueprints
            </Button>
          </Link>
        </div>

        {/* Blueprint Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {combinedBlueprints.map((bp) => {
            const serviceList = bp.suggestedServices || ["Decoration", "Photography", "Catering"];

            return (
              <Card key={bp.slug} hoverEffect className="flex flex-col justify-between overflow-hidden group">
                <div>
                  {/* Blueprint Cover */}
                  <div className="h-44 w-full bg-stone-200 dark:bg-dark-elevated relative overflow-hidden">
                    <img
                      src={bp.coverImage}
                      alt={bp.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge variant="rose" size="sm" className="bg-white/95 dark:bg-dark-surface/90 dark:text-dark-text-primary backdrop-blur-sm shadow-sm font-semibold">
                        {bp.category}
                      </Badge>
                    </div>
                  </div>

                  {/* Content */}
                  <CardContent className="p-5">
                    <h3 className="font-serif font-bold text-base text-stone-900 dark:text-dark-text-primary leading-snug line-clamp-1">
                      {bp.name}
                    </h3>

                    <p className="text-xs text-stone-500 dark:text-dark-text-secondary mt-2 line-clamp-2 leading-relaxed">
                      {bp.description}
                    </p>

                    {/* Metadata summary */}
                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-stone-100 dark:border-dark-border text-[11px] text-stone-600 dark:text-dark-text-secondary">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500 shrink-0" />
                        <span>~{bp.defaultGuestCount} Guests</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-rose-700 dark:text-rose-400 shrink-0" />
                        <span>{serviceList.length} Services</span>
                      </div>
                    </div>

                    {/* Service Chips */}
                    <div className="mt-3 flex flex-wrap gap-1">
                      {serviceList.slice(0, 3).map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-dark-elevated text-[10px] font-medium text-stone-600 dark:text-dark-text-secondary"
                        >
                          {s}
                        </span>
                      ))}
                      {serviceList.length > 3 && (
                        <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-dark-elevated text-[10px] font-bold text-stone-400 dark:text-stone-500">
                          +{serviceList.length - 3} more
                        </span>
                      )}
                    </div>
                  </CardContent>
                </div>

                {/* Footer with Actions */}
                <div className="px-5 py-4 bg-stone-50/80 dark:bg-dark-elevated/40 border-t border-stone-100 dark:border-dark-border space-y-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 dark:text-stone-500 tracking-wider block">
                      Indicative Budget
                    </span>
                    <span className="text-sm font-bold text-stone-900 dark:text-dark-text-primary font-mono">
                      {formatPrice(bp.suggestedBudgetMin)} – {formatPrice(bp.suggestedBudgetMax)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs w-full px-2"
                      onClick={() => setSelectedBlueprint(bp)}
                    >
                      View Blueprint
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      className="text-xs w-full px-2"
                      onClick={() => handlePlanCelebration(bp)}
                    >
                      Plan This
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Blueprint Detail Modal */}
        <Modal
          isOpen={!!selectedBlueprint}
          onClose={() => setSelectedBlueprint(null)}
          title={selectedBlueprint?.name}
          description={`Indicative celebration blueprint for ${selectedBlueprint?.category}`}
          maxWidth="2xl"
        >
          {selectedBlueprint && (
            <div className="space-y-5 text-xs text-stone-700 dark:text-dark-text-secondary">
              {/* Cover Preview */}
              <div className="h-48 w-full rounded-xl overflow-hidden relative">
                <img
                  src={selectedBlueprint.coverImage}
                  alt={selectedBlueprint.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900/70 via-transparent to-transparent flex items-end p-4">
                  <div>
                    <Badge variant="rose" size="sm" className="mb-1">
                      {selectedBlueprint.category}
                    </Badge>
                    <h4 className="text-white font-serif font-bold text-lg">
                      {selectedBlueprint.name}
                    </h4>
                  </div>
                </div>
              </div>

              <p className="leading-relaxed text-stone-600 dark:text-dark-text-secondary">
                {selectedBlueprint.description}
              </p>

              {/* Key Specs */}
              <div className="grid grid-cols-3 gap-3 p-3.5 bg-stone-50 dark:bg-dark-elevated rounded-xl border border-stone-200 dark:border-dark-border">
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-400 dark:text-stone-500 block">Indicative Budget</span>
                  <span className="font-bold text-stone-900 dark:text-dark-text-primary text-xs font-mono">
                    {formatPrice(selectedBlueprint.suggestedBudgetMin)} – {formatPrice(selectedBlueprint.suggestedBudgetMax)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-400 dark:text-stone-500 block">Ideal Guest Size</span>
                  <span className="font-bold text-stone-900 dark:text-dark-text-primary text-xs">
                    ~{selectedBlueprint.defaultGuestCount} Guests
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-400 dark:text-stone-500 block">Suggested Services</span>
                  <span className="font-bold text-rose-700 dark:text-rose-400 text-xs">
                    {selectedBlueprint.suggestedServices?.length || 5} Categories
                  </span>
                </div>
              </div>

              {/* Suggested Services Breakdown */}
              <div>
                <h5 className="font-bold text-stone-900 dark:text-dark-text-primary mb-2 uppercase text-[11px] tracking-wider">
                  Recommended Service Checklist
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(selectedBlueprint.serviceChecklist || selectedBlueprint.suggestedServices || []).map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-warm-50 dark:bg-dark-elevated border border-stone-200/80 dark:border-dark-border flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="font-medium text-stone-800 dark:text-dark-text-primary">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Disclaimer Notice */}
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-900/60 text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed">
                <strong>Indicative Blueprint:</strong> Budget estimates and service suggestions are indicative planning guides. You can freely customize vendors, packages, and services with zero package lock-in.
              </div>

              {/* CTA Action */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  size="md"
                  className="w-1/2"
                  onClick={() => setSelectedBlueprint(null)}
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  className="w-1/2"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  onClick={() => {
                    handlePlanCelebration(selectedBlueprint);
                    setSelectedBlueprint(null);
                  }}
                >
                  Plan This Celebration
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </section>
  );
}
