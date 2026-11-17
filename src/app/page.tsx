import Link from "next/link";
import Navbar from "@/components/Navbar";
import prisma from "@/lib/prisma";
import {
  Camera,
  UtensilsCrossed,
  Cake,
  Palette,
  Gift,
  ArrowRight,
  ShieldCheck,
  Clock,
  FileCheck2,
  Star,
  Search,
  MapPin,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";

export default async function HomePage() {
  const [categories, featuredServices, templates] = await Promise.all([
    prisma.vendorCategory.findMany({ where: { isActive: true } }),
    prisma.service.findMany({
      where: { status: "PUBLISHED", vendor: { verificationStatus: "VERIFIED" } },
      include: {
        category: true,
        vendor: true,
        packages: true,
        images: { take: 1 },
      },
      take: 6,
    }),
    prisma.eventTemplate.findMany({ where: { isActive: true }, take: 3 }),
  ]);

  const categoryIcons: Record<string, any> = {
    "photography-editing": Camera,
    "catering-services": UtensilsCrossed,
    "bakeries-cloud-kitchens": Cake,
    "decoration-services": Palette,
    "celebration-items": Gift,
  };

  const formatPrice = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;

  return (
    <div className="min-h-screen bg-warm-50 flex flex-col font-sans text-stone-800">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative pt-16 pb-24 border-b border-stone-200/70 bg-gradient-to-b from-warm-100/60 to-warm-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {/* Trust Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-stone-200 shadow-sm text-xs font-semibold text-stone-700 mb-6">
              <span className="w-2 h-2 rounded-full bg-rose-600" />
              India&apos;s Curated Milestone Celebration Marketplace
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl font-serif font-bold text-stone-900 tracking-tight leading-[1.15] max-w-4xl mx-auto">
              Curated Event Artisans for Your Most{" "}
              <span className="italic text-rose-700">Cherished Moments</span>
            </h1>

            {/* Subheading */}
            <p className="mt-5 text-base sm:text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed">
              Book vetted candid cinematographers, royal dining caterers, bespoke patisseries, and luxury venue stylists with guaranteed 2-hour response commitments.
            </p>

            {/* Quick Filter Search Bar */}
            <div className="mt-10 max-w-3xl mx-auto bg-white p-2.5 rounded-2xl shadow-premium border border-stone-200 flex flex-col sm:flex-row items-center gap-2">
              <div className="flex-1 w-full flex items-center gap-3 px-3.5 py-2 border-b sm:border-b-0 sm:border-r border-stone-100">
                <Search className="w-4 h-4 text-stone-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Photography, floral decor, cakes..."
                  className="w-full text-sm text-stone-900 placeholder-stone-400 focus:outline-none bg-transparent"
                  readOnly
                />
              </div>

              <div className="w-full sm:w-48 flex items-center gap-2 px-3 py-2 border-b sm:border-b-0 sm:border-r border-stone-100">
                <MapPin className="w-4 h-4 text-stone-400 shrink-0" />
                <span className="text-sm font-medium text-stone-700">Bangalore, IN</span>
              </div>

              <Link href="/explore" className="w-full sm:w-auto">
                <Button variant="primary" size="md" className="w-full sm:w-auto whitespace-nowrap">
                  Find Artisans
                </Button>
              </Link>
            </div>

            {/* Trust Metric Badges */}
            <div className="mt-14 pt-10 border-t border-stone-200/60 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto text-left">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200/80 flex items-center justify-center text-stone-800 shrink-0">
                  <ShieldCheck className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-900">100% Verified Vendors</h4>
                  <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
                    Identity, PAN, GSTIN and portfolio authenticity screened before activation.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200/80 flex items-center justify-center text-stone-800 shrink-0">
                  <Clock className="w-5 h-5 text-rose-700" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-900">2-Hour Response SLA</h4>
                  <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
                    Vendors are bound to respond within 2 hours or requests lapse cleanly.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200/80 flex items-center justify-center text-stone-800 shrink-0">
                  <FileCheck2 className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-900">Milestone Legal Invoices</h4>
                  <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
                    Clear transaction receipts for Advance (Doc 1) and Final balance (Doc 2).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CURATED CATEGORIES */}
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest font-bold text-stone-500">Categories</p>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight mt-1">
                Explore Event Disciplines
              </h2>
            </div>
            <Link
              href="/explore"
              className="text-sm font-semibold text-rose-700 hover:text-rose-800 flex items-center gap-1.5 transition-colors"
            >
              Browse all categories <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {categories.map((cat) => {
              const Icon = categoryIcons[cat.slug] || Sparkles;
              return (
                <Link key={cat.id} href={`/explore?category=${cat.id}`} className="group">
                  <Card hoverEffect className="h-full p-6 flex flex-col justify-between">
                    <div>
                      <div className="w-11 h-11 rounded-xl bg-stone-100 border border-stone-200/70 text-stone-800 flex items-center justify-center mb-4 transition-colors group-hover:bg-rose-50 group-hover:text-rose-700 group-hover:border-rose-200">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-stone-900 text-sm group-hover:text-rose-700 transition-colors">
                        {cat.name}
                      </h3>
                      <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                        {cat.description}
                      </p>
                    </div>
                    <span className="mt-4 text-[11px] font-semibold text-stone-400 group-hover:text-rose-600 transition-colors flex items-center gap-1">
                      View Listings <ArrowRight className="w-3 h-3" />
                    </span>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        {/* FEATURED ARTISANS */}
        <section className="py-20 bg-warm-100/50 border-y border-stone-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
              <div>
                <p className="text-xs uppercase tracking-widest font-bold text-stone-500">Verified Marketplace</p>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight mt-1">
                  Premier Celebration Services
                </h2>
              </div>
              <Link
                href="/explore"
                className="text-sm font-semibold text-rose-700 hover:text-rose-800 flex items-center gap-1.5 transition-colors"
              >
                View all available services <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredServices.map((service) => (
                <Card key={service.id} hoverEffect className="flex flex-col justify-between">
                  <div>
                    {/* Media / Image placeholder */}
                    <div className="h-48 w-full bg-stone-200 relative overflow-hidden">
                      {service.images[0] ? (
                        <img
                          src={service.images[0].imageUrl}
                          alt={service.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-stone-100 text-stone-400">
                          <Sparkles className="w-8 h-8 mb-1" />
                          <span className="text-xs font-medium">Curated Artisan Portfolio</span>
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <Badge variant="neutral" size="sm" className="bg-white/95 backdrop-blur-sm shadow-sm font-medium">
                          {service.category.name}
                        </Badge>
                      </div>
                      <div className="absolute top-3 right-3">
                        <Badge variant="success" size="sm" dot>
                          Verified
                        </Badge>
                      </div>
                    </div>

                    <CardContent className="p-6">
                      <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
                        <span className="font-semibold text-stone-800">{service.vendor.businessName}</span>
                        <div className="flex items-center gap-1 text-amber-700 font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          <span>{service.vendor.rating.toFixed(1)}</span>
                          <span className="text-stone-400 font-normal">({service.vendor.reviewCount})</span>
                        </div>
                      </div>

                      <h3 className="font-serif font-bold text-base text-stone-900 leading-snug line-clamp-1">
                        {service.title}
                      </h3>
                      <p className="text-xs text-stone-500 mt-2 line-clamp-2 leading-relaxed">
                        {service.description}
                      </p>
                    </CardContent>
                  </div>

                  <div className="px-6 py-4 bg-stone-50/60 border-t border-stone-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Packages From</p>
                      <p className="text-base font-bold text-stone-900">
                        {formatPrice(service.packages[0]?.price || service.basePrice)}
                      </p>
                    </div>

                    <Link href={`/services/${service.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CELEBRATION BLUEPRINTS */}
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <p className="text-xs uppercase tracking-widest font-bold text-stone-500">Structured Planning</p>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight mt-1">
              Curated Celebration Blueprints
            </h2>
            <p className="text-sm text-stone-600 mt-2 leading-relaxed">
              Skip decision fatigue. Use battle-tested milestone blueprints pre-configured with recommended budgets, service checklists, and milestone checkpoints.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {templates.map((tpl) => (
              <Card key={tpl.id} hoverEffect className="p-7 flex flex-col justify-between">
                <div>
                  <Badge variant="champagne" size="sm" className="mb-4">
                    {tpl.category}
                  </Badge>
                  <h3 className="text-lg font-serif font-bold text-stone-900 leading-snug">{tpl.name}</h3>
                  <p className="text-xs text-stone-600 mt-2.5 leading-relaxed line-clamp-3">
                    {tpl.description}
                  </p>

                  <div className="mt-6 pt-5 border-t border-stone-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase tracking-wider font-semibold">
                        Suggested Budget
                      </span>
                      <span className="font-bold text-stone-900">
                        {formatPrice(tpl.suggestedBudgetMin)} – {formatPrice(tpl.suggestedBudgetMax)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-stone-400 block text-[10px] uppercase tracking-wider font-semibold">
                        Guest Capacity
                      </span>
                      <span className="font-bold text-stone-900">~{tpl.defaultGuestCount} Guests</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <Link href={`/customer/events?template=${tpl.slug}`}>
                    <Button variant="secondary" size="sm" className="w-full">
                      Use Blueprint
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="py-20 bg-stone-900 text-stone-100 border-t border-stone-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <p className="text-xs uppercase tracking-widest font-bold text-amber-300">Predictable Experience</p>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight mt-1">
                How Celebrating YOU Protects Your Event
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-8 text-center sm:text-left">
              <div className="p-4">
                <span className="font-serif text-3xl font-bold text-rose-500">01</span>
                <h4 className="text-base font-bold text-white mt-2">Discover & Shortlist</h4>
                <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                  Browse transparent service packages with explicit inclusions, exclusions, and verified photography.
                </p>
              </div>

              <div className="p-4">
                <span className="font-serif text-3xl font-bold text-rose-500">02</span>
                <h4 className="text-base font-bold text-white mt-2">2-Hour Vendor SLA</h4>
                <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                  Vendors have an exact 2-hour window to review your dates and requirements before automated auto-expiry.
                </p>
              </div>

              <div className="p-4">
                <span className="font-serif text-3xl font-bold text-rose-500">03</span>
                <h4 className="text-base font-bold text-white mt-2">Advance Milestone</h4>
                <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                  Lock your slot by clearing the advance deposit. Direct contact details unlock and Document 1 is generated.
                </p>
              </div>

              <div className="p-4">
                <span className="font-serif text-3xl font-bold text-rose-500">04</span>
                <h4 className="text-base font-bold text-white mt-2">Fulfillment & Final Invoice</h4>
                <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                  Upon completion, settle the remaining balance and download Document 2 (Final Tax Invoice).
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-stone-950 text-stone-400 text-xs border-t border-stone-800/80 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-stone-900 text-amber-200 border border-stone-800 flex items-center justify-center font-serif font-bold text-xs">
              CY
            </div>
            <div>
              <p className="font-serif font-bold text-stone-200 text-sm">Celebrating YOU</p>
              <p className="text-[11px] text-stone-500">Curated Milestone Celebration Platform &copy; 2026</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-stone-400">
            <Link href="/explore" className="hover:text-stone-200 transition-colors">Artisan Directory</Link>
            <Link href="/templates" className="hover:text-stone-200 transition-colors">Event Blueprints</Link>
            <Link href="/login" className="hover:text-stone-200 transition-colors">Client Sign In</Link>
            <Link href="/login" className="hover:text-stone-200 transition-colors">Vendor Access</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
