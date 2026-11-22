import Link from "next/link";
import Navbar from "@/components/Navbar";
import prisma from "@/lib/prisma";
import { isDatabaseUnavailableError } from "@/lib/dbErrors";
import {
  Camera,
  UtensilsCrossed,
  Cake,
  Palette,
  Gift,
  Building2,
  Sparkles,
  Music,
  Mail,
  Heart,
  ArrowRight,
  ShieldCheck,
  Clock,
  FileCheck2,
  Star,
  Search,
  MapPin,
  Calendar,
  CheckCircle2,
  FolderCheck,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import BudgetInspirationSection from "@/components/BudgetInspirationSection";
import PremierVendorsSection from "@/components/PremierVendorsSection";
import { ensureDemoData } from "@/lib/ensureDemoData";
import { getCompanySettings } from "@/lib/companySettings";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let categories: any[] = [];
  let featuredServices: any[] = [];
  let templates: any[] = [];
  const companySettings = await getCompanySettings();

  try {
    let [fetchedCategories, fetchedServices, fetchedTemplates] = await Promise.all([
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
      prisma.eventTemplate.findMany({ where: { isActive: true }, take: 8 }),
    ]);

    // If production database has 0 templates or categories, auto-seed idempotently
    if (fetchedCategories.length === 0 || fetchedTemplates.length === 0) {
      await ensureDemoData();
      [fetchedCategories, fetchedServices, fetchedTemplates] = await Promise.all([
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
        prisma.eventTemplate.findMany({ where: { isActive: true }, take: 8 }),
      ]);
    }

    categories = fetchedCategories;
    featuredServices = fetchedServices;
    templates = fetchedTemplates;
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      console.warn("[HomePage] Database uninitialized or unavailable. Rendering with graceful empty states.");
    } else {
      throw error;
    }
  }

  const categoryIcons: Record<string, any> = {
    "photography-editing": Camera,
    "photography-videography": Camera,
    "catering-services": UtensilsCrossed,
    "bakeries-cloud-kitchens": Cake,
    "cakes-desserts": Cake,
    "decoration-services": Palette,
    "celebration-items": Gift,
    "celebration-essentials": Gift,
    "venues": Building2,
    "makeup-beauty": Sparkles,
    "music-entertainment": Music,
    "invitations": Mail,
  };

  const OCCASIONS = [
    {
      title: "Birthday",
      slug: "Birthday",
      description: "Candid photography, whimsical theme décor, custom celebration cakes & party entertainment.",
      image: "https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=800&auto=format&fit=crop",
      tag: "Top Celebrated",
    },
    {
      title: "Wedding",
      slug: "Wedding",
      description: "Grand mandap styling, royal banquet catering, bridal beauty & cinematic memories.",
      image: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop",
      tag: "Grand Milestones",
    },
    {
      title: "Engagement",
      slug: "Engagement",
      description: "Floral ring ceremony backdrops, intimate cocktail dining & emotional family portraits.",
      image: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=800&auto=format&fit=crop",
      tag: "Romantic",
    },
    {
      title: "Anniversary",
      slug: "Anniversary",
      description: "Candlelight dining spreads, live acoustic musicians, memory photo albums & floral arrangements.",
      image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=800&auto=format&fit=crop",
      tag: "Timeless",
    },
    {
      title: "Baby Shower",
      slug: "Baby Shower",
      description: "Pastel balloon installations, custom dessert spreads & gentle mom-to-be pampering setups.",
      image: "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=800&auto=format&fit=crop",
      tag: "Cherished",
    },
    {
      title: "Housewarming",
      slug: "Housewarming",
      description: "Auspicious traditional pooja florals, welcome dining catering & traditional welcoming décor.",
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800&auto=format&fit=crop",
      tag: "New Beginnings",
    },
    {
      title: "Graduation",
      slug: "Graduation",
      description: "Milestone portraits, celebratory party buffets, sound & DJ setups, and customized graduation cakes.",
      image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800&auto=format&fit=crop",
      tag: "Achievement",
    },
    {
      title: "Corporate Celebration",
      slug: "Corporate Event",
      description: "Professional audio-visual staging, high-tea banquet catering & corporate event coverage.",
      image: "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=800&auto=format&fit=crop",
      tag: "Professional",
    },
    {
      title: "Festival Celebration",
      slug: "Festival Celebration",
      description: "Traditional festival lighting, authentic festive sweets and snacks, folk decor & vibrant celebrations.",
      image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop",
      tag: "Festive Joy",
    },
    {
      title: "Other Special Occasion",
      slug: "Special Occasion",
      description: "Retirement, reunion, achievements, or bespoke family milestones tailored to your exact vision.",
      image: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?q=80&w=800&auto=format&fit=crop",
      tag: "Bespoke",
    },
  ];

  const formatPrice = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-dark-bg flex flex-col font-sans text-stone-800 dark:text-dark-text-primary transition-colors duration-200">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative pt-16 pb-24 border-b border-stone-200/70 dark:border-dark-border bg-gradient-to-b from-warm-100/70 via-warm-50 to-warm-50 dark:from-dark-surface/60 dark:via-dark-bg dark:to-dark-bg transition-colors duration-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {/* Brand Promise Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-dark-elevated border border-stone-200 dark:border-dark-border shadow-sm text-xs font-semibold text-stone-700 dark:text-dark-text-secondary mb-6">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
              Every Celebration. One Place.
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-bold text-stone-900 dark:text-dark-text-primary tracking-tight leading-[1.1] max-w-4xl mx-auto">
              Let&apos;s Celebrate <span className="italic text-rose-700 dark:text-rose-400">Together.</span>
            </h1>

            {/* Subheading */}
            <p className="mt-6 text-base sm:text-lg text-stone-600 dark:text-dark-text-secondary max-w-2xl mx-auto leading-relaxed">
              Plan your special moments, discover trusted vendors and keep every beautiful memory in one place.
            </p>

            {/* Primary & Secondary CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/plan" className="w-full sm:w-auto">
                <Button variant="primary" size="lg" className="w-full sm:w-auto px-8 py-3.5 text-sm font-bold shadow-premium">
                  Plan Celebration
                </Button>
              </Link>
              <Link href="/explore" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 py-3.5 text-sm font-semibold">
                  Explore Services
                </Button>
              </Link>
            </div>

            {/* Quick Filter Search Bar */}
            <div className="mt-12 max-w-3xl mx-auto bg-white dark:bg-dark-surface p-2.5 rounded-2xl shadow-premium border border-stone-200/90 dark:border-dark-border flex flex-col sm:flex-row items-center gap-2">
              <div className="flex-1 w-full flex items-center gap-3 px-3.5 py-2 border-b sm:border-b-0 sm:border-r border-stone-100 dark:border-dark-border">
                <Search className="w-4 h-4 text-stone-400 dark:text-stone-500 shrink-0" />
                <input
                  type="text"
                  placeholder="Photography, catering, theme décor, custom cakes..."
                  className="w-full text-sm text-stone-900 dark:text-dark-text-primary placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none bg-transparent"
                  readOnly
                />
              </div>

              <div className="w-full sm:w-48 flex items-center gap-2 px-3 py-2 border-b sm:border-b-0 sm:border-r border-stone-100 dark:border-dark-border">
                <MapPin className="w-4 h-4 text-stone-400 dark:text-stone-500 shrink-0" />
                <span className="text-sm font-medium text-stone-700 dark:text-dark-text-primary">Bangalore, IN</span>
              </div>

              <Link href="/explore" className="w-full sm:w-auto">
                <Button variant="primary" size="md" className="w-full sm:w-auto whitespace-nowrap">
                  Find Vendors
                </Button>
              </Link>
            </div>

            {/* Trust Metric Badges */}
            <div className="mt-14 pt-10 border-t border-stone-200/60 dark:border-dark-border grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto text-left">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-dark-surface border border-stone-200 dark:border-dark-border shadow-sm flex items-center justify-center text-stone-800 dark:text-dark-text-primary shrink-0">
                  <ShieldCheck className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-900 dark:text-dark-text-primary">100% Verified Vendors</h4>
                  <p className="text-xs text-stone-500 dark:text-dark-text-secondary mt-0.5 leading-relaxed">
                    Identity, PAN, GSTIN and portfolio authenticity screened before activation.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-dark-surface border border-stone-200 dark:border-dark-border shadow-sm flex items-center justify-center text-stone-800 dark:text-dark-text-primary shrink-0">
                  <Clock className="w-5 h-5 text-rose-700 dark:text-rose-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-900 dark:text-dark-text-primary">2-Hour Response SLA</h4>
                  <p className="text-xs text-stone-500 dark:text-dark-text-secondary mt-0.5 leading-relaxed">
                    Vendors are bound to respond within 2 hours or requests lapse cleanly.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-dark-surface border border-stone-200 dark:border-dark-border shadow-sm flex items-center justify-center text-stone-800 dark:text-dark-text-primary shrink-0">
                  <FileCheck2 className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-900 dark:text-dark-text-primary">Milestone Legal Invoices</h4>
                  <p className="text-xs text-stone-500 dark:text-dark-text-secondary mt-0.5 leading-relaxed">
                    Separate transaction receipts for Advance (Doc 1) and Final balance (Doc 2).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* OCCASION DISCOVERY SECTION: "What are you celebrating?" */}
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <p className="text-xs uppercase tracking-widest font-bold text-rose-700 dark:text-rose-400">Occasion-First Discovery</p>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 dark:text-dark-text-primary tracking-tight mt-1.5">
              What are you celebrating?
            </h2>
            <p className="text-sm text-stone-600 dark:text-dark-text-secondary mt-2.5 leading-relaxed">
              Every milestone has its own heartbeat. Select your celebration to explore tailored services, curated templates, and recommended vendors.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {OCCASIONS.map((occ) => (
              <Link
                key={occ.title}
                href={`/plan?occasion=${encodeURIComponent(occ.slug)}`}
                className="group relative rounded-2xl overflow-hidden border border-stone-200 dark:border-dark-border bg-white dark:bg-dark-surface hover:border-rose-300 dark:hover:border-rose-700 hover:shadow-premium transition-all duration-300 flex flex-col justify-between"
              >
                {/* Occasion Image */}
                <div className="h-44 w-full relative overflow-hidden bg-stone-100">
                  <img
                    src={occ.image}
                    alt={occ.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-stone-950/20 to-transparent" />
                  <div className="absolute top-3 left-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-sm text-stone-800">
                      {occ.tag}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="font-serif font-bold text-lg text-white group-hover:text-amber-200 transition-colors">
                      {occ.title}
                    </h3>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <p className="text-xs text-stone-600 dark:text-dark-text-secondary line-clamp-2 leading-relaxed">
                    {occ.description}
                  </p>
                  <span className="mt-3 text-xs font-semibold text-rose-700 dark:text-rose-400 group-hover:text-rose-800 dark:group-hover:text-rose-300 flex items-center gap-1 transition-colors">
                    Plan this celebration <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* CELEBRATION PLANNING SECTION: 5 Steps */}
        <section className="py-20 bg-stone-900 text-stone-100 border-y border-stone-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mb-16">
              <p className="text-xs uppercase tracking-widest font-bold text-amber-300">
                Centralized Celebration Management
              </p>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight mt-1.5">
                Bring your celebration to life, one detail at a time.
              </h2>
              <p className="text-sm text-stone-400 mt-3 leading-relaxed">
                Planning special moments shouldn&apos;t mean juggling ten different WhatsApp chats, unverified quotes, and uncertain bookings. Here is how Celebrating YOU simplifies your journey:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="p-5 rounded-2xl bg-stone-800/60 border border-stone-700/80 flex flex-col justify-between">
                <div>
                  <span className="font-serif text-3xl font-bold text-rose-500">01</span>
                  <h4 className="text-base font-bold text-white mt-3">Tell us what you&apos;re celebrating</h4>
                  <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                    Choose your occasion, celebration date, location, guest capacity, and overall target budget.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-stone-700/50 text-[11px] text-stone-500">
                  Step 1: Occasion & Vision
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-stone-800/60 border border-stone-700/80 flex flex-col justify-between">
                <div>
                  <span className="font-serif text-3xl font-bold text-rose-500">02</span>
                  <h4 className="text-base font-bold text-white mt-3">Discover matching services</h4>
                  <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                    Select exactly what you need—photography, décor, catering, custom cake, or entertainment.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-stone-700/50 text-[11px] text-stone-500">
                  Step 2: Service Selection
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-stone-800/60 border border-stone-700/80 flex flex-col justify-between">
                <div>
                  <span className="font-serif text-3xl font-bold text-rose-500">03</span>
                  <h4 className="text-base font-bold text-white mt-3">Choose the vendors you love</h4>
                  <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                    Review transparent package pricing, clear inclusions, verified portfolios, and authentic customer feedback.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-stone-700/50 text-[11px] text-stone-500">
                  Step 3: Vendor Curation
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-stone-800/60 border border-stone-700/80 flex flex-col justify-between">
                <div>
                  <span className="font-serif text-3xl font-bold text-rose-500">04</span>
                  <h4 className="text-base font-bold text-white mt-3">Manage bookings & payments</h4>
                  <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                    Enjoy guaranteed 2-hour response commitments. Pay advance and final balances with official milestone receipts.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-stone-700/50 text-[11px] text-stone-500">
                  Step 4: Milestone Contracts
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-stone-800/60 border border-stone-700/80 flex flex-col justify-between">
                <div>
                  <span className="font-serif text-3xl font-bold text-rose-500">05</span>
                  <h4 className="text-base font-bold text-white mt-3">Enjoy your celebration</h4>
                  <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                    Coordinate your celebration timeline with ease. Focus on your guests and cherished memories.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-stone-700/50 text-[11px] text-stone-500">
                  Step 5: Celebration Day
                </div>
              </div>
            </div>

            <div className="mt-12 text-center">
              <Link href="/plan">
                <Button variant="champagne" size="lg" className="shadow-premium">
                  Plan Celebration
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* SERVICE DISCOVERY SECTION: "Everything your celebration needs." */}
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest font-bold text-stone-500">Service Categories</p>
              <h2 className="text-2xl sm:text-4xl font-serif font-bold text-stone-900 tracking-tight mt-1.5">
                Everything your celebration needs.
              </h2>
              <p className="text-sm text-stone-600 mt-2 leading-relaxed">
                Book individual service specialists independently with zero forced packages.
              </p>
            </div>
            <Link
              href="/explore"
              className="text-sm font-semibold text-rose-700 hover:text-rose-800 flex items-center gap-1.5 transition-colors"
            >
              Browse all categories <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                title: "Photography & Videography",
                description: "Candid portraits, traditional coverage, drone cinematography, and instant editing labs.",
                icon: Camera,
                slug: "photography-editing",
              },
              {
                title: "Decoration",
                description: "Theme balloon styling, floral mandaps, fairy lighting, backdrop stages, and entrance arches.",
                icon: Palette,
                slug: "decoration-services",
              },
              {
                title: "Catering",
                description: "Multi-cuisine buffets, royal dining spreads, live chaat counters, and regional delicacies.",
                icon: UtensilsCrossed,
                slug: "catering-services",
              },
              {
                title: "Cakes & Desserts",
                description: "Custom multi-tier fondant cakes, dessert tables, gourmet pastries, and sweet boxes.",
                icon: Cake,
                slug: "bakeries-cloud-kitchens",
              },
              {
                title: "Venues",
                description: "Intimate banquet halls, open lawn farms, boutique rooftops, and private party spaces.",
                icon: Building2,
                slug: "venues",
              },
              {
                title: "Makeup & Beauty",
                description: "Bridal makeovers, family grooming, pre-event spa packages, and hairstyling artists.",
                icon: Sparkles,
                slug: "makeup-beauty",
              },
              {
                title: "Music & Entertainment",
                description: "Live acoustic musicians, celebration DJs, emcees, magicians, and cultural performers.",
                icon: Music,
                slug: "music-entertainment",
              },
              {
                title: "Invitations",
                description: "Digital animated invites, luxury printed stationery, custom event websites, and save-the-dates.",
                icon: Mail,
                slug: "invitations",
              },
              {
                title: "Celebration Essentials",
                description: "Personalized party favors, return gifts, floral varmalas, photo props, and welcome kits.",
                icon: Gift,
                slug: "celebration-items",
              },
            ].map((cat) => {
              const Icon = cat.icon;
              return (
                <Link key={cat.title} href={`/explore?category=${cat.slug}`} className="group">
                  <Card hoverEffect className="h-full p-6 flex flex-col justify-between">
                    <div>
                      <div className="w-12 h-12 rounded-xl bg-warm-100 dark:bg-dark-elevated border border-stone-200/80 dark:border-dark-border text-stone-800 dark:text-dark-text-primary flex items-center justify-center mb-4 transition-colors group-hover:bg-rose-50 dark:group-hover:bg-rose-950/40 group-hover:text-rose-700 dark:group-hover:text-rose-400 group-hover:border-rose-200 dark:group-hover:border-rose-800">
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-stone-900 dark:text-dark-text-primary text-base group-hover:text-rose-700 dark:group-hover:text-rose-400 transition-colors">
                        {cat.title}
                      </h3>
                      <p className="text-xs text-stone-500 dark:text-dark-text-secondary mt-2 line-clamp-2 leading-relaxed">
                        {cat.description}
                      </p>
                    </div>
                    <span className="mt-5 text-xs font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Explore Vendors <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        {/* PREMIER CELEBRATION VENDORS */}
        <PremierVendorsSection services={featuredServices} />

        {/* BUDGET-CONSCIOUS INSPIRATION: Interactive Widget */}
        <BudgetInspirationSection services={featuredServices} />

        {/* FINAL CTA SECTION */}
        <section className="py-20 bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white text-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl sm:text-5xl font-serif font-bold tracking-tight">
              Your celebration deserves to be effortless.
            </h2>
            <p className="mt-4 text-sm sm:text-base text-stone-300 max-w-xl mx-auto leading-relaxed">
              Start planning today. Bring together the photographers, decorators, caterers, and venues you love in one unified celebration marketplace.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/plan">
                <Button variant="champagne" size="lg" className="px-8 py-3.5 shadow-premium">
                  Plan Celebration
                </Button>
              </Link>
              <Link href="/explore">
                <Button variant="outline" size="lg" className="border-stone-700 text-stone-200 hover:text-white hover:bg-stone-800 px-8 py-3.5">
                  Explore Services
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-stone-950 text-stone-400 text-xs border-t border-stone-800/80 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-stone-800/60">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-stone-900 text-amber-200 border border-stone-800 flex items-center justify-center font-serif font-bold text-xs">
                  CY
                </div>
                <span className="font-serif font-bold text-stone-200 text-base">Celebrating YOU</span>
              </div>
              <p className="text-[11px] text-stone-400 mt-2.5 leading-relaxed">
                Every Celebration. One Place. Connecting customers with verified event service providers through one unified celebration marketplace.
              </p>
              <div className="mt-3.5 space-y-1 text-[11px] text-stone-400">
                <p>Support: <span className="text-stone-300">{companySettings.companyEmail}</span></p>
                <p>Helpline: <span className="text-stone-300">{companySettings.companyPhone}</span></p>
                <p className="text-stone-500 line-clamp-1">{companySettings.companyAddress}</p>
              </div>
            </div>

            <div>
              <h5 className="font-bold text-stone-200 text-xs uppercase tracking-wider mb-3">Plan Celebrations</h5>
              <ul className="space-y-2 text-stone-400">
                <li><Link href="/plan?occasion=Birthday" className="hover:text-stone-200">Birthday Celebrations</Link></li>
                <li><Link href="/plan?occasion=Wedding" className="hover:text-stone-200">Weddings & Engagements</Link></li>
                <li><Link href="/plan?occasion=Anniversary" className="hover:text-stone-200">Milestone Anniversaries</Link></li>
                <li><Link href="/plan?occasion=Baby%20Shower" className="hover:text-stone-200">Baby Showers</Link></li>
                <li><Link href="/plan?occasion=Housewarming" className="hover:text-stone-200">Housewarming Celebrations</Link></li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-stone-200 text-xs uppercase tracking-wider mb-3">Explore Marketplace</h5>
              <ul className="space-y-2 text-stone-400">
                <li><Link href="/explore?category=photography-editing" className="hover:text-stone-200">Photography & Film</Link></li>
                <li><Link href="/explore?category=decoration-services" className="hover:text-stone-200">Celebration Décor</Link></li>
                <li><Link href="/explore?category=catering-services" className="hover:text-stone-200">Catering & Dining</Link></li>
                <li><Link href="/explore?category=bakeries-cloud-kitchens" className="hover:text-stone-200">Custom Cakes</Link></li>
                <li><Link href="/templates" className="hover:text-stone-200">Celebration Blueprints</Link></li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-stone-200 text-xs uppercase tracking-wider mb-3">Portals & Trust</h5>
              <ul className="space-y-2 text-stone-400">
                <li><Link href="/login" className="hover:text-stone-200">Customer Sign In</Link></li>
                <li><Link href="/login" className="hover:text-stone-200">Vendor Workspace</Link></li>
                <li><Link href="/admin-portal/login" className="hover:text-stone-200">Admin Portal</Link></li>
                <li><span className="text-stone-500">2-Hour Vendor Response SLA</span></li>
                <li><span className="text-stone-500">Legal Milestone Invoices</span></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-stone-500 text-[11px] gap-3">
            <p>&copy; 2026 Celebrating YOU Technologies. All rights reserved.</p>
            <p>You Imagine the Celebration. We Bring Everything Together.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
