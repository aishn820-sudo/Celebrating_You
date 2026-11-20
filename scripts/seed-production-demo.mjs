import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function run() {
  console.log("====================================================");
  console.log("CELEBRATING YOU — PRODUCTION DEMO DATA SEED");
  console.log("====================================================");

  try {
    // 1. Categories
    const categoriesData = [
      {
        name: "Photography & Cinema",
        slug: "photography-videography",
        description: "Candid celebration photography, traditional portraits, cinematic event films, and pre-event shoots.",
        icon: "Camera",
        isActive: true,
      },
      {
        name: "Banquet & Buffet Catering",
        slug: "catering-services",
        description: "Multi-cuisine live counters, traditional festive banquets, hi-tea menus, and celebration feasts.",
        icon: "UtensilsCrossed",
        isActive: true,
      },
      {
        name: "Artisan Cakes & Desserts",
        slug: "cakes-bakeries",
        description: "Bespoke tier cakes, themed fondant wonders, dessert grazing tables, and artisan cupcakes.",
        icon: "Cake",
        isActive: true,
      },
      {
        name: "Thematic Event & Floral Décor",
        slug: "decoration-services",
        description: "Stage backdrops, balloon installations, luxury floral arrangements, entrance archways, and ambient lighting.",
        icon: "Palette",
        isActive: true,
      },
      {
        name: "Celebration Venues & Lawns",
        slug: "venues",
        description: "Intimate banquet halls, open-air garden lawns, terrace party spaces, and poolside celebration spots.",
        icon: "Building2",
        isActive: true,
      },
      {
        name: "Music, DJs & Performers",
        slug: "entertainment",
        description: "Live acoustic musicians, party DJs, emcees, magicians, and cultural performers.",
        icon: "Music",
        isActive: true,
      },
      {
        name: "Bridal & Party Hair & Makeup",
        slug: "makeup-beauty",
        description: "Professional party makeup, hairstyling, saree draping, and celebration makeover artists.",
        icon: "Sparkles",
        isActive: true,
      },
      {
        name: "Celebration Favors & Invites",
        slug: "celebration-services",
        description: "Custom digital invitations, personalized guest return gifts, celebratory props, and pooja essentials.",
        icon: "Gift",
        isActive: true,
      },
    ];

    const categoryMap = new Map();
    for (const cat of categoriesData) {
      const c = await prisma.vendorCategory.upsert({
        where: { slug: cat.slug },
        update: { isActive: true },
        create: cat,
      });
      categoryMap.set(cat.slug, c.id);
    }
    console.log(`✓ Ensured ${categoryMap.size} service categories.`);

    // 2. Customer Demo: priya@example.com / Customer@12345
    const customerPassword = await bcrypt.hash("Customer@12345", 10);
    const custUser = await prisma.user.upsert({
      where: { email: "priya@example.com" },
      update: { role: "CUSTOMER", isFirstLogin: false },
      create: {
        email: "priya@example.com",
        passwordHash: customerPassword,
        role: "CUSTOMER",
        isFirstLogin: false,
      },
    });

    const custProfile = await prisma.customer.findUnique({ where: { userId: custUser.id } });
    if (!custProfile) {
      await prisma.customer.create({
        data: {
          userId: custUser.id,
          name: "Priya Sharma",
          phone: "+91 99001 23456",
          email: "priya@example.com",
          address: "Flat 402, Sunshine Heights, Koramangala 4th Block",
          city: "Bangalore",
          state: "Karnataka",
          pincode: "560034",
        },
      });
    }
    console.log("✓ Customer demo account verified (priya@example.com).");

    // 3. Vendor Demo: studio@memories.com / Vendor@12345
    const vendorPassword = await bcrypt.hash("Vendor@12345", 10);
    const vendorUser = await prisma.user.upsert({
      where: { email: "studio@memories.com" },
      update: { role: "VENDOR", isFirstLogin: false },
      create: {
        email: "studio@memories.com",
        passwordHash: vendorPassword,
        role: "VENDOR",
        isFirstLogin: false,
      },
    });

    const photoCatId = categoryMap.get("photography-videography");
    let vendorRecord = await prisma.vendor.findFirst({ where: { email: "studio@memories.com" } });
    if (!vendorRecord) {
      vendorRecord = await prisma.vendor.create({
        data: {
          userId: vendorUser.id,
          businessName: "Moments & Memories Studio",
          categoryId: photoCatId,
          businessType: "INDIVIDUAL",
          phone: "+91 98860 12345",
          email: "studio@memories.com",
          address: "12, 100ft Road, Indiranagar",
          city: "Bangalore",
          state: "Karnataka",
          pincode: "560038",
          rating: 4.9,
          reviewCount: 28,
          bio: "Boutique celebration photography and cinematic films capturing authentic emotion, timeless portraits and spontaneous joyful moments.",
          yearsExperience: 8,
          priceRange: "$$",
          verificationStatus: "VERIFIED",
          isActive: true,
          commissionRate: 10,
        },
      });
    }
    console.log("✓ Vendor demo account verified (studio@memories.com).");

    // 4. Ensure published service
    const existingServices = await prisma.service.count({ where: { vendorId: vendorRecord.id } });
    if (existingServices === 0 && photoCatId) {
      const s = await prisma.service.create({
        data: {
          vendorId: vendorRecord.id,
          categoryId: photoCatId,
          title: "Cinematic Celebration & Portrait Coverage",
          slug: "cinematic-celebration-portrait-coverage",
          description: "Full-spectrum event photo and cinema coverage. Includes candid photojournalism, family portraits, high-res digital delivery, and highlight teaser film.",
          basePrice: 1500000,
          advancePercentage: 30,
          leadTimeDays: 7,
          city: "Bangalore",
          status: "PUBLISHED",
          rating: 4.9,
          reviewCount: 28,
        },
      });

      await prisma.servicePackage.create({
        data: {
          serviceId: s.id,
          name: "Essential Photo Package",
          description: "4 hours coverage, 1 candid photographer, 100+ edited digital high-res photos.",
          price: 1500000,
          advancePaise: 450000,
          durationHours: 4,
          inclusions: JSON.stringify(["1 Senior Photographer", "100+ Master Color-Graded Photos", "Online Private Gallery"]),
          sortOrder: 1,
        },
      });

      await prisma.serviceImage.create({
        data: {
          serviceId: s.id,
          imageUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop",
          isPrimary: true,
          caption: "Celebration portraiture and candid moments",
        },
      });
      console.log("✓ Created published service for Moments & Memories Studio.");
    }

    // 5. Blueprints
    const blueprints = [
      {
        slug: "dream-birthday-celebration",
        name: "Dream Birthday Celebration",
        category: "Birthday",
        description: "The complete milestone birthday package: thematic balloon backdrops, artisan custom cake, candid celebration photojournalism, gourmet banquet, and engaging party entertainment.",
        suggestedBudgetMin: 2500000, // ₹25,000
        suggestedBudgetMax: 5000000, // ₹50,000
        defaultGuestCount: 50,
        stagesJson: JSON.stringify(["Concept & Palette", "Vendor Shortlisting", "Advance Payment & Checklist", "Party Showtime"]),
        recommendedServicesJson: JSON.stringify(["decoration-services", "cakes-bakeries", "photography-videography", "catering-services", "entertainment"]),
        checkpointsJson: JSON.stringify([
          { title: "Theme colors & cake design finalized", daysBefore: 10 },
          { title: "Advance deposits paid & vendor contact unlocked", daysBefore: 7 },
          { title: "Final guest count & dietary preferences confirmed", daysBefore: 3 },
          { title: "Setup schedule and venue access coordinated", daysBefore: 1 },
        ]),
        isActive: true,
      },
      {
        slug: "elegant-wedding-celebration",
        name: "Elegant Wedding Celebration",
        category: "Wedding",
        description: "A breathtaking celebration bringing together luxury venue decor, cinematic photo and drone film crews, royal banquet catering, and celebratory bridal makeover artists.",
        suggestedBudgetMin: 20000000, // ₹2,00,000
        suggestedBudgetMax: 50000000, // ₹5,00,000
        defaultGuestCount: 200,
        stagesJson: JSON.stringify(["Venue & Mandap Styling", "Tasting Session", "Cinematography Brief", "Wedding Day Execution"]),
        recommendedServicesJson: JSON.stringify(["venues", "decoration-services", "photography-videography", "catering-services", "makeup-beauty", "entertainment"]),
        checkpointsJson: JSON.stringify([
          { title: "Venue booked & stage blueprint signed off", daysBefore: 30 },
          { title: "Tasting session & catering menu locked", daysBefore: 20 },
          { title: "Photo shot-list and bridal look trial", daysBefore: 15 },
          { title: "Final balances settled and logistics confirmed", daysBefore: 2 },
        ]),
        isActive: true,
      },
      {
        slug: "intimate-engagement-soiree",
        name: "Intimate Engagement Soiree",
        category: "Engagement",
        description: "An intimate, romantic gathering with floral ring-ceremony archways, champagne canapés, bespoke engagement cake, and couple portraiture.",
        suggestedBudgetMin: 5000000, // ₹50,000
        suggestedBudgetMax: 10000000, // ₹1,00,000
        defaultGuestCount: 60,
        stagesJson: JSON.stringify(["Arch & Decor Styling", "Couple Photography Session", "Engagement Feast"]),
        recommendedServicesJson: JSON.stringify(["decoration-services", "photography-videography", "cakes-bakeries", "catering-services", "venues"]),
        checkpointsJson: JSON.stringify([
          { title: "Ring stage & floral color palette locked", daysBefore: 14 },
          { title: "Photographer briefed on key family moments", daysBefore: 7 },
          { title: "Advance deposits paid and vendors scheduled", daysBefore: 5 },
        ]),
        isActive: true,
      },
      {
        slug: "romantic-anniversary-dinner",
        name: "Romantic Anniversary Celebration",
        category: "Anniversary",
        description: "Celebrate enduring love with candlelit floral tablescapes, gourmet dining, nostalgic photo slideshow, and signature anniversary cake.",
        suggestedBudgetMin: 1000000, // ₹10,000
        suggestedBudgetMax: 2500000, // ₹25,000
        defaultGuestCount: 25,
        stagesJson: JSON.stringify(["Theme & Atmosphere", "Gourmet Dining Selection", "Execution"]),
        recommendedServicesJson: JSON.stringify(["decoration-services", "photography-videography", "cakes-bakeries", "catering-services"]),
        checkpointsJson: JSON.stringify([
          { title: "Menu and cake flavor selection", daysBefore: 7 },
          { title: "Table florals and memory photo prints", daysBefore: 3 },
          { title: "Arrival schedule confirmed with venue", daysBefore: 1 },
        ]),
        isActive: true,
      },
      {
        slug: "beautiful-baby-shower",
        name: "Beautiful Baby Shower",
        category: "Baby Shower",
        description: "Welcome the arrival with pastel floral backdrops, gender-neutral dessert tables, sweet mom-to-be portraits, and delicious hi-tea bites.",
        suggestedBudgetMin: 2000000, // ₹20,000
        suggestedBudgetMax: 4000000, // ₹40,000
        defaultGuestCount: 40,
        stagesJson: JSON.stringify(["Pastel Theme & Invitations", "Hi-Tea & Sweets", "Games & Photo Session"]),
        recommendedServicesJson: JSON.stringify(["decoration-services", "cakes-bakeries", "photography-videography", "catering-services", "celebration-services"]),
        checkpointsJson: JSON.stringify([
          { title: "Theme chosen & game props prepared", daysBefore: 10 },
          { title: "Cake design & guest snacks confirmed", daysBefore: 5 },
          { title: "Return gifts packaged", daysBefore: 2 },
        ]),
        isActive: true,
      },
      {
        slug: "auspicious-housewarming-celebration",
        name: "Auspicious Housewarming Celebration",
        category: "Housewarming",
        description: "Bless your new home with traditional marigold pooja decor, traditional banana-leaf welcome dining, auspicious floral rangoli, and family milestone photos.",
        suggestedBudgetMin: 1500000, // ₹15,000
        suggestedBudgetMax: 3500000, // ₹35,000
        defaultGuestCount: 45,
        stagesJson: JSON.stringify(["Pooja Staging", "Traditional Lunch Feast", "Home Showcase"]),
        recommendedServicesJson: JSON.stringify(["decoration-services", "catering-services", "photography-videography", "celebration-services"]),
        checkpointsJson: JSON.stringify([
          { title: "Puja timing and pandit schedule confirmed", daysBefore: 14 },
          { title: "Catering menu & service style locked", daysBefore: 7 },
          { title: "Fresh flower deliveries confirmed", daysBefore: 1 },
        ]),
        isActive: true,
      },
      {
        slug: "triumphant-graduation-party",
        name: "Triumphant Graduation Celebration",
        category: "Graduation",
        description: "Celebrate academic achievement with custom diploma cake, graduate cap balloon arch, high-energy sound & DJ setup, and celebratory buffet spread.",
        suggestedBudgetMin: 2000000, // ₹20,000
        suggestedBudgetMax: 4500000, // ₹45,000
        defaultGuestCount: 50,
        stagesJson: JSON.stringify(["Setup & DJ Sound Check", "Toasts & Cap Toss", "Buffet & Dance"]),
        recommendedServicesJson: JSON.stringify(["decoration-services", "cakes-bakeries", "entertainment", "photography-videography", "catering-services"]),
        checkpointsJson: JSON.stringify([
          { title: "Playlist and sound equipment booked", daysBefore: 10 },
          { title: "Food & mocktail counter menu locked", daysBefore: 5 },
          { title: "Graduation photo booth props ready", daysBefore: 2 },
        ]),
        isActive: true,
      },
      {
        slug: "corporate-milestone-gala",
        name: "Corporate Milestone & Annual Celebration",
        category: "Corporate Event",
        description: "Professional annual galas, product launches and team milestones with state-of-the-art AV staging, executive hi-tea banquet, emcee hosting and documentary coverage.",
        suggestedBudgetMin: 7500000, // ₹75,000
        suggestedBudgetMax: 20000000, // ₹2,00,000
        defaultGuestCount: 100,
        stagesJson: JSON.stringify(["Tech Dry Run & Lighting", "Keynote & Recognitions", "Banquet Feast"]),
        recommendedServicesJson: JSON.stringify(["venues", "decoration-services", "catering-services", "entertainment", "photography-videography"]),
        checkpointsJson: JSON.stringify([
          { title: "Stage layout and AV equipment finalized", daysBefore: 20 },
          { title: "Speaker slides & agenda locked", daysBefore: 7 },
          { title: "Banquet menu & seating arrangements confirmed", daysBefore: 3 },
        ]),
        isActive: true,
      },
    ];

    for (const bp of blueprints) {
      await prisma.eventTemplate.upsert({
        where: { slug: bp.slug },
        update: bp,
        create: bp,
      });
    }
    console.log(`✓ Ensured ${blueprints.length} Curated Celebration Blueprints.`);

    console.log("====================================================");
    console.log("✓ DEMO DATA SEEDING COMPLETE & IDEMPOTENT.");
    console.log("====================================================");
  } catch (err) {
    console.error("Seeding error:", err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

run();
