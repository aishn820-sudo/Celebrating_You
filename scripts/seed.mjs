import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === "production" && !process.env.ALLOW_PROD_SEED) {
    console.error("CRITICAL: Seeding test demo credentials is prohibited in production!");
    console.error("To seed reference categories and templates only, use seed-reference-only script.");
    process.exit(1);
  }
  console.log("Starting database seeding for Celebrating YOU...");

  // 1. Categories
  const categoriesData = [
    { name: "Photography & Editing Labs", slug: "photography-editing", description: "Candid, traditional, cinematic videography and instant editing labs", icon: "Camera" },
    { name: "Catering Services", slug: "catering-services", description: "Multi-cuisine catering, live food counters, and royal dining spreads", icon: "UtensilsCrossed" },
    { name: "Bakeries & Cloud Kitchens", slug: "bakeries-cloud-kitchens", description: "Custom celebration cakes, dessert tables, and artisan bakeries", icon: "Cake" },
    { name: "Decoration Services", slug: "decoration-services", description: "Floral, balloon, theme-based and luxury venue decor setups", icon: "Sparkles" },
    { name: "Celebration Items & Materials", slug: "celebration-items", description: "Party props, return gifts, personalized keepsakes, and lighting", icon: "Gift" },
  ];

  const categories = [];
  for (const cat of categoriesData) {
    const c = await prisma.vendorCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    categories.push(c);
  }
  console.log(`Created ${categories.length} vendor categories.`);

  // 2. Default Commission Settings
  for (const cat of categories) {
    const existing = await prisma.commissionSetting.findFirst({
      where: { categoryId: cat.id },
    });
    if (!existing) {
      await prisma.commissionSetting.create({
        data: {
          categoryId: cat.id,
          defaultCommissionPercent: 10.0,
          minCommissionPercent: 8.0,
          maxCommissionPercent: 15.0,
          isDefault: true,
        },
      });
    }
  }

  // 3. Event Templates
  const templatesData = [
    {
      name: "Grand Birthday Celebration",
      slug: "birthday-celebration",
      category: "Birthday",
      description: "Complete birthday planning package with theme decor, custom cake, photography and catering.",
      suggestedBudgetMin: 2500000, // ₹25,000 in paise
      suggestedBudgetMax: 15000000, // ₹1,50,000 in paise
      defaultGuestCount: 60,
      stagesJson: JSON.stringify(["Concept & Theme", "Vendor Shortlisting", "Advance Booking", "Setup & Showtime"]),
      recommendedServicesJson: JSON.stringify(["decoration-services", "bakeries-cloud-kitchens", "photography-editing", "catering-services"]),
      checkpointsJson: JSON.stringify([
        { title: "Select Theme & Color Palette", daysBefore: 14 },
        { title: "Finalize Cake Design & Flavor", daysBefore: 7 },
        { title: "Confirm Final Guest Count", daysBefore: 3 },
        { title: "Decor Setup Inspection", daysBefore: 0 },
      ]),
    },
    {
      name: "Luxury Wedding Reception",
      slug: "wedding-reception",
      category: "Wedding",
      description: "Comprehensive royal wedding celebration with full staging, gourmet buffet, and cinematic memories.",
      suggestedBudgetMin: 10000000, // ₹1,00,000 in paise
      suggestedBudgetMax: 100000000, // ₹10,00,000 in paise
      defaultGuestCount: 300,
      stagesJson: JSON.stringify(["Venue & Decor", "Catering Tasting", "Cinematography Brief", "Event Coordination"]),
      recommendedServicesJson: JSON.stringify(["photography-editing", "catering-services", "decoration-services", "celebration-items"]),
      checkpointsJson: JSON.stringify([
        { title: "Catering Menu Tasting", daysBefore: 21 },
        { title: "Stage & Floral Walkthrough", daysBefore: 10 },
        { title: "Vendor Coordination Call", daysBefore: 2 },
        { title: "Live Event Execution", daysBefore: 0 },
      ]),
    },
    {
      name: "Intimate Anniversary Dinner",
      slug: "anniversary-dinner",
      category: "Anniversary",
      description: "Romantic ambient setup, private chef / dining, acoustic music, and keepsake photography.",
      suggestedBudgetMin: 1500000, // ₹15,000 in paise
      suggestedBudgetMax: 6000000, // ₹60,000 in paise
      defaultGuestCount: 20,
      stagesJson: JSON.stringify(["Theme & Atmosphere", "Gourmet Dining Selection", "Execution"]),
      recommendedServicesJson: JSON.stringify(["decoration-services", "catering-services", "photography-editing"]),
      checkpointsJson: JSON.stringify([
        { title: "Select Romance Decor & Fairy Lights", daysBefore: 7 },
        { title: "Curate Special Playlist & Photo Album", daysBefore: 3 },
      ]),
    },
    {
      name: "Baby Shower Joy",
      slug: "baby-shower",
      category: "Baby Shower",
      description: "Pastel theme backdrop, sweet dessert table, game coordination, and celebration keepsakes.",
      suggestedBudgetMin: 2000000,
      suggestedBudgetMax: 8000000,
      defaultGuestCount: 45,
      stagesJson: JSON.stringify(["Theme Setup", "Treats & Favors", "Event Day"]),
      recommendedServicesJson: JSON.stringify(["decoration-services", "bakeries-cloud-kitchens", "celebration-items"]),
      checkpointsJson: JSON.stringify([
        { title: "Theme Balloons & Welcome Board", daysBefore: 10 },
        { title: "Baby Shower Cake Order", daysBefore: 5 },
      ]),
    },
    {
      name: "Housewarming Blessing",
      slug: "housewarming",
      category: "Housewarming",
      description: "Traditional floral rangoli, puja essentials, authentic feast catering, and guest welcome.",
      suggestedBudgetMin: 2000000,
      suggestedBudgetMax: 10000000,
      defaultGuestCount: 80,
      stagesJson: JSON.stringify(["Rituals & Decor", "Traditional Feast", "Welcome Gifts"]),
      recommendedServicesJson: JSON.stringify(["decoration-services", "catering-services", "celebration-items"]),
      checkpointsJson: JSON.stringify([
        { title: "Floral Toran & Entrance Arch", daysBefore: 4 },
        { title: "Traditional Prasadam & Feast Menu", daysBefore: 3 },
      ]),
    },
    {
      name: "Custom Bespoke Celebration",
      slug: "custom-celebration",
      category: "Custom Celebration",
      description: "Design your personalized celebration with hand-picked verified artisans and custom itinerary.",
      suggestedBudgetMin: 1000000,
      suggestedBudgetMax: 50000000,
      defaultGuestCount: 50,
      stagesJson: JSON.stringify(["Custom Concept", "Artisan Selection", "Execution"]),
      recommendedServicesJson: JSON.stringify(["photography-editing", "catering-services", "bakeries-cloud-kitchens", "decoration-services", "celebration-items"]),
      checkpointsJson: JSON.stringify([
        { title: "Design Custom Checklist", daysBefore: 14 },
      ]),
    },
  ];

  for (const tpl of templatesData) {
    await prisma.eventTemplate.upsert({
      where: { slug: tpl.slug },
      update: {},
      create: tpl,
    });
  }
  console.log(`Created ${templatesData.length} event templates.`);

  // 4. Admin User
  const adminPassword = await bcrypt.hash("Admin@12345", 10);
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@celebratingyou.com" },
    update: {},
    create: {
      email: "admin@celebratingyou.com",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });
  console.log("Admin user created:", adminUser.email);

  // 5. Vendor 1: Memories Studio (Photography)
  const vendor1Password = await bcrypt.hash("Vendor@12345", 10);
  const vendor1User = await prisma.user.upsert({
    where: { email: "studio@memories.com" },
    update: {},
    create: {
      email: "studio@memories.com",
      passwordHash: vendor1Password,
      role: "VENDOR",
    },
  });

  const vendor1 = await prisma.vendor.upsert({
    where: { userId: vendor1User.id },
    update: {},
    create: {
      userId: vendor1User.id,
      vendorCode: "CY-VEND-2001",
      businessName: "Lumière Cinematics & Photo Lab",
      contactPerson: "Arjun Mehta",
      email: "studio@memories.com",
      phone: "+91 98765 43210",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560001",
      serviceAreas: "Bangalore, Mysore, Hosur",
      categoryId: categories[0].id, // Photography
      gstin: "29AABCU9603R1ZM",
      panNumber: "AABCU9603R",
      bankAccountNumber: "919876543210",
      bankIfsc: "HDFC0001234",
      bankName: "HDFC Bank",
      accountHolderName: "Lumiere Cinematics LLP",
      verificationStatus: "VERIFIED",
      isVerified: true,
      canPublish: true,
      rating: 4.9,
      reviewCount: 38,
      commissionRate: 10.0,
      responseTimeMinutes: 12,
    },
  });

  // Service 1 for Vendor 1
  const service1 = await prisma.service.create({
    data: {
      vendorId: vendor1.id,
      categoryId: categories[0].id,
      title: "Royal Candid & Cinematic Video Package",
      slug: "royal-candid-cinematic-package",
      description: "Top-tier 4K cinematography, candid photography with prime lenses, drone aerial coverage, and same-day teaser reel.",
      basePrice: 2800000, // ₹28,000 in paise
      status: "PUBLISHED",
      capacity: "Up to 500 Guests",
      duration: "8 Hours",
      setupTime: "1 Hour prior",
      inclusions: JSON.stringify(["1 Candid Photographer", "1 Cinematic Videographer", "Drone 4K aerial shots", "Teaser reel in 24 hours", "300+ edited high-res photos"]),
      exclusions: JSON.stringify(["Destination travel beyond 50km", "Physical photo album printing"]),
      travelCharges: 150000, // ₹1,500
      packages: {
        create: [
          {
            name: "Essential Candid",
            description: "1 Candid Photographer for 4 hours, 150 edited high-res photos, online gallery.",
            price: 1800000, // ₹18,000
            advancePercent: 25,
            features: JSON.stringify(["1 Candid Shooter", "150 Edited Photos", "Online Gallery Access"]),
          },
          {
            name: "Signature Cinematic (Popular)",
            description: "Full day coverage with candid photo, 4K film reel, drone shots, and express teaser.",
            price: 3500000, // ₹35,000
            advancePercent: 25,
            features: JSON.stringify(["2 Shooters (Photo + Film)", "Drone Coverage", "Teaser Reel in 24hrs", "350+ Retouched Photos"]),
          },
        ],
      },
      images: {
        create: [
          { imageUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800", isCover: true, sortOrder: 1 },
          { imageUrl: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800", isCover: false, sortOrder: 2 },
        ],
      },
    },
  });

  // Vendor 2: Cake & Delight (Bakeries)
  const vendor2Password = await bcrypt.hash("Vendor@12345", 10);
  const vendor2User = await prisma.user.upsert({
    where: { email: "delights@sugarplum.com" },
    update: {},
    create: {
      email: "delights@sugarplum.com",
      passwordHash: vendor2Password,
      role: "VENDOR",
    },
  });

  const vendor2 = await prisma.vendor.upsert({
    where: { userId: vendor2User.id },
    update: {},
    create: {
      userId: vendor2User.id,
      vendorCode: "CY-VEND-2002",
      businessName: "SugarPlum Artisan Patisserie",
      contactPerson: "Sneha Kapoor",
      email: "delights@sugarplum.com",
      phone: "+91 98451 22334",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560034",
      serviceAreas: "Koramangala, Indiranagar, HSR, Whitefield",
      categoryId: categories[2].id, // Bakeries
      gstin: "29BBVPS4432Q1Z9",
      panNumber: "BBVPS4432Q",
      bankAccountNumber: "002305001244",
      bankIfsc: "ICIC0000023",
      bankName: "ICICI Bank",
      accountHolderName: "SugarPlum Patisserie",
      verificationStatus: "VERIFIED",
      isVerified: true,
      canPublish: true,
      rating: 4.8,
      reviewCount: 52,
      commissionRate: 10.0,
      responseTimeMinutes: 20,
    },
  });

  // Service 2 for Vendor 2
  const service2 = await prisma.service.create({
    data: {
      vendorId: vendor2.id,
      categoryId: categories[2].id,
      title: "Handcrafted 3-Tier Theme Celebration Cake",
      slug: "handcrafted-theme-celebration-cake",
      description: "Luxury fondant or buttercream artistic cakes made with Belgian chocolate, French vanilla, and customized edible figurines.",
      basePrice: 550000, // ₹5,500
      status: "PUBLISHED",
      capacity: "2kg - 8kg",
      duration: "Delivered 2 hours prior",
      inclusions: JSON.stringify(["Custom handcrafted cake", "Designer cake topper & sparkler candles", "Temperature-controlled sanitized delivery"]),
      exclusions: JSON.stringify(["Cake stand return collection beyond 24h"]),
      packages: {
        create: [
          {
            name: "Classic 2kg Theme Cake",
            description: "Delicious 2kg custom theme cake for up to 25 guests.",
            price: 550000, // ₹5,500
            advancePercent: 30,
            features: JSON.stringify(["2kg Belgian Truffle or Red Velvet", "Custom theme name & message", "Sparkler & matching candles"]),
          },
          {
            name: "Royal 4kg Multi-Tier Centerpiece",
            description: "Grand 2 or 3 tier artisanal cake for 50-60 guests with macarons and floral accents.",
            price: 1100000, // ₹11,000
            advancePercent: 30,
            features: JSON.stringify(["4kg Multi-tier creation", "Macarons & gold foil details", "Personalized acrylic keepsake topper"]),
          },
        ],
      },
      images: {
        create: [
          { imageUrl: "https://images.unsplash.com/photo-1535141192574-5d4897c13136?w=800", isCover: true, sortOrder: 1 },
        ],
      },
    },
  });

  // Vendor 3: Bloom & Glow Decor (Decoration)
  const vendor3Password = await bcrypt.hash("Vendor@12345", 10);
  const vendor3User = await prisma.user.upsert({
    where: { email: "decor@bloomglow.com" },
    update: {},
    create: {
      email: "decor@bloomglow.com",
      passwordHash: vendor3Password,
      role: "VENDOR",
    },
  });

  const vendor3 = await prisma.vendor.upsert({
    where: { userId: vendor3User.id },
    update: {},
    create: {
      userId: vendor3User.id,
      vendorCode: "CY-VEND-2003",
      businessName: "Bloom & Glow Event Stylists",
      contactPerson: "Vikram Singhania",
      email: "decor@bloomglow.com",
      phone: "+91 97400 11223",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560038",
      serviceAreas: "Bangalore Urban & Rural",
      categoryId: categories[3].id, // Decor
      gstin: "29AALCB1234P1ZR",
      verificationStatus: "VERIFIED",
      isVerified: true,
      canPublish: true,
      rating: 5.0,
      reviewCount: 29,
      commissionRate: 10.0,
      responseTimeMinutes: 10,
    },
  });

  const service3 = await prisma.service.create({
    data: {
      vendorId: vendor3.id,
      categoryId: categories[3].id,
      title: "Enchanted Pastel Floral & Neon Arch Backdrop",
      slug: "enchanted-floral-neon-backdrop",
      description: "Bespoke photogenic backdrop with organic balloons, fresh seasonal blooms, LED neon sign, and coordinated plinths.",
      basePrice: 1500000, // ₹15,000
      status: "PUBLISHED",
      duration: "Full event duration",
      setupTime: "3 Hours prior to event start",
      inclusions: JSON.stringify(["10x8ft Customized backdrop", "Organic balloon garland & fresh carnations/roses", "Custom Neon Name Sign", "3 Cylindrical cake plinths"]),
      exclusions: JSON.stringify(["Venue entrance arch (can be added as add-on)"]),
      packages: {
        create: [
          {
            name: "Intimate Glow Decor",
            description: "8ft Ring setup with balloon garland and neon light.",
            price: 1500000, // ₹15,000
            advancePercent: 25,
            features: JSON.stringify(["8ft Circle backdrop", "Balloon garland", "Neon sign"]),
          },
          {
            name: "Grand Gala Luxury Setup",
            description: "Complete stage styling, pathway carpet, welcome easel, and spotlight illumination.",
            price: 2800000, // ₹28,000
            advancePercent: 25,
            features: JSON.stringify(["Stage backdrop + LED floodlights", "Welcome easel with floral crest", "Cake table staging", "Pathway decor"]),
          },
        ],
      },
      images: {
        create: [
          { imageUrl: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800", isCover: true, sortOrder: 1 },
        ],
      },
    },
  });

  // 6. Customers
  const customer1Password = await bcrypt.hash("Customer@12345", 10);
  const cust1User = await prisma.user.upsert({
    where: { email: "priya@example.com" },
    update: {},
    create: {
      email: "priya@example.com",
      passwordHash: customer1Password,
      role: "CUSTOMER",
    },
  });

  const customer1 = await prisma.customer.upsert({
    where: { userId: cust1User.id },
    update: {},
    create: {
      userId: cust1User.id,
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

  console.log("Customer created:", customer1.name);

  // 7. Seed Sample Event for Priya
  const event1 = await prisma.event.create({
    data: {
      customerId: customer1.id,
      title: "Aarav's 5th Superhero Birthday",
      eventType: "Birthday",
      eventDate: "2026-11-28",
      eventTime: "17:30",
      locationAddress: "The Grand Orchid Clubhouse, Sarjapur Road",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560035",
      guestCount: 65,
      overallBudget: 7500000, // ₹75,000
      notes: "Aarav loves Spider-Man. Need red & blue balloon styling.",
      status: "PLANNING",
      checkpoints: {
        create: [
          { title: "Book Cake & Styling Vendors", targetDate: "2026-11-20", status: "COMPLETED" },
          { title: "Finalize Music & Entertainment", targetDate: "2026-11-24", status: "PENDING" },
          { title: "Confirm Final Guest RSVP Count", targetDate: "2026-11-26", status: "PENDING" },
        ],
      },
    },
  });

  // 8. Sample Confirmed Booking with Advance Payment & Generated Invoice 1
  const pkg1 = await prisma.servicePackage.findFirst({ where: { serviceId: service1.id } });
  const agreedValue = pkg1.price;
  const advanceRequired = Math.round((agreedValue * pkg1.advancePercent) / 100);
  const finalDue = agreedValue - advanceRequired;

  const booking1 = await prisma.booking.create({
    data: {
      bookingCode: "CY-BK-5001",
      eventId: event1.id,
      customerId: customer1.id,
      vendorId: vendor1.id,
      serviceId: service1.id,
      packageId: pkg1.id,
      eventDate: "2026-11-28",
      status: "CONFIRMED",
      requestSubmittedAt: new Date(Date.now() - 3600000 * 24),
      responseDeadlineAt: new Date(Date.now() - 3600000 * 22),
      acceptedAt: new Date(Date.now() - 3600000 * 23),
      confirmedAt: new Date(Date.now() - 3600000 * 22),
      agreedServiceValue: agreedValue,
      advanceRequired,
      advancePaid: advanceRequired,
      finalBalanceDue: finalDue,
      finalPaid: 0,
      specialRequirements: "Capture cake cutting candid moments specifically.",
      guestCount: 65,
      locationAddress: event1.locationAddress,
      isCustomerContactRevealed: true,
      isVendorContactRevealed: true,
      statusHistory: {
        create: [
          { fromStatus: "REQUEST_SUBMITTED", toStatus: "ACCEPTED_AWAITING_ADVANCE", changedByRole: "VENDOR", note: "Vendor accepted within response window" },
          { fromStatus: "ACCEPTED_AWAITING_ADVANCE", toStatus: "CONFIRMED", changedByRole: "SYSTEM", note: "Advance payment of ₹4,500 received via Sandbox Gateway" },
        ],
      },
    },
  });

  // Payment record
  const payment1 = await prisma.payment.create({
    data: {
      bookingId: booking1.id,
      customerId: customer1.id,
      totalAmount: agreedValue,
      paidAmount: advanceRequired,
      pendingAmount: finalDue,
      status: "PARTIALLY_PAID",
    },
  });

  // Payment Transaction 1 (Advance)
  const txn1 = await prisma.paymentTransaction.create({
    data: {
      paymentId: payment1.id,
      bookingId: booking1.id,
      transactionRef: "CY-TXN-202611-0001",
      type: "ADVANCE",
      amount: advanceRequired,
      currency: "INR",
      status: "SUCCESS",
      gatewayProvider: "SANDBOX",
      gatewayPaymentId: "pay_sandbox_adv_001",
      paidAt: new Date(Date.now() - 3600000 * 22),
    },
  });

  // MANDATORY INVOICE 1: Advance Payment Document
  await prisma.invoice.create({
    data: {
      invoiceNumber: "CY-INV-ADV-2026-1001",
      bookingId: booking1.id,
      transactionId: txn1.id,
      type: "ADVANCE",
      customerName: customer1.name,
      customerEmail: customer1.email,
      customerPhone: customer1.phone,
      customerAddress: customer1.address,
      vendorBusinessName: vendor1.businessName,
      vendorGstin: vendor1.gstin,
      vendorPan: vendor1.panNumber,
      vendorAddress: `${vendor1.city}, ${vendor1.state}`,
      serviceTitle: service1.title,
      packageName: pkg1.name,
      agreedServiceValue: agreedValue,
      advancePaid: advanceRequired,
      amountPaidThisDoc: advanceRequired,
      remainingBalanceDue: finalDue,
      taxAmount: Math.round((advanceRequired * 18) / 118),
      paymentDate: txn1.paidAt,
      status: "PAID",
    },
  });

  // 9. Sample Completed Booking with Both Advance AND Final Invoices Reconciled!
  const pkg2 = await prisma.servicePackage.findFirst({ where: { serviceId: service2.id } });
  const cakeAgreed = pkg2.price;
  const cakeAdv = Math.round((cakeAgreed * pkg2.advancePercent) / 100);
  const cakeFin = cakeAgreed - cakeAdv;

  const pastEvent = await prisma.event.create({
    data: {
      customerId: customer1.id,
      title: "Rohan & Sneha Anniversary",
      eventType: "Anniversary",
      eventDate: "2026-11-10",
      eventTime: "19:00",
      locationAddress: "Lavelle Road, Bangalore",
      city: "Bangalore",
      state: "Karnataka",
      guestCount: 25,
      overallBudget: 2500000,
      status: "COMPLETED",
    },
  });

  const booking2 = await prisma.booking.create({
    data: {
      bookingCode: "CY-BK-5002",
      eventId: pastEvent.id,
      customerId: customer1.id,
      vendorId: vendor2.id,
      serviceId: service2.id,
      packageId: pkg2.id,
      eventDate: "2026-11-10",
      status: "COMPLETED",
      requestSubmittedAt: new Date("2026-11-01T10:00:00Z"),
      responseDeadlineAt: new Date("2026-11-01T12:00:00Z"),
      acceptedAt: new Date("2026-11-01T10:45:00Z"),
      confirmedAt: new Date("2026-11-01T11:15:00Z"),
      completedAt: new Date("2026-11-10T21:00:00Z"),
      agreedServiceValue: cakeAgreed,
      advanceRequired: cakeAdv,
      advancePaid: cakeAdv,
      finalBalanceDue: 0,
      finalPaid: cakeFin,
      isCustomerContactRevealed: true,
      isVendorContactRevealed: true,
    },
  });

  const payment2 = await prisma.payment.create({
    data: {
      bookingId: booking2.id,
      customerId: customer1.id,
      totalAmount: cakeAgreed,
      paidAmount: cakeAgreed,
      pendingAmount: 0,
      status: "FULLY_PAID",
    },
  });

  // Advance Transaction & Invoice
  const txnAdv = await prisma.paymentTransaction.create({
    data: {
      paymentId: payment2.id,
      bookingId: booking2.id,
      transactionRef: "CY-TXN-202611-0002",
      type: "ADVANCE",
      amount: cakeAdv,
      currency: "INR",
      status: "SUCCESS",
      gatewayProvider: "SANDBOX",
      paidAt: new Date("2026-11-01T11:15:00Z"),
    },
  });

  await prisma.invoice.create({
    data: {
      invoiceNumber: "CY-INV-ADV-2026-1002",
      bookingId: booking2.id,
      transactionId: txnAdv.id,
      type: "ADVANCE",
      customerName: customer1.name,
      customerEmail: customer1.email,
      customerPhone: customer1.phone,
      vendorBusinessName: vendor2.businessName,
      vendorGstin: vendor2.gstin,
      vendorPan: vendor2.panNumber,
      vendorAddress: `${vendor2.city}, ${vendor2.state}`,
      serviceTitle: service2.title,
      packageName: pkg2.name,
      agreedServiceValue: cakeAgreed,
      advancePaid: cakeAdv,
      amountPaidThisDoc: cakeAdv,
      remainingBalanceDue: cakeFin,
      taxAmount: Math.round((cakeAdv * 18) / 118),
      paymentDate: txnAdv.paidAt,
      status: "PAID",
    },
  });

  // Final Transaction & Invoice
  const txnFin = await prisma.paymentTransaction.create({
    data: {
      paymentId: payment2.id,
      bookingId: booking2.id,
      transactionRef: "CY-TXN-202611-0003",
      type: "FINAL",
      amount: cakeFin,
      currency: "INR",
      status: "SUCCESS",
      gatewayProvider: "SANDBOX",
      paidAt: new Date("2026-11-10T20:30:00Z"),
    },
  });

  await prisma.invoice.create({
    data: {
      invoiceNumber: "CY-INV-FIN-2026-1002",
      bookingId: booking2.id,
      transactionId: txnFin.id,
      type: "FINAL",
      customerName: customer1.name,
      customerEmail: customer1.email,
      customerPhone: customer1.phone,
      vendorBusinessName: vendor2.businessName,
      vendorGstin: vendor2.gstin,
      vendorPan: vendor2.panNumber,
      vendorAddress: `${vendor2.city}, ${vendor2.state}`,
      serviceTitle: service2.title,
      packageName: pkg2.name,
      agreedServiceValue: cakeAgreed,
      advancePaid: cakeAdv,
      amountPaidThisDoc: cakeFin,
      remainingBalanceDue: 0,
      taxAmount: Math.round((cakeFin * 18) / 118),
      paymentDate: txnFin.paidAt,
      status: "PAID",
    },
  });

  // Settlement for vendor 2
  const comm = Math.round((cakeAgreed * 10) / 100);
  await prisma.vendorSettlement.create({
    data: {
      vendorId: vendor2.id,
      bookingId: booking2.id,
      grossAmount: cakeAgreed,
      platformCommission: comm,
      commissionPercent: 10.0,
      netSettlementAmount: cakeAgreed - comm,
      status: "SETTLED",
      settledAt: new Date("2026-11-12T10:00:00Z"),
      settlementRef: "SETTLE-HDFC-9921",
      remarks: "Full settlement transferred to ICICI account",
    },
  });

  // Review for vendor 2
  await prisma.review.create({
    data: {
      bookingId: booking2.id,
      customerId: customer1.id,
      vendorId: vendor2.id,
      serviceId: service2.id,
      rating: 5,
      comment: "The Belgian chocolate truffle cake was absolute perfection! Guests loved the edible floral details.",
      vendorReply: "Thank you so much Priya! It was an honor making your anniversary sweeter!",
    },
  });

  console.log("Seeding completed successfully with rich test data!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

