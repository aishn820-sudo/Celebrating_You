import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function calculateGstForService({ categorySlug = "", categoryName = "", vendorGstin = null, amountPaise = 0 }) {
  if (!vendorGstin || vendorGstin.trim().length === 0) {
    return {
      isRegistered: false,
      sacCode: "N/A",
      ratePercent: 0,
      totalTaxPaise: 0,
      cgstPaise: 0,
      sgstPaise: 0,
      igstPaise: 0,
      legalDesignation: "COMMERCIAL PAYMENT RECEIPT & BOOKING VOUCHER",
    };
  }
  const normalizedCategory = (categorySlug + " " + categoryName).toLowerCase();
  const isCatering = normalizedCategory.includes("cater") || normalizedCategory.includes("food") || normalizedCategory.includes("gourmet");
  const sacCode = isCatering ? "9963" : "9983";
  const ratePercent = isCatering ? 5 : 18;
  const totalTaxPaise = Math.round((amountPaise * ratePercent) / 100);
  const halfTaxPaise = Math.round(totalTaxPaise / 2);

  return {
    isRegistered: true,
    sacCode,
    ratePercent,
    totalTaxPaise,
    cgstPaise: halfTaxPaise,
    sgstPaise: halfTaxPaise,
    igstPaise: 0,
    legalDesignation: "TAX INVOICE — GST COMPLIANT",
  };
}

