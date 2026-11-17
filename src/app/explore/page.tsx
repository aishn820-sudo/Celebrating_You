import Navbar from "@/components/Navbar";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Star, ShieldCheck, Filter, ArrowRight, Search, Clock, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import ExploreGridClient from "./ExploreGridClient";

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: {
    category?: string;
    city?: string;
    search?: string;
    maxBudget?: string;
    minRating?: string;
    sort?: string;
  };
}) {
  const categories = await prisma.vendorCategory.findMany({ where: { isActive: true } });

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

  if (searchParams.city) {
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

  const services = await prisma.service.findMany({
    where,
    include: {
      category: true,
      vendor: true,
      packages: true,
      images: { take: 1 },
    },
    orderBy,
  });

  const formatPrice = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;

  return (
    <div className="min-h-screen bg-warm-50 flex flex-col font-sans text-stone-800">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        {/* Page Header */}
        <div className="mb-8">
          <Badge variant="rose" size="sm" className="mb-2">
            Verified Artisan Marketplace
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 tracking-tight">
            Explore Celebration Specialists
          </h1>
          <p className="text-sm text-stone-600 mt-1.5 max-w-2xl">
            Browse through background-screened vendors bound by our mandatory 2-hour response guarantee.
          </p>
        </div>

        {/* Layout: Sidebar Filter & Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                <span className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <Filter className="w-4 h-4 text-stone-500" /> Filters
                </span>
                <Link href="/explore" className="text-xs text-rose-700 hover:text-rose-800 font-semibold">
                  Reset
                </Link>
              </div>

              {/* Categories */}
              <div className="py-4 border-b border-stone-100">
                <p className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
                  Disciplines
                </p>
                <div className="space-y-1.5">
                  <Link
                    href={`/explore?${new URLSearchParams({ ...searchParams, category: "all" }).toString()}`}
                    className={`block px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                      !searchParams.category || searchParams.category === "all"
                        ? "bg-stone-900 text-white font-semibold"
                        : "text-stone-600 hover:bg-stone-100"
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
                            ? "bg-stone-900 text-white font-semibold"
                            : "text-stone-600 hover:bg-stone-100"
                        }`}
                      >
                        {c.name}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Minimum Rating Filter */}
              <div className="py-4 border-b border-stone-100">
                <p className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2.5">
                  Artisan Rating
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
                            ? "bg-amber-50 text-amber-900 border-amber-300 font-bold"
                            : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
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
                <p className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                  Sort Order
                </p>
                <div className="space-y-1 text-xs">
                  <Link
                    href={`/explore?${new URLSearchParams({ ...searchParams, sort: "rating" }).toString()}`}
                    className={`block px-2.5 py-1.5 rounded-lg ${
                      !searchParams.sort || searchParams.sort === "rating"
                        ? "text-rose-700 font-bold"
                        : "text-stone-600 hover:text-stone-900"
                    }`}
                  >
                    Top Rated First
                  </Link>
                  <Link
                    href={`/explore?${new URLSearchParams({ ...searchParams, sort: "price_asc" }).toString()}`}
                    className={`block px-2.5 py-1.5 rounded-lg ${
                      searchParams.sort === "price_asc"
                        ? "text-rose-700 font-bold"
                        : "text-stone-600 hover:text-stone-900"
                    }`}
                  >
                    Price: Low to High
                  </Link>
                  <Link
                    href={`/explore?${new URLSearchParams({ ...searchParams, sort: "price_desc" }).toString()}`}
                    className={`block px-2.5 py-1.5 rounded-lg ${
                      searchParams.sort === "price_desc"
                        ? "text-rose-700 font-bold"
                        : "text-stone-600 hover:text-stone-900"
                    }`}
                  >
                    Price: High to Low
                  </Link>
                </div>
              </div>
            </Card>
          </aside>

          {/* Service Results Grid */}
          <div className="lg:col-span-3">
            <div className="mb-4 flex items-center justify-between text-xs text-stone-500">
              <p>
                Found <span className="font-bold text-stone-900">{services.length}</span> curated services
              </p>
            </div>

            {services.length === 0 ? (
              <EmptyState
                icon={<Search className="w-6 h-6" />}
                title="No artisans match your filters"
                description="Try loosening your search criteria, adjusting maximum budget, or exploring all celebration categories."
                action={
                  <Link href="/explore">
                    <Button variant="secondary" size="sm">
                      Reset All Filters
                    </Button>
                  </Link>
                }
              />
            ) : (
              <ExploreGridClient services={services} formatPrice={formatPrice} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
