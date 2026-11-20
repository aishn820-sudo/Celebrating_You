import { spawn } from "child_process";
import { chromium } from "playwright";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const PORT = 3008;
const BASE_URL = `http://127.0.0.1:${PORT}`;

let serverProcess = null;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function startServer() {
  console.log(`Starting Next.js production server on port ${PORT}...`);
  serverProcess = spawn("node", ["node_modules/next/dist/bin/next", "start", "-p", String(PORT)], {
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, PORT: String(PORT) },
  });

  serverProcess.stdout.on("data", (d) => {
    const msg = d.toString();
    if (msg.includes("Error") || msg.includes("digest:")) {
      console.error("[Next.js Server Out]:", msg.trim());
    }
  });

  serverProcess.stderr.on("data", (d) => {
    const msg = d.toString();
    if (!msg.includes("non-standard") && !msg.includes("deprecated")) {
      console.error("[Next.js Server Err]:", msg.trim());
    }
  });

  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`${BASE_URL}/api/health`);
      if (res.ok) {
        console.log("✓ Next.js server is healthy and responding!");
        return;
      }
    } catch {
      await sleep(1000);
    }
  }
  throw new Error("Server failed to respond within 30 seconds");
}

async function stopServer() {
  if (serverProcess) {
    console.log("Stopping Next.js server...");
    serverProcess.kill();
    spawn("taskkill", ["/pid", serverProcess.pid, "/f", "/t"], { shell: true });
  }
  await prisma.$disconnect();
}

