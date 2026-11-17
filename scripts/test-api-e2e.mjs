/**
 * Celebrating YOU — Full HTTP API Workflow Test Suite
 *
 * Starts Next.js production server on a dedicated test port (3005)
 * and executes genuine HTTP requests against all platform endpoints:
 * - Customer & Admin Authentication & RBAC
 * - Unauthorized & Cross-Tenant Access Protection
 * - Event & Service Management
 * - Calendar Availability & Double-Booking Prevention
 * - 2-Hour SLA State Machine & Vendor Acceptance
 * - Advance & Final Payments with Milestones
 * - Mandatory Transaction Documents (Doc 1 & Doc 2)
 * - Vendor Payout Settlement Calculations
 * - Reviews, Complaints, and Admin Operations
 * - Cron Security and Session Invalidation
 */

import { spawn } from "child_process";
import http from "http";

const TEST_PORT = 3005;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

let serverProcess = null;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(retries = 30) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`${BASE_URL}/api/templates`);
      if (res.ok) {
        return true;
      }
    } catch {
      await sleep(1000);
    }
  }
  throw new Error("Test server failed to start within timeout");
}

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failedTests++;
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runApiTests() {
  console.log("=================================================");
  console.log("CELEBRATING YOU — END-TO-END HTTP API TEST SUITE");
  console.log("=================================================");

  // 1. Check Public APIs
  console.log("\n1. Testing Public Endpoints...");
  const templatesRes = await fetch(`${BASE_URL}/api/templates`);
  assert(templatesRes.status === 200, "GET /api/templates returns 200 OK");
  const templatesData = await templatesRes.json();
  assert(templatesData.templates.length >= 5, "Templates catalog contains at least 5 blueprints");

  const exploreRes = await fetch(`${BASE_URL}/api/services/explore`);
  assert(exploreRes.status === 200, "GET /api/services/explore returns 200 OK");
  const exploreData = await exploreRes.json();
  assert(exploreData.services.length > 0, "Explore services endpoint returns verified published services");

  // 2. Authentication & Isolation
  console.log("\n2. Testing Authentication & Cross-Role Isolation...");

  // Customer register
  const testEmail = `test.client.${Date.now()}@example.com`;
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testEmail,
      password: "ClientPass@123",
      name: "Ananya Sharma",
      phone: "+91 98765 43210",
      city: "Bangalore",
    }),
  });
  assert(regRes.status === 200, "POST /api/auth/register creates customer");
  const regCookie = regRes.headers.get("set-cookie");
  assert(regCookie && regCookie.includes("cy_session"), "Register sets HTTP-only cy_session cookie");

  // Customer login
  const custLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testEmail,
      password: "ClientPass@123",
      role: "CUSTOMER",
    }),
  });
  assert(custLoginRes.status === 200, "POST /api/auth/login succeeds for valid customer credentials");
  const custCookie = custLoginRes.headers.get("set-cookie").split(";")[0];

  // Admin login via customer portal must be rejected
  const adminViaCustPortal = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@celebratingyou.com",
      password: "Admin@12345",
    }),
  });
  assert(adminViaCustPortal.status === 403, "Admin login attempt on public login portal rejected with 403 Forbidden");

  // Admin login via dedicated portal
  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/admin-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@celebratingyou.com",
      password: "Admin@12345",
    }),
  });
  assert(adminLoginRes.status === 200, "POST /api/auth/admin-login succeeds with 200 OK");
  const adminCookie = adminLoginRes.headers.get("set-cookie").split(";")[0];

  // Non-admin login via admin portal must be rejected
  const nonAdminViaAdmin = await fetch(`${BASE_URL}/api/auth/admin-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testEmail,
      password: "ClientPass@123",
    }),
  });
  assert(nonAdminViaAdmin.status === 401, "Non-admin user attempt on admin portal rejected with 401");

  // Vendor login
  const vendLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "studio@memories.com",
      password: "Vendor@12345",
      role: "VENDOR",
    }),
  });
  assert(vendLoginRes.status === 200, "POST /api/auth/login succeeds for verified vendor");
  const vendorCookie = vendLoginRes.headers.get("set-cookie").split(";")[0];

  // 3. Unauthorized API Protection
  console.log("\n3. Testing Unauthorized Access Rejection...");
  const unauthRes = await fetch(`${BASE_URL}/api/customer/bookings`);
  assert(unauthRes.status === 401, "GET /api/customer/bookings without cookie returns 401 Unauthorized");

  const unauthAdmin = await fetch(`${BASE_URL}/api/admin/overview`, {
    headers: { Cookie: custCookie },
  });
  assert(unauthAdmin.status === 403, "Customer cookie accessing /api/admin/overview returns 403 Forbidden");

  // 4. Event Creation & Booking Flow
  console.log("\n4. Testing Event Creation & Booking Flow...");
  const dynamicDay = String(10 + Math.floor(Math.random() * 18));
  const testEventDate = `2027-02-${dynamicDay}`;

  const eventRes = await fetch(`${BASE_URL}/api/customer/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: custCookie },
    body: JSON.stringify({
      title: "Ananya's Silver Jubilee Gala",
      eventType: "Anniversary",
      eventDate: testEventDate,
      locationAddress: "The Leela Palace, Old Airport Road",
      city: "Bangalore",
      state: "Karnataka",
      guestCount: 120,
      overallBudget: 50000000, // ₹5,00,000
    }),
  });
  assert(eventRes.status === 200, "POST /api/customer/events creates celebration event");
  const eventData = await eventRes.json();
  const eventId = eventData.event.id;
  assert(eventId, "Created event returns valid ID");

  // Fetch verified photography service
  const targetService = exploreData.services.find(
    (s) => s.vendor.businessName.includes("Lumière") || s.title.includes("Royal Candid")
  );
  assert(targetService, "Found Lumière Cinematics photography service");

  // Submit booking request
  const bookingReqRes = await fetch(`${BASE_URL}/api/customer/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: custCookie },
    body: JSON.stringify({
      eventId,
      serviceId: targetService.id,
      packageId: targetService.packages[0]?.id,
      eventDate: testEventDate,
      specialRequirements: "Candid cinematography and traditional stage photography",
    }),
  });
  assert(bookingReqRes.status === 200, "POST /api/customer/bookings creates booking request");
  const bookingData = await bookingReqRes.json();
  const bookingId = bookingData.booking.id;
  assert(bookingData.booking.status === "REQUEST_SUBMITTED", "Initial booking status is REQUEST_SUBMITTED");
  assert(bookingData.booking.responseDeadlineAt, "Two-hour response deadline is recorded on backend");

  // 5. Contact Privacy Masking
  console.log("\n5. Testing Contact Privacy Masking...");
  const customerViewRes = await fetch(`${BASE_URL}/api/customer/bookings/${bookingId}`, {
    headers: { Cookie: custCookie },
  });
  assert(customerViewRes.status === 200, "Customer can fetch booking details");
  const customerView = await customerViewRes.json();
  assert(
    customerView.booking.vendor.phone.includes("🔒"),
    "Vendor phone is strictly masked with lock symbol before advance payment"
  );
  assert(
    customerView.booking.vendor.bankAccountNumber === undefined,
    "Vendor bank details are excluded from customer response"
  );

  // 6. Double-Booking Prevention
  console.log("\n6. Testing Double-Booking Prevention...");
  // Try to create another booking for same service on same date
  const secondCustEmail = `second.client.${Date.now()}@example.com`;
  const reg2 = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: secondCustEmail,
      password: "ClientPass@123",
      name: "Rohit Roy",
      phone: "+91 99887 76655",
      city: "Bangalore",
    }),
  });
  const cust2Cookie = reg2.headers.get("set-cookie").split(";")[0];

  // Create event for customer 2
  const event2Res = await fetch(`${BASE_URL}/api/customer/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cust2Cookie },
    body: JSON.stringify({
      title: "Rohit's Corporate Meet",
      eventType: "Corporate",
      eventDate: testEventDate,
      locationAddress: "Whitefield Tech Park",
      city: "Bangalore",
      state: "Karnataka",
      overallBudget: 20000000,
    }),
  });
  const event2Data = await event2Res.json();

  // Cross-Customer Isolation: Customer 2 cannot cancel or modify Customer 1's booking
  const crossCancelRes = await fetch(`${BASE_URL}/api/customer/bookings/${bookingId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Cookie: cust2Cookie },
    body: JSON.stringify({ action: "CANCEL" }),
  });
  assert(
    crossCancelRes.status === 404,
    "Customer 2 attempting to cancel Customer 1's booking is rejected with 404/Unauthorized"
  );

  // 7. Vendor Response & Acceptance
  console.log("\n7. Testing Vendor Response & 2-Hour State Machine...");
  const acceptRes = await fetch(`${BASE_URL}/api/vendor/bookings/${bookingId}/respond`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: vendorCookie },
    body: JSON.stringify({ decision: "ACCEPT" }),
  });
  assert(acceptRes.status === 200, "POST /api/vendor/bookings/:id/respond accepts booking request");
  const acceptData = await acceptRes.json();
  assert(
    acceptData.booking.status === "ACCEPTED_AWAITING_ADVANCE",
    "Status transitioned to ACCEPTED_AWAITING_ADVANCE"
  );

  // 8. Advance Payment & Document 1 (Invoice 1)
  console.log("\n8. Testing Advance Payment & Mandatory Document 1...");
  const advPayRes = await fetch(`${BASE_URL}/api/customer/pay`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: custCookie },
    body: JSON.stringify({
      bookingId,
      type: "ADVANCE",
      idempotencyKey: `idem_adv_${bookingId}`,
    }),
  });
  assert(advPayRes.status === 200, "POST /api/customer/pay processes advance milestone");
  const advPayData = await advPayRes.json();
  assert(advPayData.invoice.type === "ADVANCE", "Invoice 1 generated with type: ADVANCE");
  assert(
    advPayData.invoice.invoiceNumber.startsWith("CY-INV-ADV-"),
    `Advance Invoice Number formatted correctly: ${advPayData.invoice.invoiceNumber}`
  );
  assert(advPayData.invoice.remainingBalanceDue > 0, "Remaining balance due tracked on Document 1");

  // Verify contact details are now unlocked!
  const confirmedCustView = await fetch(`${BASE_URL}/api/customer/bookings/${bookingId}`, {
    headers: { Cookie: custCookie },
  });
  const confViewData = await confirmedCustView.json();
  assert(
    !confViewData.booking.vendor.phone.includes("🔒"),
    "Vendor phone is unlocked after advance payment confirmation"
  );

  // Verify Double-Booking is strictly blocked once confirmed!
  const doubleBookRes = await fetch(`${BASE_URL}/api/customer/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cust2Cookie },
    body: JSON.stringify({
      eventId: event2Data.event.id,
      serviceId: targetService.id,
      eventDate: testEventDate,
    }),
  });
  assert(
    doubleBookRes.status === 400,
    "Double-booking on the same date for confirmed service is strictly blocked with 400"
  );

  // 9. Final Payment & Document 2 (Invoice 2)
  console.log("\n9. Testing Final Payment & Mandatory Document 2...");
  const finPayRes = await fetch(`${BASE_URL}/api/customer/pay`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: custCookie },
    body: JSON.stringify({
      bookingId,
      type: "FINAL",
      idempotencyKey: `idem_fin_${bookingId}`,
    }),
  });
  assert(finPayRes.status === 200, "POST /api/customer/pay processes final milestone");
  const finPayData = await finPayRes.json();
  assert(finPayData.invoice.type === "FINAL", "Invoice 2 generated with type: FINAL");
  assert(
    finPayData.invoice.invoiceNumber.startsWith("CY-INV-FIN-"),
    `Final Invoice Number formatted correctly: ${finPayData.invoice.invoiceNumber}`
  );
  assert(finPayData.invoice.remainingBalanceDue === 0, "Remaining balance due is exactly 0 on Document 2");

  // Verify Vendor Invoices Dashboard
  const vendInvoicesRes = await fetch(`${BASE_URL}/api/vendor/invoices`, {
    headers: { Cookie: vendorCookie },
  });
  assert(vendInvoicesRes.status === 200, "GET /api/vendor/invoices succeeds");
  const vendInvoicesData = await vendInvoicesRes.json();
  const bookingInvoices = vendInvoicesData.invoices.filter((i) => i.bookingId === bookingId);
  assert(bookingInvoices.length === 2, "Booking has exactly 2 transaction-wise documents (Advance & Final)");

  // 10. Vendor Settlement Calculation
  console.log("\n10. Testing Vendor Settlement Traceability...");
  const vendFinRes = await fetch(`${BASE_URL}/api/vendor/financials`, {
    headers: { Cookie: vendorCookie },
  });
  assert(vendFinRes.status === 200, "GET /api/vendor/financials returns financial data");
  const vendFinData = await vendFinRes.json();
  const settlement = vendFinData.settlements.find((s) => s.bookingId === bookingId);
  assert(settlement, "Settlement record created upon final payment completion");
  assert(
    settlement.netSettlementAmount === settlement.grossAmount - settlement.platformCommission,
    `Net payout = Gross (₹${settlement.grossAmount / 100}) - Commission (₹${settlement.platformCommission / 100})`
  );

  // 11. Review Submission Guard
  console.log("\n11. Testing Review Submission Guard...");
  // Vendor completes the service delivery
  const completeRes = await fetch(`${BASE_URL}/api/vendor/bookings/${bookingId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Cookie: vendorCookie },
    body: JSON.stringify({ status: "COMPLETED", note: "Photography and edited album delivered" }),
  });
  assert(completeRes.status === 200, "Vendor marks booking as COMPLETED after service execution");

  const reviewRes = await fetch(`${BASE_URL}/api/customer/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: custCookie },
    body: JSON.stringify({
      bookingId,
      rating: 5,
      comment: "Outstanding photography! Captured every emotion with breathtaking perfection.",
    }),
  });
  assert(reviewRes.status === 200, "POST /api/customer/reviews records verified review for completed service");

  // Duplicate review should be rejected
  const dupReviewRes = await fetch(`${BASE_URL}/api/customer/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: custCookie },
    body: JSON.stringify({
      bookingId,
      rating: 4,
      comment: "Trying to submit a second review",
    }),
  });
  assert(dupReviewRes.status === 400, "Duplicate review submission rejected with 400");

  // 12. Private Dispute & Complaint System
  console.log("\n12. Testing Private Complaint System...");
  const complaintRes = await fetch(`${BASE_URL}/api/customer/complaints`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: custCookie },
    body: JSON.stringify({
      bookingId,
      subject: "Request for extra RAW format cuts",
      description: "Need additional unedited RAW camera clips for cinematic reel.",
      priority: "MEDIUM",
    }),
  });
  assert(complaintRes.status === 200, "POST /api/customer/complaints submits private ticket");

  // 13. Admin Management & Audit Logs
  console.log("\n13. Testing Admin Management & Audit Logging...");
  const adminComplaintsRes = await fetch(`${BASE_URL}/api/admin/complaints`, {
    headers: { Cookie: adminCookie },
  });
  assert(adminComplaintsRes.status === 200, "GET /api/admin/complaints returns dispute queue");

  const adminOverviewRes = await fetch(`${BASE_URL}/api/admin/overview`, {
    headers: { Cookie: adminCookie },
  });
  assert(adminOverviewRes.status === 200, "GET /api/admin/overview returns platform financial metrics");
  const adminOverview = await adminOverviewRes.json();
  assert(adminOverview.metrics.financials.paymentsCollected > 0, "Platform collected payments recorded in paise");

  // 14. Cron Security Authentication
  console.log("\n14. Testing Cron Authentication Secret...");
  const unauthCron = await fetch(`${BASE_URL}/api/cron/check-expiries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  assert(unauthCron.status === 401, "POST /api/cron/check-expiries without token rejected with 401 Unauthorized");

  const cronRes = await fetch(`${BASE_URL}/api/cron/check-expiries`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer cy_cron_secure_token_987654",
    },
  });
  assert(cronRes.status === 200, "POST /api/cron/check-expiries succeeds with valid Bearer secret");

  // 15. Session Logout
  console.log("\n15. Testing Logout & Session Invalidation...");
  const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
    method: "POST",
    headers: { Cookie: custCookie },
  });
  assert(logoutRes.status === 200, "POST /api/auth/logout succeeds");
  const logoutCookie = logoutRes.headers.get("set-cookie");
  assert(
    logoutCookie && (logoutCookie.includes("max-age=0") || logoutCookie.includes("Max-Age=0")),
    "Logout clears cy_session cookie with Max-Age=0"
  );

  console.log("\n=================================================");
  console.log(`ALL HTTP API WORKFLOW TESTS PASSED: ${passedTests} / ${passedTests + failedTests}`);
  console.log("=================================================");
}

async function main() {
  console.log(`Starting Next.js production server on port ${TEST_PORT}...`);
  serverProcess = spawn("npx", ["next", "start", "-p", String(TEST_PORT)], {
    shell: true,
    stdio: "inherit",
    env: {
      ...process.env,
      PORT: String(TEST_PORT),
      CRON_SECRET: "cy_cron_secure_token_987654",
    },
  });

  try {
    await waitForServer();
    console.log(`Next.js test server ready on ${BASE_URL}`);
    await runApiTests();
  } finally {
    if (serverProcess) {
      console.log("Shutting down test server...");
      if (process.platform === "win32") {
        spawn("taskkill", ["/pid", String(serverProcess.pid), "/f", "/t"]);
      } else {
        serverProcess.kill("SIGTERM");
      }
    }
  }
}

main().catch((err) => {
  console.error("Test Suite execution failed:", err);
  process.exit(1);
});
