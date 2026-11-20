"use client";

import { useState } from "react";
import Link from "next/link";
import { Star, ShieldCheck, MapPin, ArrowRight, ExternalLink, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";

interface VendorServiceItem {
  id: string;
  title: string;
  description?: string;
  basePrice: number;
  category: { name: string; slug: string };
  vendor: {
    id: string;
    businessName: string;
    city: string;
    rating: number;
    reviewCount: number;
    verificationStatus: string;
    bio?: string;
  };
  images: { imageUrl: string }[];
  isDemo?: boolean;
}

interface PremierVendorsSectionProps {
  services: any[];
}

const DEMO_VENDORS = [
  {
    id: "demo-v1",
    title: "Cinematic Celebration & Portrait Coverage",
    basePrice: 1500000, // ₹15,000
    category: { name: "Photography & Cinema", slug: "photography-videography" },
    vendor: {
      id: "v-photo",
      businessName: "Moments & Memories Studio",
      city: "Bengaluru",
      rating: 4.9,
      reviewCount: 28,
      verificationStatus: "VERIFIED",
      bio: "Wedding, birthday and celebration candid photography and 4K cinematic highlight films.",
    },
    images: [{ imageUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop" }],
    isDemo: true,
  },
  {
    id: "demo-v2",
    title: "Thematic Birthday & Milestone Event Styling",
    basePrice: 1200000, // ₹12,000
    category: { name: "Thematic Event & Floral Décor", slug: "decoration-services" },
    vendor: {
      id: "v-decor",
      businessName: "Bloom & Glow Decor",
      city: "Bengaluru",
      rating: 4.8,
      reviewCount: 34,
      verificationStatus: "VERIFIED",
      bio: "Personalized birthday, engagement and celebration floral styling and balloon installations.",
    },
    images: [{ imageUrl: "https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=800&auto=format&fit=crop" }],
    isDemo: true,
  },
  {
    id: "demo-v3",
    title: "Celebration Gourmet Feast & Live Counters",
    basePrice: 2000000, // ₹20,000
    category: { name: "Banquet & Buffet Catering", slug: "catering-services" },
    vendor: {
      id: "v-cater",
      businessName: "The Grand Feast Co.",
      city: "Bengaluru",
      rating: 4.9,
      reviewCount: 41,
      verificationStatus: "VERIFIED",
      bio: "Celebration catering and curated multi-cuisine banquets with interactive live food stations.",
    },
    images: [{ imageUrl: "https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=800&auto=format&fit=crop" }],
    isDemo: true,
  },
  {
    id: "demo-v4",
    title: "Custom Themed Tier Cakes & Dessert Grazing",
    basePrice: 350000, // ₹3,500
    category: { name: "Artisan Cakes & Desserts", slug: "cakes-bakeries" },
    vendor: {
      id: "v-cake",
      businessName: "Sugarplum Celebration Cakes",
      city: "Bengaluru",
      rating: 4.9,
      reviewCount: 52,
      verificationStatus: "VERIFIED",
      bio: "Handcrafted tiered milestone centerpieces, custom cakes and dessert grazing tables.",
    },
    images: [{ imageUrl: "https://images.unsplash.com/photo-1535141192574-5d4897c13136?q=80&w=800&auto=format&fit=crop" }],
    isDemo: true,
  },
  {
    id: "demo-v5",
    title: "Boutique Garden & Open-Air Courtyard",
    basePrice: 4500000, // ₹45,000
    category: { name: "Celebration Venues & Lawns", slug: "venues" },
    vendor: {
      id: "v-venue",
      businessName: "The Celebration Courtyard",
      city: "Bengaluru",
      rating: 4.8,
      reviewCount: 19,
      verificationStatus: "VERIFIED",
      bio: "Intimate gatherings, sunset terrace parties, and special occasions surrounded by natural greenery.",
    },
    images: [{ imageUrl: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=800&auto=format&fit=crop" }],
    isDemo: true,
  },
  {
    id: "demo-v6",
    title: "Live Acoustic & Celebration Party DJ",
    basePrice: 1800000, // ₹18,000
    category: { name: "Music, DJs & Performers", slug: "entertainment" },
    vendor: {
      id: "v-ent",
      businessName: "Spark Events & Entertainment",
      city: "Bengaluru",
      rating: 4.9,
      reviewCount: 22,
      verificationStatus: "VERIFIED",
      bio: "Live acoustic vocalists, celebration party DJs, emceeing and ambient sound engineering.",
    },
    images: [{ imageUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800&auto=format&fit=crop" }],
    isDemo: true,
  },
];

export default function PremierVendorsSection({ services }: PremierVendorsSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const formatPrice = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;

  // Combine real database services with demo examples to provide a rich catalog
  const realVendorIds = new Set(services.map((s) => s.vendor?.businessName?.toLowerCase()));
  const filteredDemo = DEMO_VENDORS.filter(
    (d) => !realVendorIds.has(d.vendor.businessName.toLowerCase())
  );

  const combinedList: VendorServiceItem[] = [
    ...services.map((s) => ({ ...s, isDemo: false })),
    ...filteredDemo,
  ];

  const categories = [
    { label: "All Categories", slug: "all" },
    { label: "Photography", slug: "photography-videography" },
    { label: "Catering", slug: "catering-services" },
    { label: "Decoration", slug: "decoration-services" },
    { label: "Cakes & Desserts", slug: "cakes-bakeries" },
    { label: "Venues", slug: "venues" },
    { label: "Entertainment", slug: "entertainment" },
  ];

  const displayList = combinedList.filter((item) => {
    if (selectedCategory === "all") return true;
    return item.category?.slug === selectedCategory;
  }).slice(0, 6);

  return (
    <section className="py-20 bg-white border-b border-stone-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div className="max-w-2xl">
            <Badge variant="rose" size="sm" className="mb-2">
              Curated Talent
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-serif font-bold text-stone-900 tracking-tight">
              Premier Celebration Vendors
            </h2>
            <p className="text-sm text-stone-600 mt-2 leading-relaxed">
              Meet talented professionals who bring your special moments to life. Handpicked, background-screened, and bound by our 2-hour response guarantee.
            </p>
          </div>

          <Link href="/explore">
            <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              Explore All Vendors
            </Button>
          </Link>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8">
          {categories.map((c) => (
            <button
              key={c.slug}
              onClick={() => setSelectedCategory(c.slug)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === c.slug
                  ? "bg-rose-700 text-white shadow-sm font-bold"
                  : "bg-warm-100 text-stone-600 hover:bg-stone-200/80"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Vendor Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayList.map((item) => {
            const hasVerifiedRating = item.vendor?.rating && item.vendor?.reviewCount > 0;
            const detailUrl = item.isDemo ? `/explore?search=${encodeURIComponent(item.vendor.businessName)}` : `/services/${item.id}`;
            const exploreUrl = `/explore?city=${encodeURIComponent(item.vendor.city || "Bangalore")}&search=${encodeURIComponent(item.vendor.businessName)}`;

            return (
              <Card key={item.id} hoverEffect className="flex flex-col justify-between overflow-hidden">
                <div>
                  {/* Card Image */}
                  <div className="h-48 w-full bg-stone-200 relative overflow-hidden group">
                    <img
                      src={item.images[0]?.imageUrl || "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop"}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <Badge variant="neutral" size="sm" className="bg-white/95 backdrop-blur-sm shadow-sm font-medium">
                        {item.category?.name || "Celebration Service"}
                      </Badge>
                      {item.isDemo && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/90 text-white shadow-sm">
                          Demo Example
                        </span>
                      )}
                    </div>
                    {item.vendor?.verificationStatus === "VERIFIED" && (
                      <div className="absolute top-3 right-3">
                        <Badge variant="success" size="sm" dot>
                          Verified
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
                      <span className="flex items-center gap-1 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        {item.vendor?.city || "Bengaluru"}
                      </span>
                      {hasVerifiedRating ? (
                        <span className="flex items-center gap-1 font-bold text-stone-900 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/80">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          {item.vendor.rating.toFixed(1)}{" "}
                          <span className="text-stone-400 font-normal">({item.vendor.reviewCount})</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-stone-400">Newly Onboarded</span>
                      )}
                    </div>

                    <h3 className="font-serif font-bold text-lg text-stone-900 leading-snug line-clamp-1">
                      {item.vendor?.businessName}
                    </h3>

                    <h4 className="text-xs font-semibold text-rose-700 mt-1 line-clamp-1">
                      {item.title}
                    </h4>

                    <p className="text-xs text-stone-600 mt-2 line-clamp-2 leading-relaxed">
                      {item.vendor?.bio || item.description || "Dedicated celebration professionals providing customized services with verified quality benchmarks."}
                    </p>
                  </CardContent>
                </div>

                {/* Card Footer */}
                <div className="px-6 py-4 bg-stone-50/70 border-t border-stone-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">
                      Starting From
                    </span>
                    <span className="text-base font-bold text-stone-900 font-mono">
                      {formatPrice(item.basePrice)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={exploreUrl}>
                      <Button variant="ghost" size="sm" className="text-xs">
                        Explore
                      </Button>
                    </Link>
                    <Link href={detailUrl}>
                      <Button variant="outline" size="sm" className="text-xs">
                        View Services
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