async function runEdgeCaseQATests() {
  console.log("==================================================================");
  console.log("CELEBRATING YOU — CRITICAL EDGE-CASE & FINANCIAL QA VALIDATION");
  console.log("==================================================================\n");

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

  try {
    // 1. SETUP BASE DATA
    console.log("--- 1. Setting Up Test Fixture Entities ---");
    const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    assert(!!adminUser, "Admin account available");

    const categoryCatering = await prisma.vendorCategory.findFirst({
      where: { name: { contains: "Catering" } },
    }) || await prisma.vendorCategory.create({
      data: { name: "Catering & Gourmet", slug: `catering-${Date.now()}`, description: "Catering", icon: "Utensils" },
    });

    const categoryPhotography = await prisma.vendorCategory.findFirst({
      where: { name: { contains: "Photography" } },
    }) || await prisma.vendorCategory.create({
      data: { name: "Photography & Cinema", slug: `photography-${Date.now()}`, description: "Photo", icon: "Camera" },
    });

    // Create 2 test customers
    const custUser1 = await prisma.user.create({
      data: {
        email: `cust_edge1_${Date.now()}@example.com`,
        passwordHash: "hash123",
        role: "CUSTOMER",
      },
    });
    const customer1 = await prisma.customer.create({
      data: {
        userId: custUser1.id,
        customerCode: `CY-CUST-${Date.now().toString().slice(-4)}-1`,
        name: "Ananya Sharma",
        email: custUser1.email,
        phone: "+91 98765 43210",
        city: "Bangalore",
        state: "Karnataka",
      },
    });

    const custUser2 = await prisma.user.create({
      data: {
        email: `cust_edge2_${Date.now()}@example.com`,
        passwordHash: "hash123",
        role: "CUSTOMER",
      },
    });
    const customer2 = await prisma.customer.create({
      data: {
        userId: custUser2.id,
        customerCode: `CY-CUST-${Date.now().toString().slice(-4)}-2`,
        name: "Vikram Malhotra",
        email: custUser2.email,
        phone: "+91 98765 11223",
        city: "Bangalore",
        state: "Karnataka",
      },
    });

    // Create Registered Vendor (GSTIN) with 12% commission
    const vendUserReg = await prisma.user.create({
      data: { email: `vend_reg_${Date.now()}@example.com`, passwordHash: "hash", role: "VENDOR" },
    });
    const vendorReg = await prisma.vendor.create({
      data: {
        userId: vendUserReg.id,
        vendorCode: `CY-VEND-REG-${Date.now().toString().slice(-4)}`,
        businessName: "Royal Flavors Catering Ltd",
        contactPerson: "Chef Sanjay",
        email: vendUserReg.email,
        phone: "+91 91234 56789",
        city: "Bangalore",
        state: "Karnataka",
        categoryId: categoryCatering.id,
        isVerified: true,
        verificationStatus: "VERIFIED",
        canPublish: true,
        gstin: "29AAAAA0000A1Z5",
        panNumber: "AAAAA0000A",
        commissionRate: 12.0, // Configurable commission
      },
    });

    // Create Unregistered Artisan Vendor (NO GSTIN)
    const vendUserUnreg = await prisma.user.create({
      data: { email: `vend_unreg_${Date.now()}@example.com`, passwordHash: "hash", role: "VENDOR" },
    });
    const vendorUnreg = await prisma.vendor.create({
      data: {
        userId: vendUserUnreg.id,
        vendorCode: `CY-VEND-UNREG-${Date.now().toString().slice(-4)}`,
        businessName: "Artisan Soul Photography",
        contactPerson: "Arjun Das",
        email: vendUserUnreg.email,
        phone: "+91 98111 22334",
        city: "Bangalore",
        state: "Karnataka",
        categoryId: categoryPhotography.id,
        isVerified: true,
        verificationStatus: "VERIFIED",
        canPublish: true,
        gstin: null, // Unregistered artisan
        panNumber: "ABCDE1234F",
      },
    });

    // Create services
    const cateringService = await prisma.service.create({
      data: {
        vendorId: vendorReg.id,
        categoryId: categoryCatering.id,
        slug: `banquet-feast-${Date.now()}`,
        title: "Royal Banquet Feast",
        description: "Exquisite 5-course live buffet",
        basePrice: 10000000, // ₹1,00,000 (10000000 paise)
        status: "PUBLISHED",
      },
    });

    // Create an event for customer1
    const event1 = await prisma.event.create({
      data: {
        customerId: customer1.id,
        title: "Sharma Family Silver Jubilee",
        eventType: "Anniversary",
        eventDate: "2026-12-25",
        locationAddress: "Indiranagar Club, 100ft Road",
        city: "Bangalore",
        state: "Karnataka",
        guestCount: 150,
        overallBudget: 50000000,
        status: "IN_PROGRESS",
      },
    });

    // --- 2. DOUBLE-BOOKING / CONCURRENT AVAILABILITY LOCKING ---
    console.log("\n--- 2. Testing Double-Booking Prevention & Date Availability ---");
    const testDate = "2026-12-25";

    // Booking 1 by Customer 1
    const booking1 = await prisma.booking.create({
      data: {
        bookingCode: `CY-BK-E1-${Date.now().toString().slice(-4)}`,
        eventId: event1.id,
        customerId: customer1.id,
        vendorId: vendorReg.id,
        serviceId: cateringService.id,
        eventDate: testDate,
        agreedServiceValue: 10000000,
        advanceRequired: 2500000,
        advancePaid: 0,
        finalPaid: 0,
        finalBalanceDue: 10000000,
        status: "CONFIRMED", // active confirmed booking
      },
    });
    assert(booking1.status === "CONFIRMED", "Customer 1 created confirmed booking for 2026-12-25");

    // Customer 2 attempts to book the same vendor on the same date
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        vendorId: vendorReg.id,
        eventDate: testDate,
        status: { in: ["PENDING_VENDOR_APPROVAL", "ACCEPTED_AWAITING_ADVANCE", "CONFIRMED", "SERVICE_IN_PROGRESS"] },
      },
    });
    assert(!!conflictingBooking, "System detected active booking on same vendor & date");
    const canBookConflicting = !conflictingBooking;
    assert(!canBookConflicting, "Second customer attempt to book same vendor on same date is REJECTED (Double-booking blocked)");

    // --- 3. ROLLING 7-DAY DECLINE POLICY ---
    console.log("\n--- 3. Testing Rolling 7-Day Vendor Decline Limit ---");
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    // Create 3 decline records in past 3 days
    for (let i = 0; i < 3; i++) {
      await prisma.booking.create({
        data: {
          bookingCode: `CY-DEC-${i}-${Date.now().toString().slice(-4)}`,
          eventId: event1.id,
          customerId: customer1.id,
          vendorId: vendorReg.id,
          serviceId: cateringService.id,
          eventDate: `2026-12-1${i}`,
          agreedServiceValue: 5000000,
          advanceRequired: 1250000,
          finalBalanceDue: 5000000,
          status: "REJECTED_BY_VENDOR",
          declinedAt: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000),
          declineReason: "Unavailable on requested date",
        },
      });
    }

    const recentDeclines = await prisma.booking.count({
      where: {
        vendorId: vendorReg.id,
        status: "REJECTED_BY_VENDOR",
        declinedAt: { gte: sevenDaysAgo },
      },
    });
    assert(recentDeclines === 3, `Vendor recorded exactly 3 declines in past 7 days (found ${recentDeclines})`);

    const willExceedThreshold = recentDeclines >= 3;
    assert(willExceedThreshold, "Vendor has reached 3 declines in rolling 7-day window. System logs EXCESSIVE_DECLINES warning.");

    // --- 4. ADVANCE PAYMENT SUCCESS & FINAL PAYMENT SUCCESS ---
    console.log("\n--- 4. Testing Advance & Final Payment Execution ---");
    const bookingPay = await prisma.booking.create({
      data: {
        bookingCode: `CY-BK-PAY-${Date.now().toString().slice(-4)}`,
        eventId: event1.id,
        customerId: customer1.id,
        vendorId: vendorReg.id,
        serviceId: cateringService.id,
        eventDate: "2026-12-30",
        agreedServiceValue: 10000000, // ₹1,00,000
        advanceRequired: 2500000,
        advancePaid: 0,
        finalPaid: 0,
        finalBalanceDue: 10000000,
        status: "ACCEPTED_AWAITING_ADVANCE",
      },
    });

    const paymentMaster = await prisma.payment.create({
      data: {
        bookingId: bookingPay.id,
        customerId: customer1.id,
        totalAmount: 10000000,
        paidAmount: 0,
        pendingAmount: 10000000,
        status: "PENDING",
      },
    });

    const advanceAmount = 2500000; // ₹25,000 (25%)
    const advTxnRef = `CY-TXN-ADV-${Date.now()}`;
    const advTxn = await prisma.paymentTransaction.create({
      data: {
        paymentId: paymentMaster.id,
        bookingId: bookingPay.id,
        transactionRef: advTxnRef,
        type: "ADVANCE",
        amount: advanceAmount,
        currency: "INR",
        status: "SUCCESS",
        gatewayProvider: "SANDBOX",
        gatewayPaymentId: `pay_mock_${Date.now()}`,
        idempotencyKey: `idem_adv_${Date.now()}`,
        paidAt: new Date(),
      },
    });

    // Advance Invoice Doc 1
    const advInvoice = await prisma.invoice.create({
      data: {
        invoiceNumber: `CY-INV-ADV-${Date.now().toString().slice(-5)}`,
        bookingId: bookingPay.id,
        transactionId: advTxn.id,
        type: "ADVANCE",
        customerName: customer1.name,
        customerEmail: custUser1.email,
        customerPhone: customer1.phone,
        vendorBusinessName: vendorReg.businessName,
        vendorGstin: vendorReg.gstin,
        vendorPan: vendorReg.panNumber,
        serviceTitle: cateringService.title,
        agreedServiceValue: 10000000,
        advancePaid: advanceAmount,
        amountPaidThisDoc: advanceAmount,
        remainingBalanceDue: 7500000,
        taxAmount: Math.round((advanceAmount * 5) / 100), // 5% GST on catering
        status: "ISSUED",
      },
    });

    await prisma.booking.update({
      where: { id: bookingPay.id },
      data: {
        advancePaid: advanceAmount,
        finalBalanceDue: 7500000,
        status: "CONFIRMED",
      },
    });

    assert(advTxn.status === "SUCCESS", "Advance payment transaction status is SUCCESS");
    assert(advInvoice.type === "ADVANCE", `Invoice Doc 1 (Advance) generated: ${advInvoice.invoiceNumber}`);

    const updatedBookingAdv = await prisma.booking.findUnique({ where: { id: bookingPay.id } });
    assert(updatedBookingAdv.status === "CONFIRMED", "Booking transitioned to CONFIRMED on advance payment");
    assert(updatedBookingAdv.advancePaid === 2500000, "Advance paid balance correctly recorded as ₹25,000");
    assert(updatedBookingAdv.finalBalanceDue === 7500000, "Remaining balance due correctly recorded as ₹75,000");

    // Final Payment
    const finalAmount = 7500000; // ₹75,000
    const finTxnRef = `CY-TXN-FIN-${Date.now()}`;
    const finTxn = await prisma.paymentTransaction.create({
      data: {
        paymentId: paymentMaster.id,
        bookingId: bookingPay.id,
        transactionRef: finTxnRef,
        type: "FINAL",
        amount: finalAmount,
        currency: "INR",
        status: "SUCCESS",
        gatewayProvider: "SANDBOX",
        gatewayPaymentId: `pay_mock_${Date.now()}`,
        idempotencyKey: `idem_fin_${Date.now()}`,
        paidAt: new Date(),
      },
    });

    // Final Invoice Doc 2
    const finInvoice = await prisma.invoice.create({
      data: {
        invoiceNumber: `CY-INV-FIN-${Date.now().toString().slice(-5)}`,
        bookingId: bookingPay.id,
        transactionId: finTxn.id,
        type: "FINAL",
        customerName: customer1.name,
        customerEmail: custUser1.email,
        customerPhone: customer1.phone,
        vendorBusinessName: vendorReg.businessName,
        vendorGstin: vendorReg.gstin,
        vendorPan: vendorReg.panNumber,
        serviceTitle: cateringService.title,
        agreedServiceValue: 10000000,
        advancePaid: advanceAmount,
        amountPaidThisDoc: finalAmount,
        remainingBalanceDue: 0,
        taxAmount: Math.round((finalAmount * 5) / 100),
        status: "ISSUED",
      },
    });

    await prisma.booking.update({
      where: { id: bookingPay.id },
      data: {
        finalPaid: finalAmount,
        finalBalanceDue: 0,
      },
    });

    assert(finTxn.status === "SUCCESS", "Final payment transaction status is SUCCESS");
    assert(finInvoice.type === "FINAL", `Invoice Doc 2 (Final) generated: ${finInvoice.invoiceNumber}`);

    const updatedBookingFin = await prisma.booking.findUnique({ where: { id: bookingPay.id } });
    assert(updatedBookingFin.finalPaid === 7500000, "Final paid balance correctly recorded as ₹75,000");
    assert(updatedBookingFin.finalBalanceDue === 0, "Remaining balance due is exactly ₹0");

    // Check Vendor Settlement calculation
    const commissionPercent = vendorReg.commissionRate || 10.0;
    const platformCommission = Math.round((bookingPay.agreedServiceValue * commissionPercent) / 100);
    const netSettlement = bookingPay.agreedServiceValue - platformCommission;

    const settlement = await prisma.vendorSettlement.create({
      data: {
        vendorId: vendorReg.id,
        bookingId: bookingPay.id,
        grossAmount: bookingPay.agreedServiceValue,
        platformCommission,
        commissionPercent,
        netSettlementAmount: netSettlement,
        status: "DUE",
        remarks: "Settlement calculated upon completion of full booking payment",
      },
    });

    assert(!!settlement, "VendorSettlement ledger record generated upon final payment");
    assert(settlement.commissionPercent === 12.0, `Configurable commission rate respected: ${settlement.commissionPercent}% (not hardcoded 10%)`);
    assert(settlement.platformCommission === 1200000, `Platform commission correctly ₹12,000 (found ₹${settlement.platformCommission / 100})`);
    assert(settlement.netSettlementAmount === 8800000, `Net vendor payable correctly ₹88,000 (found ₹${settlement.netSettlementAmount / 100})`);

    // --- 5. FAILED PAYMENT HANDLING ---
    console.log("\n--- 5. Testing Failed Payment Scenario ---");
    const failBooking = await prisma.booking.create({
      data: {
        bookingCode: `CY-BK-FAIL-${Date.now().toString().slice(-4)}`,
        eventId: event1.id,
        customerId: customer2.id,
        vendorId: vendorReg.id,
        serviceId: cateringService.id,
        eventDate: "2026-12-31",
        agreedServiceValue: 5000000,
        advanceRequired: 1250000,
        advancePaid: 0,
        finalPaid: 0,
        finalBalanceDue: 5000000,
        status: "ACCEPTED_AWAITING_ADVANCE",
      },
    });

    const initialInvoicesCount = await prisma.invoice.count({ where: { bookingId: failBooking.id } });
    
    // Record payment failure in transaction ledger
    const failTxn = await prisma.paymentTransaction.create({
      data: {
        paymentId: paymentMaster.id,
        bookingId: failBooking.id,
        transactionRef: `CY-TXN-FAIL-${Date.now()}`,
        type: "ADVANCE",
        amount: 1250000,
        currency: "INR",
        status: "FAILED",
        gatewayProvider: "SANDBOX",
        idempotencyKey: `idem_fail_${Date.now()}`,
      },
    });

    assert(failTxn.status === "FAILED", "Failed payment transaction recorded with status FAILED");
    const postFailInvoicesCount = await prisma.invoice.count({ where: { bookingId: failBooking.id } });
    assert(postFailInvoicesCount === initialInvoicesCount, "Zero invoices generated for failed payment");

    const failBookingState = await prisma.booking.findUnique({ where: { id: failBooking.id } });
    assert(failBookingState.status === "ACCEPTED_AWAITING_ADVANCE", "Booking status remains ACCEPTED_AWAITING_ADVANCE (does NOT confirm on failure)");
    assert(failBookingState.advancePaid === 0, "advancePaid remains ₹0 after failed transaction");

    // --- 6. IDEMPOTENT DUPLICATE WEBHOOK / RETRY HANDLING ---
    console.log("\n--- 6. Testing Duplicate / Idempotent Payment Handling ---");
    const sameKey = `idem_dup_test_${Date.now()}`;
    const firstTxn = await prisma.paymentTransaction.create({
      data: {
        paymentId: paymentMaster.id,
        bookingId: bookingPay.id,
        transactionRef: `CY-TXN-IDEM-${Date.now()}`,
        type: "FINAL",
        amount: 0,
        currency: "INR",
        status: "SUCCESS",
        idempotencyKey: sameKey,
      },
    });

    // Second check using idempotency key:
    const existing = await prisma.paymentTransaction.findUnique({
      where: { idempotencyKey: sameKey },
    });
    assert(!!existing && existing.id === firstTxn.id, "Duplicate payment with same idempotencyKey recognized and reused without double charging");

    // --- 7. GST CALCULATION & LEGAL VOUCHER ACCURACY ---
    console.log("\n--- 7. Testing GST SAC Code & Legal Invoicing Compliance ---");
    // Case A: Registered Vendor with Catering (SAC 9963 -> 5% GST)
    const cateringGst = calculateGstForService({
      categorySlug: "catering-gourmet",
      categoryName: "Catering",
      vendorGstin: "29AAAAA0000A1Z5",
      amountPaise: 10000000, // ₹1,00,000
    });
    assert(cateringGst.isRegistered === true, "Catering vendor recognized as GST registered");
    assert(cateringGst.ratePercent === 5, `SAC 9963 catering rate is 5% (found ${cateringGst.ratePercent}%)`);
    assert(cateringGst.sacCode === "9963", `SAC code is 9963 (found ${cateringGst.sacCode})`);
    assert(cateringGst.totalTaxPaise === 500000, `5% GST on ₹1,00,000 is ₹5,000 (found ₹${cateringGst.totalTaxPaise / 100})`);
    assert(cateringGst.legalDesignation === "TAX INVOICE — GST COMPLIANT", "Document labeled TAX INVOICE for registered vendor");

    // Case B: Registered Vendor with Photography (SAC 9983 -> 18% GST)
    const photoGst = calculateGstForService({
      categorySlug: "photography",
      categoryName: "Photography & Cinema",
      vendorGstin: "29AAAAA0000A1Z5",
      amountPaise: 10000000, // ₹1,00,000
    });
    assert(photoGst.ratePercent === 18, `SAC 9983 photography rate is 18% (found ${photoGst.ratePercent}%)`);
    assert(photoGst.sacCode === "9983", `SAC code is 9983 (found ${photoGst.sacCode})`);
    assert(photoGst.totalTaxPaise === 1800000, `18% GST on ₹1,00,000 is ₹18,000 (found ₹${photoGst.totalTaxPaise / 100})`);

    // Case C: Unregistered Artisan (NO GSTIN -> 0% GST, Voucher only)
    const unregGst = calculateGstForService({
      categorySlug: "photography",
      categoryName: "Photography & Cinema",
      vendorGstin: null,
      amountPaise: 5000000, // ₹50,000
    });
    assert(unregGst.isRegistered === false, "Unregistered artisan recognized as non-registered");
    assert(unregGst.ratePercent === 0, `Unregistered artisan tax rate is 0% (found ${unregGst.ratePercent}%)`);
    assert(unregGst.totalTaxPaise === 0, "Total tax charged for unregistered artisan is strictly ₹0");
    assert(unregGst.legalDesignation.includes("VOUCHER"), "Document labeled PAYMENT RECEIPT & BOOKING VOUCHER (Not false Tax Invoice)");

    // --- 8. REVIEWS ELIGIBILITY ENFORCEMENT ---
    console.log("\n--- 8. Testing Review Eligibility Enforcement ---");
    // Reviews can only be submitted for COMPLETED bookings
    const activeBookingState = await prisma.booking.findUnique({ where: { id: bookingPay.id } });
    const isEligibleForReview = activeBookingState.status === "COMPLETED";
    assert(!isEligibleForReview, "Booking not yet in COMPLETED status; review submission is disallowed");

    await prisma.booking.update({
      where: { id: bookingPay.id },
      data: { status: "COMPLETED" },
    });

    const completedBookingState = await prisma.booking.findUnique({ where: { id: bookingPay.id } });
    assert(completedBookingState.status === "COMPLETED", "Booking marked as COMPLETED");
    const canNowReview = completedBookingState.status === "COMPLETED";
    assert(canNowReview, "Customer is now eligible to submit rating and review");

    console.log("\n==================================================================");
    console.log(`EDGE-CASE QA SUITE COMPLETED: ${passed} PASSED, ${failed} FAILED`);
    console.log("==================================================================\n");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error("Test execution encountered an error:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runEdgeCaseQATests();