async function loginViaApi(email, password, role) {
  const endpoint = role === "ADMIN" ? "/api/auth/admin-login" : "/api/auth/login";
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Login failed for ${email}: ${err.error || res.statusText}`);
  }

  const setCookie = res.headers.get("set-cookie");
  if (!setCookie) throw new Error("No set-cookie returned from login");

  // Extract auth_token value
  const match = setCookie.match(/auth_token=([^;]+)/);
  if (!match) throw new Error("auth_token not found in cookie");

  return [{
    name: "auth_token",
    value: match[1],
    domain: "127.0.0.1",
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
  }];
}

async function runQaSuite() {
  try {
    await startServer();

    // Fetch dynamic IDs
    const service = await prisma.service.findFirst({ where: { status: "PUBLISHED" } });
    const event = await prisma.event.findFirst();
    const booking = await prisma.booking.findFirst();

    const serviceId = service?.id || "sample";
    const eventId = event?.id || "sample";
    const bookingId = booking?.id || "sample";

    console.log("\n========================================================");
    console.log("CELEBRATING YOU — AUTONOMOUS PLAYWRIGHT BROWSER TEST RUN");
    console.log("========================================================\n");

    const browser = await chromium.launch({
      channel: "chrome",
      headless: true,
    });

    const results = [];

    async function recordTest(category, route, action, assertionFn) {
      const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
      const page = await context.newPage();

      const consoleErrors = [];
      const pageErrors = [];

      page.on("console", (msg) => {
        if (msg.type() === "error") {
          const text = msg.text();
          if (!text.includes("favicon") && !text.includes("404")) {
            consoleErrors.push(text);
          }
        }
      });

      page.on("pageerror", (err) => {
        pageErrors.push(err.message);
      });

      let status = "PASS";
      let errorMsg = "";

      try {
        await assertionFn(page, context);
      } catch (err) {
        status = "FAIL";
        errorMsg = err.message;
      }

      const content = await page.content().catch(() => "");
      if (content.includes("Application error: a server-side exception has occurred")) {
        status = "FAIL";
        errorMsg = "Server-side exception (Application error) rendered on page!";
      }

      const totalErrors = pageErrors.length + (errorMsg ? 1 : 0);
      const displayStatus = totalErrors === 0 && status === "PASS" ? "PASS" : "FAIL";

      results.push({
        category,
        route,
        action,
        status: displayStatus,
        details: errorMsg || (consoleErrors.length > 0 ? `Console: ${consoleErrors[0]}` : "Healthy (200 OK)"),
      });

      console.log(`[${displayStatus}] [${category}] ${route} — ${action}`);
      if (displayStatus === "FAIL") {
        console.error(`       Error: ${errorMsg || consoleErrors.join("; ")}`);
      }

      await context.close();
    }

    // ----------------------------------------------------
    // 1. PUBLIC ROUTES (Unauthenticated)
    // ----------------------------------------------------
    await recordTest("Public", "/", "Load homepage & check hero & blueprints", async (page) => {
      await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
      const title = await page.textContent("h1");
      if (!title.includes("Every Celebration. One Place.")) {
        throw new Error(`Unexpected headline: ${title}`);
      }
      const cta = await page.waitForSelector('text="Plan My Celebration"');
      if (!cta) throw new Error("Missing primary CTA button");
    });

    await recordTest("Public", "/explore", "Load Explore & check occasion filters & services", async (page) => {
      await page.goto(`${BASE_URL}/explore`, { waitUntil: "networkidle" });
      const heading = await page.textContent("h1");
      if (!heading.includes("Explore Celebration Services")) {
        throw new Error(`Explore heading incorrect: ${heading}`);
      }
      const bdayPill = await page.waitForSelector('text="Birthday"');
      if (!bdayPill) throw new Error("Birthday occasion pill missing");
    });

    await recordTest("Public", `/services/${serviceId}`, "Load individual service detail page", async (page) => {
      await page.goto(`${BASE_URL}/services/${serviceId}`, { waitUntil: "networkidle" });
      const title = await page.textContent("h1");
      if (!title) throw new Error("Service title missing");
    });

    await recordTest("Public", "/templates", "Load celebration templates page", async (page) => {
      await page.goto(`${BASE_URL}/templates`, { waitUntil: "networkidle" });
      const title = await page.textContent("h1");
      if (!title.includes("Celebration Blueprints") && !title.includes("Curated")) {
        throw new Error(`Unexpected templates title: ${title}`);
      }
    });

    await recordTest("Public", "/plan", "Load guided 5-step planner", async (page) => {
      await page.goto(`${BASE_URL}/plan`, { waitUntil: "networkidle" });
      const heading = await page.textContent("h1");
      if (!heading.includes("Plan") || !heading.includes("Celebration")) {
        throw new Error(`Planner title incorrect: ${heading}`);
      }
    });

    await recordTest("Public", "/login", "Load customer/vendor login page", async (page) => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
      const heading = await page.textContent("h2");
      if (!heading.includes("Celebrating YOU")) throw new Error(`Login heading incorrect: ${heading}`);
    });

    await recordTest("Public", "/register", "Load customer registration page", async (page) => {
      await page.goto(`${BASE_URL}/register`, { waitUntil: "networkidle" });
      const heading = await page.textContent("h2");
      if (!heading.includes("Celebrating YOU")) throw new Error(`Register heading incorrect: ${heading}`);
    });

    // ----------------------------------------------------
    // 2. UNAUTHENTICATED REDIRECT PROTECTION
    // ----------------------------------------------------
    await recordTest("Security", "/customer/dashboard", "Redirect unauthenticated user to login", async (page) => {
      await page.goto(`${BASE_URL}/customer/dashboard`);
      await page.waitForURL(/login/);
    });

    await recordTest("Security", "/customer/bookings", "Redirect unauthenticated user to login", async (page) => {
      await page.goto(`${BASE_URL}/customer/bookings`);
      await page.waitForURL(/login/);
    });

    await recordTest("Security", "/vendor/dashboard", "Redirect unauthenticated user to login", async (page) => {
      await page.goto(`${BASE_URL}/vendor/dashboard`);
      await page.waitForURL(/login/);
    });

    await recordTest("Security", "/admin-portal/dashboard", "Redirect unauthenticated user to admin login", async (page) => {
      await page.goto(`${BASE_URL}/admin-portal/dashboard`);
      await page.waitForURL(/admin-portal\/login/);
    });

    // ----------------------------------------------------
    // 3. CUSTOMER AUTHENTICATED JOURNEY (Priya Sharma)
    // ----------------------------------------------------
    console.log("\nAuthenticating Customer session...");
    const customerCookies = await loginViaApi("priya@example.com", "Customer@12345", "CUSTOMER");
    console.log("✓ Customer cookies established!");

    await recordTest("Customer", "/customer/dashboard", "Check customer dashboard stats & countdown", async (page, ctx) => {
      await ctx.addCookies(customerCookies);
      await page.goto(`${BASE_URL}/customer/dashboard`, { waitUntil: "networkidle" });
      const welcome = await page.textContent("h1");
      if (!welcome.includes("Celebration Hub")) throw new Error(`Unexpected dashboard title: ${welcome}`);
    });

    await recordTest("Customer", "/customer/bookings", "Verify bookings page loads WITHOUT server exception (ISSUE A)", async (page, ctx) => {
      await ctx.addCookies(customerCookies);
      await page.goto(`${BASE_URL}/customer/bookings`, { waitUntil: "networkidle" });
      const heading = await page.textContent("h1");
      if (!heading.includes("Celebration Bookings")) {
        throw new Error(`Bookings title incorrect: ${heading}`);
      }
      await page.click('button:has-text("Confirmed")');
      await page.click('button:has-text("All Bookings")');
    });

    await recordTest("Customer", `/customer/bookings/${bookingId}`, "Verify single booking detail page", async (page, ctx) => {
      await ctx.addCookies(customerCookies);
      await page.goto(`${BASE_URL}/customer/bookings/${bookingId}`, { waitUntil: "networkidle" });
      const content = await page.textContent("body");
      if (!content.includes("Booking #")) throw new Error("Booking detail content missing");
    });

    await recordTest("Customer", "/customer/events", "Verify customer events page (ISSUE C)", async (page, ctx) => {
      await ctx.addCookies(customerCookies);
      await page.goto(`${BASE_URL}/customer/events`, { waitUntil: "networkidle" });
      const heading = await page.textContent("h1");
      if (!heading.includes("My Celebration Events")) throw new Error(`Events title incorrect: ${heading}`);

      // Test Quick Create modal opens
      await page.click('button:has-text("Quick Create")');
      const modal = await page.waitForSelector('text="Create Celebration Event"');
      if (!modal) throw new Error("Quick Create modal did not open");
      await page.keyboard.press("Escape");
    });

    await recordTest("Customer", `/customer/events/${eventId}`, "Verify event detail, Edit Details & Delete modals", async (page, ctx) => {
      await ctx.addCookies(customerCookies);
      await page.goto(`${BASE_URL}/customer/events/${eventId}`, { waitUntil: "networkidle" });
      const title = await page.textContent("h1");
      if (!title) throw new Error("Event title missing");

      // Test Edit Details button opens modal
      await page.click('button:has-text("Edit Details")');
      const editModal = await page.waitForSelector('text="Edit Celebration Details"');
      if (!editModal) throw new Error("Edit modal did not open");
      await page.keyboard.press("Escape");

      // Test Delete Event button opens confirmation modal
      await page.click('button:has-text("Delete Event")');
      const deleteModal = await page.waitForSelector('text="Delete Celebration Event"');
      if (!deleteModal) throw new Error("Delete modal did not open");
      await page.keyboard.press("Escape");
    });

    await recordTest("Customer", "/customer/invoices", "Verify customer transaction receipts page", async (page, ctx) => {
      await ctx.addCookies(customerCookies);
      await page.goto(`${BASE_URL}/customer/invoices`, { waitUntil: "networkidle" });
      const heading = await page.textContent("h1");
      if (!heading.includes("Transaction Receipts")) throw new Error(`Invoices title incorrect: ${heading}`);
    });

    // ----------------------------------------------------
    // 4. VENDOR AUTHENTICATED JOURNEY (Sneha / The Velvet Lens)
    // ----------------------------------------------------
    console.log("\nAuthenticating Vendor session...");
    const vendorCookies = await loginViaApi("vendor1@celebratingyou.com", "Vendor@12345", "VENDOR");
    console.log("✓ Vendor cookies established!");

    await recordTest("Vendor", "/vendor/dashboard", "Load vendor business dashboard", async (page, ctx) => {
      await ctx.addCookies(vendorCookies);
      await page.goto(`${BASE_URL}/vendor/dashboard`, { waitUntil: "networkidle" });
      const heading = await page.textContent("h1");
      if (!heading.includes("Vendor Operations Hub")) throw new Error(`Dashboard heading incorrect: ${heading}`);
    });

    await recordTest("Vendor", "/vendor/bookings", "Load vendor bookings & 2-hr response management", async (page, ctx) => {
      await ctx.addCookies(vendorCookies);
      await page.goto(`${BASE_URL}/vendor/bookings`, { waitUntil: "networkidle" });
      const heading = await page.textContent("h1");
      if (!heading.includes("Client Bookings")) throw new Error(`Vendor bookings heading incorrect: ${heading}`);
    });

    await recordTest("Vendor", "/vendor/calendar", "Load vendor blackout calendar & availability", async (page, ctx) => {
      await ctx.addCookies(vendorCookies);
      await page.goto(`${BASE_URL}/vendor/calendar`, { waitUntil: "networkidle" });
      const heading = await page.textContent("h1");
      if (!heading.includes("Calendar")) throw new Error(`Calendar heading incorrect: ${heading}`);
    });

    await recordTest("Vendor", "/vendor/services", "Load vendor service catalog management", async (page, ctx) => {
      await ctx.addCookies(vendorCookies);
      await page.goto(`${BASE_URL}/vendor/services`, { waitUntil: "networkidle" });
      const heading = await page.textContent("h1");
      if (!heading.includes("Service Catalog")) throw new Error(`Services heading incorrect: ${heading}`);
    });

    await recordTest("Vendor", "/vendor/profile", "Load vendor business profile", async (page, ctx) => {
      await ctx.addCookies(vendorCookies);
      await page.goto(`${BASE_URL}/vendor/profile`, { waitUntil: "networkidle" });
      const heading = await page.textContent("h1");
      if (!heading.includes("Business Profile")) throw new Error(`Profile heading incorrect: ${heading}`);
    });

    await recordTest("Vendor", "/vendor/invoices", "Load vendor transaction invoices", async (page, ctx) => {
      await ctx.addCookies(vendorCookies);
      await page.goto(`${BASE_URL}/vendor/invoices`, { waitUntil: "networkidle" });
      const heading = await page.textContent("h1");
      if (!heading.includes("Tax Invoices") && !heading.includes("Invoices")) throw new Error(`Invoices heading incorrect: ${heading}`);
    });

    await recordTest("Vendor", "/vendor/financials", "Load vendor payout settlements & commission ledger", async (page, ctx) => {
      await ctx.addCookies(vendorCookies);
      await page.goto(`${BASE_URL}/vendor/financials`, { waitUntil: "networkidle" });
      const heading = await page.textContent("h1");
      if (!heading.includes("Financials") && !heading.includes("Ledger") && !heading.includes("Earnings")) {
        throw new Error(`Financials heading incorrect: ${heading}`);
      }
    });

    // ----------------------------------------------------
    // 5. ADMIN AUTHENTICATED JOURNEY
    // ----------------------------------------------------
    console.log("\nAuthenticating Admin session...");
    const adminCookies = await loginViaApi("admin@celebratingyou.com", "Admin@12345", "ADMIN");
    console.log("✓ Admin cookies established!");

    const adminRoutes = [
      { route: "/admin-portal/dashboard", titleKeyword: "Control Center" },
      { route: "/admin-portal/vendors", titleKeyword: "Vendor" },
      { route: "/admin-portal/services", titleKeyword: "Services" },
      { route: "/admin-portal/customers", titleKeyword: "Customers" },
      { route: "/admin-portal/bookings", titleKeyword: "Bookings" },
      { route: "/admin-portal/financials", titleKeyword: "Financial" },
      { route: "/admin-portal/complaints", titleKeyword: "Complaints" },
      { route: "/admin-portal/audit-logs", titleKeyword: "Audit" },
    ];

    for (const r of adminRoutes) {
      await recordTest("Admin", r.route, `Load ${r.route} verified by title`, async (page, ctx) => {
        await ctx.addCookies(adminCookies);
        await page.goto(`${BASE_URL}${r.route}`, { waitUntil: "networkidle" });
        const h1 = await page.textContent("h1");
        if (!h1.toLowerCase().includes(r.titleKeyword.toLowerCase())) {
          throw new Error(`Expected title to include '${r.titleKeyword}', got '${h1}'`);
        }
      });
    }

    // ----------------------------------------------------
    // 6. RESPONSIVE MOBILE VIEWPORT (390 x 844)
    // ----------------------------------------------------
    await recordTest("Responsive", "/ (Mobile 390x844)", "Verify mobile layout, hero, and navigation", async (page) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
      const h1 = await page.textContent("h1");
      if (!h1.includes("Every Celebration")) throw new Error("Mobile hero heading failed");
    });

    await recordTest("Responsive", "/explore (Mobile 390x844)", "Verify mobile explore filters & grid", async (page) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`${BASE_URL}/explore`, { waitUntil: "networkidle" });
      const h1 = await page.textContent("h1");
      if (!h1.includes("Explore Celebration")) throw new Error("Mobile explore heading failed");
    });

    // ----------------------------------------------------
    // SUMMARY REPORT
    // ----------------------------------------------------
    await browser.close();

    console.log("\n========================================================");
    console.log("                 QA TEST MATRIX RESULTS                 ");
    console.log("========================================================");

    let passedCount = 0;
    let failedCount = 0;

    for (const res of results) {
      if (res.status === "PASS") passedCount++;
      else failedCount++;
    }

    console.table(results);
    console.log(`\nTOTAL: ${results.length} | PASSED: ${passedCount} | FAILED: ${failedCount}`);

    if (failedCount > 0) {
      console.error("\n❌ Autonomous QA finished with failures.");
      process.exitCode = 1;
    } else {
      console.log("\n🎉 ALL AUTONOMOUS BROWSER & ROUTE TESTS PASSED WITH ZERO ERRORS!");
    }
  } catch (err) {
    console.error("FATAL SUITE ERROR:", err);
    process.exitCode = 1;
  } finally {
    await stopServer();
  }
}

runQaSuite();
