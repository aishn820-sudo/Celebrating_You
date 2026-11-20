import prisma from "./prisma";
import bcrypt from "bcryptjs";

let isSeedingInProgress = false;

export async function ensureDemoData(): Promise<void> {
  if (isSeedingInProgress) return;
  isSeedingInProgress = true;

  try {
    // 1. Ensure Categories exist
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

    const categoryMap = new Map<string, string>();
    for (const cat of categoriesData) {
      const c = await prisma.vendorCategory.upsert({
        where: { slug: cat.slug },
        update: { isActive: true },
        create: cat,
      });
      categoryMap.set(cat.slug, c.id);
    }

    // 2. Ensure Customer Demo Account: priya@example.com / Customer@12345
    const customerPassword = await bcrypt.hash("Customer@12345", 10);
    const custUser = await prisma.user.upsert({
      where: { email: "priya@example.com" },
      update: {
        passwordHash: customerPassword,
        role: "CUSTOMER",
        isFirstLogin: false,
      },
      create: {
        email: "priya@example.com",
        passwordHash: customerPassword,
        role: "CUSTOMER",
        isFirstLogin: false,
      },
    });

    let custProfile = await prisma.customer.findFirst({
      where: {
        OR: [
          { userId: custUser.id },
          { email: "priya@example.com" },
          { customerCode: "CY-CUST-1001" },
        ],
      },
    });

    if (!custProfile) {
      custProfile = await prisma.customer.create({
        data: {
          userId: custUser.id,
          customerCode: "CY-CUST-1001",
          name: "Priya Sharma",
          phone: "+91 99001 23456",
          email: "priya@example.com",
          address: "Flat 402, Sunshine Heights, Koramangala 4th Block",
          city: "Bangalore",
          state: "Karnataka",
          pincode: "560034",
        },
      });
    } else if (custProfile.userId !== custUser.id) {
      custProfile = await prisma.customer.update({
        where: { id: custProfile.id },
        data: { userId: custUser.id },
      });
    }

    // 3. Ensure Vendor Demo Account: studio@memories.com / Vendor@12345
    const photoCatId = categoryMap.get("photography-videography");
    const vendorPassword = await bcrypt.hash("Vendor@12345", 10);
    const vendorUser = await prisma.user.upsert({
      where: { email: "studio@memories.com" },
      update: {
        passwordHash: vendorPassword,
        role: "VENDOR",
        isFirstLogin: false,
      },
      create: {
        email: "studio@memories.com",
        passwordHash: vendorPassword,
        role: "VENDOR",
        isFirstLogin: false,
      },
    });

    let vendorRecord = await prisma.vendor.findFirst({
      where: {
        OR: [
          { userId: vendorUser.id },
          { email: "studio@memories.com" },
          { vendorCode: "CY-VEND-2001" },
        ],
      },
    });

    if (!vendorRecord && photoCatId) {
      vendorRecord = await prisma.vendor.create({
        data: {
          userId: vendorUser.id,
          vendorCode: "CY-VEND-2001",
          businessName: "Moments & Memories Studio",
          contactPerson: "Arjun Mehta",
          categoryId: photoCatId,
          phone: "+91 98860 12345",
          email: "studio@memories.com",
          city: "Bangalore",
          state: "Karnataka",
          pincode: "560038",
          rating: 4.9,
          reviewCount: 28,
          verificationStatus: "VERIFIED",
          isVerified: true,
          canPublish: true,
          commissionRate: 10.0,
          responseTimeMinutes: 12,
        },
      });
    } else if (vendorRecord) {
      vendorRecord = await prisma.vendor.update({
        where: { id: vendorRecord.id },
        data: {
          userId: vendorUser.id,
          isVerified: true,
          canPublish: true,
          verificationStatus: "VERIFIED",
        },
      });
    }

    // 4. Ensure Moments & Memories Studio has Published Services
    if (vendorRecord && photoCatId) {
      const serviceCount = await prisma.service.count({
        where: { vendorId: vendorRecord.id },
      });

      if (serviceCount === 0) {
        const s1 = await prisma.service.create({
          data: {
            vendorId: vendorRecord.id,
            categoryId: photoCatId,
            title: "Cinematic Celebration & Portrait Coverage",
            slug: "cinematic-celebration-portrait-coverage",
            description: "Full-spectrum event photo and cinema coverage. Includes candid photojournalism, family portraits, high-res digital delivery, and highlight teaser film.",
            basePrice: 1500000,
            status: "PUBLISHED",
            rating: 4.9,
            reviewCount: 28,
            duration: "6 Hours",
            inclusions: JSON.stringify(["1 Lead Photographer", "1 Cinematographer", "Drone 4K shots", "300+ Mastered Photos"]),
          },
        });

        await prisma.servicePackage.create({
          data: {
            serviceId: s1.id,
            name: "Essential Photo Package",
            description: "4 hours coverage, 1 candid photographer, 100+ edited digital high-res photos.",
            price: 1500000,
            advancePercent: 25,
            duration: "4 Hours",
            features: JSON.stringify(["1 Senior Photographer", "100+ Master Color-Graded Photos", "Online Private Gallery"]),
          },
        });

        await prisma.serviceImage.create({
          data: {
            serviceId: s1.id,
            imageUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop",
            isCover: true,
            sortOrder: 1,
          },
        });
      }
    }

    // 5. Ensure 8 Curated Celebration Blueprints
    const blueprints = [
      {
        slug: "dream-birthday-celebration",
        name: "Dream Birthday Celebration",
        category: "Birthday",
        description: "The complete milestone birthday package: thematic balloon backdrops, artisan custom cake, candid celebration photojournalism, gourmet banquet, and engaging party entertainment.",
        suggestedBudgetMin: 2500000,
        suggestedBudgetMax: 5000000,
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
        suggestedBudgetMin: 20000000,
        suggestedBudgetMax: 50000000,
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
        suggestedBudgetMin: 5000000,
        suggestedBudgetMax: 10000000,
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
        suggestedBudgetMin: 1000000,
        suggestedBudgetMax: 2500000,
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
        suggestedBudgetMin: 2000000,
        suggestedBudgetMax: 4000000,
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
        suggestedBudgetMin: 1500000,
        suggestedBudgetMax: 3500000,
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
        suggestedBudgetMin: 2000000,
        suggestedBudgetMax: 4500000,
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
        suggestedBudgetMin: 7500000,
        suggestedBudgetMax: 20000000,
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

    console.log("[ensureDemoData] Demo accounts, categories, and blueprints ensured successfully.");
  } catch (err) {
    console.error("[ensureDemoData] Error guaranteeing demo data:", err);
  } finally {
    isSeedingInProgress = false;
  }
}
