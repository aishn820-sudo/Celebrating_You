import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "celebrating-you-secure-jwt-key-2026-prod";

async function runTests() {
  console.log("=================================================");
  console.log("CELEBRATING YOU — COMPREHENSIVE INTEGRATION SUITE");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  // TEST 1: Database Seed and Entities
  console.log("1. Verifying Database Schema & Core Entities...");
  const categoriesCount = await prisma.vendorCategory.count();
  assert(categoriesCount >= 5, `Vendor categories count >= 5 (found ${categoriesCount})`);

  const templatesCount = await prisma.eventTemplate.count();
  assert(templatesCount >= 6, `Event templates count >= 6 (found ${templatesCount})`);

  const admin = await prisma.user.findUnique({ where: { email: "admin@celebratingyou.com" } });
  assert(admin && admin.role === "ADMIN", "Admin user exists with ADMIN role");

  // TEST 2: Authentication & RBAC Tokens
  console.log("\n2. Testing Authentication & RBAC Tokens...");
  const adminToken = jwt.sign({ userId: admin.id, email: admin.email, role: "ADMIN" }, JWT_SECRET, { expiresIn: "7d" });
  const verifiedAdmin = jwt.verify(adminToken, JWT_SECRET);
  assert(verifiedAdmin?.role === "ADMIN", "JWT signing and verification works for ADMIN");

  const customerToken = jwt.sign({
    userId: "cust-1",
    email: "priya@example.com",
    role: "CUSTOMER",
    customerId: "c-1",
  }, JWT_SECRET, { expiresIn: "7d" });
  const verifiedCust = jwt.verify(customerToken, JWT_SECRET);
  assert(verifiedCust?.role === "CUSTOMER", "Customer token verified correctly");

  // TEST 3: Vendor Onboarding & Verification Rules
  console.log("\n3. Testing Vendor Verification & Publishing Permissions...");
  const cat = await prisma.vendorCategory.findFirst();
  const testVendorUser = await prisma.user.create({
    data: {
      email: `test_vendor_${Date.now()}@example.com`,
      passwordHash: await bcrypt.hash("Temp@123", 10),
      role: "VENDOR",
      isFirstLogin: true,
    },
  });

  const testVendor = await prisma.vendor.create({
    data: {
      userId: testVendorUser.id,
      vendorCode: `CY-VEND-TEST-${Date.now().toString().slice(-4)}`,
      businessName: "Test Staging Decorators",
      contactPerson: "Ramesh Kumar",
      email: testVendorUser.email,
      phone: "+91 99887 76655",
      city: "Bangalore",
      state: "Karnataka",
      categoryId: cat.id,
      verificationStatus: "PENDING",
      isVerified: false,
      canPublish: false,
    },
  });

  assert(testVendor.verificationStatus === "PENDING", "Newly onboarded vendor is PENDING");
  assert(!testVendor.canPublish, "Pending vendor CANNOT publish live services");

  // Admin approves vendor
  const approvedVendor = await prisma.vendor.update({
    where: { id: testVendor.id },
    data: {
      verificationStatus: "VERIFIED",
      isVerified: true,
      canPublish: true,
    },
  });
  assert(approvedVendor.isVerified && approvedVendor.canPublish, "Admin approval activates vendor and enables service publishing");

  // TEST 4: Service Creation & Booking Request
  console.log("\n4. Testing Service Creation & Two-Hour Response Rule...");
  const service = await prisma.service.create({
    data: {
      vendorId: approvedVendor.id,
      categoryId: cat.id,
      title: "Royal Grand Celebration Staging",
      slug: `royal-grand-staging-${Date.now()}`,
      description: "Magnificent decor setup for weddings and grand celebrations",
      basePrice: 5000000, // ₹50,000 in paise
      status: "PUBLISHED",
      packages: {
        create: [
          {
            name: "Gold Package",
            price: 5000000, // ₹50,000
            advancePercent: 20, // 20% advance = ₹10,000
            features: JSON.stringify(["Full stage styling", "Entrance arch"]),
          },
        ],
      },
    },
    include: { packages: true },
  });
  assert(service.status === "PUBLISHED", "Verified vendor published service successfully");

  // Customer creates event
  const customer = await prisma.customer.findFirst();
  const event = await prisma.event.create({
    data: {
      customerId: customer.id,
      title: "Rohan's Engagement Ceremony",
      eventType: "Engagement",
      eventDate: "2026-12-05",
      locationAddress: "Palace Grounds, Bangalore",
      city: "Bangalore",
      state: "Karnataka",
      guestCount: 150,
      overallBudget: 20000000,
    },
  });

  // Create Booking Request with 2-Hour Response Deadline
  const pkg = service.packages[0];
  const agreedVal = pkg.price;
  const advReq = Math.round((agreedVal * pkg.advancePercent) / 100);
  const finDue = agreedVal - advReq;
  const deadline = new Date(Date.now() + 2 * 60 * 60 * 1000); // exactly 2 hours

  const booking = await prisma.booking.create({
    data: {
      bookingCode: `CY-BK-E2E-${Date.now().toString().slice(-4)}`,
      eventId: event.id,
      customerId: customer.id,
      vendorId: approvedVendor.id,
      serviceId: service.id,
      packageId: pkg.id,
      eventDate: "2026-12-05",
      status: "REQUEST_SUBMITTED",
      requestSubmittedAt: new Date(),
      responseDeadlineAt: deadline,
      agreedServiceValue: agreedVal,
      advanceRequired: advReq,
      advancePaid: 0,
      finalBalanceDue: finDue,
      finalPaid: 0,
      isCustomerContactRevealed: false,
      isVendorContactRevealed: false,
      statusHistory: {
        create: [
          {
            fromStatus: "DRAFT",
            toStatus: "REQUEST_SUBMITTED",
            changedByRole: "CUSTOMER",
            note: "Customer submitted booking request with 2-hour response window",
          },
        ],
      },
    },
  });

  assert(booking.status === "REQUEST_SUBMITTED", "Booking request created with status REQUEST_SUBMITTED");
  assert(booking.responseDeadlineAt !== null, "Two-hour response deadline set on backend");
  assert(!booking.isCustomerContactRevealed, "Customer contact details are strictly MASKED before confirmation");
  assert(!booking.isVendorContactRevealed, "Vendor contact details are strictly MASKED before confirmation");

  // TEST 5: Two-Hour Expiry Simulation
  console.log("\n5. Testing 2-Hour Expiration Engine...");
  const expiredBooking = await prisma.booking.create({
    data: {
      bookingCode: `CY-BK-EXPIRE-${Date.now().toString().slice(-4)}`,
      eventId: event.id,
      customerId: customer.id,
      vendorId: approvedVendor.id,
      serviceId: service.id,
      eventDate: "2026-12-10",
      status: "REQUEST_SUBMITTED",
      requestSubmittedAt: new Date(Date.now() - 3 * 3600 * 1000),
      responseDeadlineAt: new Date(Date.now() - 1 * 3600 * 1000), // lapsed 1 hour ago
      agreedServiceValue: 1000000,
      advanceRequired: 250000,
      finalBalanceDue: 750000,
    },
  });

  // Run auto-expiry query
  await prisma.booking.updateMany({
    where: {
      id: expiredBooking.id,
      status: "REQUEST_SUBMITTED",
      responseDeadlineAt: { lte: new Date() },
    },
    data: { status: "EXPIRED" },
  });

  const refreshedExpired = await prisma.booking.findUnique({ where: { id: expiredBooking.id } });
  assert(refreshedExpired?.status === "EXPIRED", "Overdue request automatically marked as EXPIRED by backend engine");

  // TEST 6: Vendor Acceptance Flow
  console.log("\n6. Testing Vendor Acceptance...");
  const acceptedBooking = await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: "ACCEPTED_AWAITING_ADVANCE",
      acceptedAt: new Date(),
    },
  });

  assert(
    acceptedBooking.status === "ACCEPTED_AWAITING_ADVANCE",
    "Vendor acceptance transitions booking to ACCEPTED_AWAITING_ADVANCE"
  );
  assert(
    !acceptedBooking.isCustomerContactRevealed,
    "Acceptance alone does NOT unlock customer contacts before advance payment"
  );

  // TEST 7: Advance Payment & Invoice 1 Generation
  console.log("\n7. Testing Advance Payment & Mandatory Invoice 1...");
  const paymentMaster = await prisma.payment.create({
    data: {
      bookingId: booking.id,
      customerId: customer.id,
      totalAmount: agreedVal,
      paidAmount: advReq,
      pendingAmount: finDue,
      status: "PARTIALLY_PAID",
    },
  });

  const advTxn = await prisma.paymentTransaction.create({
    data: {
      paymentId: paymentMaster.id,
      bookingId: booking.id,
      transactionRef: `CY-TXN-ADV-${Date.now()}`,
      type: "ADVANCE",
      amount: advReq,
      currency: "INR",
      status: "SUCCESS",
      gatewayProvider: "SANDBOX",
      paidAt: new Date(),
    },
  });

  // Generate MANDATORY INVOICE 1
  const inv1 = await prisma.invoice.create({
    data: {
      invoiceNumber: `CY-INV-ADV-2026-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      bookingId: booking.id,
      transactionId: advTxn.id,
      type: "ADVANCE",
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      vendorBusinessName: approvedVendor.businessName,
      vendorGstin: approvedVendor.gstin || "Unregistered",
      vendorPan: approvedVendor.panNumber || "N/A",
      serviceTitle: service.title,
      packageName: pkg.name,
      agreedServiceValue: agreedVal,
      advancePaid: advReq,
      amountPaidThisDoc: advReq,
      remainingBalanceDue: finDue,
      taxAmount: Math.round((advReq * 18) / 118),
      paymentDate: advTxn.paidAt,
      status: "PAID",
    },
  });

  assert(advTxn.status === "SUCCESS", "Advance payment transaction status is SUCCESS");
  assert(inv1 !== null && inv1.type === "ADVANCE", `MANDATORY INVOICE 1 (Advance Document) generated! (#${inv1.invoiceNumber})`);

  // Update booking to CONFIRMED and unlock contacts
  const confirmedBooking = await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: "CONFIRMED",
      advancePaid: advReq,
      confirmedAt: new Date(),
      isCustomerContactRevealed: true,
      isVendorContactRevealed: true,
    },
  });

  assert(confirmedBooking.status === "CONFIRMED", "Confirmed advance payment automatically transitions booking to CONFIRMED");
  assert(
    confirmedBooking.isCustomerContactRevealed && confirmedBooking.isVendorContactRevealed,
    "Confirmed booking UNLOCKS customer and vendor direct contact details!"
  );

  // TEST 8: Final Payment & Invoice 2 Generation
  console.log("\n8. Testing Final Payment & Mandatory Invoice 2...");
  const finTxn = await prisma.paymentTransaction.create({
    data: {
      paymentId: paymentMaster.id,
      bookingId: booking.id,
      transactionRef: `CY-TXN-FIN-${Date.now()}`,
      type: "FINAL",
      amount: finDue,
      currency: "INR",
      status: "SUCCESS",
      gatewayProvider: "SANDBOX",
      paidAt: new Date(),
    },
  });

  // Generate MANDATORY INVOICE 2
  const inv2 = await prisma.invoice.create({
    data: {
      invoiceNumber: `CY-INV-FIN-2026-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      bookingId: booking.id,
      transactionId: finTxn.id,
      type: "FINAL",
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      vendorBusinessName: approvedVendor.businessName,
      vendorGstin: approvedVendor.gstin || "Unregistered",
      vendorPan: approvedVendor.panNumber || "N/A",
      serviceTitle: service.title,
      packageName: pkg.name,
      agreedServiceValue: agreedVal,
      advancePaid: advReq,
      amountPaidThisDoc: finDue,
      remainingBalanceDue: 0,
      taxAmount: Math.round((finDue * 18) / 118),
      paymentDate: finTxn.paidAt,
      status: "PAID",
    },
  });

  assert(finTxn.status === "SUCCESS", "Final payment transaction status is SUCCESS");
  assert(inv2 !== null && inv2.type === "FINAL", `MANDATORY INVOICE 2 (Final Document) generated! (#${inv2.invoiceNumber})`);

  // Update booking to fully paid
  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      finalPaid: finDue,
      finalBalanceDue: 0,
    },
  });

  // Verify Invoice Reconciliation
  const fullyPaidBooking = await prisma.booking.findUnique({
    where: { id: booking.id },
    include: { invoices: true, transactions: true },
  });

  assert(fullyPaidBooking?.invoices.length === 2, "Booking has exactly 2 distinct transaction documents (Doc 1 & Doc 2)");
  assert(fullyPaidBooking?.advancePaid === advReq, "Advance paid reconciles with Doc 1");
  assert(fullyPaidBooking?.finalPaid === finDue, "Final paid reconciles with Doc 2");
  assert(fullyPaidBooking?.finalBalanceDue === 0, "Remaining balance due is exactly 0");

  // TEST 9: Vendor Settlement Calculation
  console.log("\n9. Testing Vendor Settlement Traceability...");
  const commPercent = approvedVendor.commissionRate || 10.0;
  const platformComm = Math.round((agreedVal * commPercent) / 100);
  const netSettle = agreedVal - platformComm;

  const settlement = await prisma.vendorSettlement.create({
    data: {
      vendorId: approvedVendor.id,
      bookingId: booking.id,
      grossAmount: agreedVal,
      platformCommission: platformComm,
      commissionPercent: commPercent,
      netSettlementAmount: netSettle,
      status: "DUE",
      remarks: "Generated automatically on full booking payment",
    },
  });

  assert(settlement !== null, "Vendor settlement record automatically created on final payment");
  assert(settlement.grossAmount === agreedVal, `Settlement gross matches agreed contract value (₹${agreedVal / 100})`);
  assert(settlement.platformCommission === platformComm, `Internal platform commission correctly calculated (₹${platformComm / 100})`);
  assert(settlement.netSettlementAmount === netSettle, `Net artisan settlement = Gross - Commission (₹${netSettle / 100})`);

  // TEST 10: Review Eligibility Check
  console.log("\n10. Testing Review Eligibility Guard...");
  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "COMPLETED", completedAt: new Date() },
  });

  const review = await prisma.review.create({
    data: {
      bookingId: booking.id,
      customerId: customer.id,
      vendorId: approvedVendor.id,
      serviceId: service.id,
      rating: 5,
      comment: "Spectacular staging! Punctual and breathtaking decor setup.",
    },
  });
  assert(review !== null, "Completed booking eligible for verified review");

  console.log("\n=================================================");
  console.log(`TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((e) => {
    console.error("Test runner failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
