import Navbar from "@/components/Navbar";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { isDatabaseUnavailableError } from "@/lib/dbErrors";
import { Star, ShieldCheck, Filter, ArrowRight, Search, Clock, MapPin, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import ExploreGridClient from "./ExploreGridClient";

export const dynamic = "force-dynamic";

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: {
    category?: string;
    occasion?: string;
    city?: string;
    search?: string;
    maxBudget?: string;
    minRating?: string;
    sort?: string;
  };
}) {
  let categories: any[] = [];
  try {
    categories = await prisma.vendorCategory.findMany({ where: { isActive: true } });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      console.warn("[ExplorePage] Database uninitialized or unavailable. Rendering with empty categories.");
    } else {
      throw error;
    }
  }

  const OCCASIONS = [
    "All Occasions",
    "Birthday",
    "Wedding",
    "Engagement",
    "Anniversary",
    "Baby Shower",
    "Housewarming",
    "Graduation",
    "Corporate Event",
    "Festival Celebration",
  ];

  const where: any = {
    status: "PUBLISHED",
    vendor: {
      verificationStatus: "VERIFIED",
    },
  };

  if (searchParams.category && searchParams.category !== "all") {
    where.OR = [
      { category: { slug: searchParams.category } },
      { categoryId: searchParams.category },
    ];
  }

  if (searchParams.city && searchParams.city !== "all") {
    where.vendor.city = { contains: searchParams.city };
  }

  if (searchParams.search) {
    where.OR = [
      { title: { contains: searchParams.search } },
      { description: { contains: searchParams.search } },
      { vendor: { businessName: { contains: searchParams.search } } },
    ];
  }

  if (searchParams.maxBudget) {
    const budgetPaise =
      Number(searchParams.maxBudget) > 100000
        ? Number(searchParams.maxBudget)
        : Number(searchParams.maxBudget) * 100;
    where.basePrice = { lte: budgetPaise };
  }

  if (searchParams.minRating) {
    where.rating = { gte: Number(searchParams.minRating) };
  }

  let orderBy: any = { rating: "desc" };
  if (searchParams.sort === "price_asc") {
    orderBy = { basePrice: "asc" };
  } else if (searchParams.sort === "price_desc") {
    orderBy = { basePrice: "desc" };
  }

  let services: any[] = [];
  try {
    services = await prisma.service.findMany({
      where,
      include: {
        category: true,
        vendor: true,
        packages: true,
        images: { take: 1 },
      },
      orderBy,
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      console.warn("[ExplorePage] Database uninitialized or unavailable. Rendering with empty services.");
    } else {
      throw error;
    }
  }

  const formatPrice = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-dark-bg flex flex-col font-sans text-stone-800 dark:text-dark-text-primary transition-colors duration-200">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        {/* Page Header */}
        <div className="mb-8">
          <Badge variant="rose" size="sm" className="mb-2">
            Verified Celebration Marketplace
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 dark:text-dark-text-primary tracking-tight">
            Explore Celebration Services & Vendors
          </h1>
          <p className="text-sm text-stone-600 dark:text-dark-text-secondary mt-1.5 max-w-2xl">
            Browse through background-screened vendors bound by our mandatory 2-hour response guarantee. Book independently or combine services under one celebration workspace.
          </p>
        </div>

        {/* Occasion Filter Pill Bar */}
        <div className="mb-8 overflow-x-auto pb-2 flex items-center gap-2">
          {OCCASIONS.map((occ) => {
            const isAll = occ === "All Occasions";
            const active = isAll
              ? !searchParams.occasion || searchParams.occasion === "all"
              : searchParams.occasion === occ;

            const nextParams = new URLSearchParams(searchParams as Record<string, string>);
            if (isAll) {
              nextParams.delete("occasion");
            } else {
              nextParams.set("occasion", occ);
            }

            return (
              <Link
                key={occ}
                href={`/explore?${nextParams.toString()}`}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap border transition-all ${
                  active
                    ? "bg-rose-700 dark:bg-rose-600 text-white border-rose-700 dark:border-rose-600 shadow-sm"
                    : "bg-white dark:bg-dark-surface text-stone-700 dark:text-dark-text-secondary border-stone-200 dark:border-dark-border hover:border-stone-300 dark:hover:border-stone-600 hover:bg-stone-50 dark:hover:bg-dark-elevated"
                }`}
              >
                {occ}
              </Link>
            );
          })}
        </div>

        {/* Layout: Sidebar Filter & Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-dark-border">
                <span className="text-sm font-bold text-stone-900 dark:text-dark-text-primary flex items-center gap-2">
                  <Filter className="w-4 h-4 text-stone-500" /> Filters
                </span>
                <Link href="/explore" className="text-xs text-rose-700 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 font-semibold">
                  Reset
                </Link>
              </div>

              {/* Service Categories */}
              <div className="py-4 border-b border-stone-100 dark:border-dark-border">
                <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-dark-text-secondary mb-3">
                  Service Categories
                </p>
                <div className="space-y-1.5">
                  <Link
                    href={`/explore?${new URLSearchParams({ ...searchParams, category: "all" }).toString()}`}
                    className={`block px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                      !searchParams.category || searchParams.category === "all"
                        ? "bg-stone-900 dark:bg-dark-elevated text-white font-semibold"
                        : "text-stone-600 dark:text-dark-text-secondary hover:bg-stone-100 dark:hover:bg-dark-elevated"
                    }`}
                  >
                    All Categories
                  </Link>
                  {categories.map((c) => {
                    const active = searchParams.category === c.slug || searchParams.category === c.id;
                    return (
                      <Link
                        key={c.id}
                        href={`/explore?${new URLSearchParams({ ...searchParams, category: c.slug }).toString()}`}
                        className={`block px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                          active
                            ? "bg-stone-900 dark:bg-dark-elevated text-white font-semibold"
                            : "text-stone-600 dark:text-dark-text-secondary hover:bg-stone-100 dark:hover:bg-dark-elevated"
                        }`}
                      >
                        {c.name}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Location Filter */}
              <div className="py-4 border-b border-stone-100 dark:border-dark-border">
                <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-dark-text-secondary mb-2.5">
                  City Location
                </p>
                <div className="space-y-1 text-xs">
                  {["Bangalore", "Mumbai", "Delhi NCR", "Hyderabad"].map((city) => {
                    const active = searchParams.city === city;
                    return (
                      <Link
                        key={city}
                        href={`/explore?${new URLSearchParams({ ...searchParams, city: active ? "all" : city }).toString()}`}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg ${
                          active
                            ? "text-rose-700 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/40"
                            : "text-stone-600 dark:text-dark-text-secondary hover:text-stone-900 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-dark-elevated"
                        }`}
                      >
                        <span>{city}</span>
                        {active && <span className="text-[10px]">✓</span>}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Minimum Rating Filter */}
              <div className="py-4 border-b border-stone-100 dark:border-dark-border">
                <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-dark-text-secondary mb-2.5">
                  Vendor Rating
                </p>
                <div className="flex flex-wrap gap-2">
                  {[4.5, 4.0, 3.5].map((rate) => {
                    const active = searchParams.minRating === String(rate);
                    return (
                      <Link
                        key={rate}
                        href={`/explore?${new URLSearchParams({ ...searchParams, minRating: String(rate) }).toString()}`}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                          active
                            ? "bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-800 font-bold"
                            : "bg-white dark:bg-dark-surface text-stone-600 dark:text-dark-text-secondary border-stone-200 dark:border-dark-border hover:bg-stone-50 dark:hover:bg-dark-elevated"
                        }`}
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> {rate}+
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Sort By */}
              <div className="pt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-dark-text-secondary mb-2">
                  Sort Order
                </p>
                <div className="space-y-1 text-xs">
                  <Link
                    href={`/explore?${new URLSearchParams({ ...searchParams, sort: "rating" }).toString()}`}
                    className={`block px-2.5 py-1.5 rounded-lg ${
                      !searchParams.sort || searchParams.sort === "rating"
                        ? "text-rose-700 dark:text-rose-400 font-bold"
                        : "text-stone-600 dark:text-dark-text-secondary hover:text-stone-900 dark:hover:text-white"
                    }`}
                  >
                    Top Rated First
                  </Link>
                  <Link
                    href={`/explore?${new URLSearchParams({ ...searchParams, sort: "price_asc" }).toString()}`}
                    className={`block px-2.5 py-1.5 rounded-lg ${
                      searchParams.sort === "price_asc"
                        ? "text-rose-700 dark:text-rose-400 font-bold"
                        : "text-stone-600 dark:text-dark-text-secondary hover:text-stone-900 dark:hover:text-white"
                    }`}
                  >
                    Price: Low to High
                  </Link>
                  <Link
                    href={`/explore?${new URLSearchParams({ ...searchParams, sort: "price_desc" }).toString()}`}
                    className={`block px-2.5 py-1.5 rounded-lg ${
                      searchParams.sort === "price_desc"
                        ? "text-rose-700 dark:text-rose-400 font-bold"
                        : "text-stone-600 dark:text-dark-text-secondary hover:text-stone-900 dark:hover:text-white"
                    }`}
                  >
                    Price: High to Low
                  </Link>
                </div>
              </div>
            </Card>

            <div className="p-5 rounded-2xl bg-warm-100/60 dark:bg-dark-surface border border-stone-200/80 dark:border-dark-border text-xs text-stone-600 dark:text-dark-text-secondary">
              <h5 className="font-bold text-stone-900 dark:text-dark-text-primary mb-1">Looking to plan an event?</h5>
              <p className="text-[11px] text-stone-500 dark:text-dark-text-secondary mb-3">
                Use our guided 5-step celebration planner to discover matching vendors across all your required categories.
              </p>
              <Link href="/plan">
                <Button variant="primary" size="sm" className="w-full text-xs">
                  <Sparkles className="w-3.5 h-3.5 mr-1" /> Plan My Celebration
                </Button>
              </Link>
            </div>
          </aside>

          {/* Service Results Grid */}
          <div className="lg:col-span-3">
            <div className="mb-4 flex items-center justify-between text-xs text-stone-500 dark:text-dark-text-secondary">
              <p>
                Found <span className="font-bold text-stone-900 dark:text-dark-text-primary">{services.length}</span> verified services
              </p>
            </div>

            {services.length === 0 ? (
              <EmptyState
                icon={<Search className="w-6 h-6" />}
                title="No vendors match your filters"
                description="Try loosening your search criteria, selecting another occasion, or exploring all celebration categories."
                action={
                  <Link href="/explore">
                    <Button variant="secondary" size="sm">
                      Reset All Filters
                    </Button>
                  </Link>
                }
              />
            ) : (
              <ExploreGridClient services={services} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
