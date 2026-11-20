async function test() {
  const baseUrl = "http://localhost:3000";
  console.log("=== EXECUTING END-TO-END ACCEPTANCE TESTS ===");

  // 1. Health check
  console.log("\n[TEST 1] Testing /api/health...");
  const healthRes = await fetch(`${baseUrl}/api/health`);
  const healthData = await healthRes.json();
  console.log("Health Check Status:", healthRes.status, JSON.stringify(healthData));

  // 2. Customer login
  console.log("\n[TEST 2] Testing Customer Login (priya@example.com)...");
  const custRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "priya@example.com",
      password: "Customer@12345",
      role: "CUSTOMER",
    }),
  });
  const custData = await custRes.json();
  const custCookie = custRes.headers.get("set-cookie");
  console.log("Customer Login Status:", custRes.status, "User:", custData.user?.email, "Role:", custData.user?.role);
  console.log("Session Cookie Created?", Boolean(custCookie));

  // 3. Customer Session Me
  console.log("\n[TEST 3] Testing /api/auth/me with Customer Cookie...");
  const meRes = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Cookie: custCookie?.split(";")[0] || "" },
  });
  const meData = await meRes.json();
  console.log("Auth Me Status:", meRes.status, "Role:", meData.user?.role, "Name:", meData.user?.customer?.name);

  // 4. Vendor Login
  console.log("\n[TEST 4] Testing Vendor Login (studio@memories.com)...");
  const vendRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "studio@memories.com",
      password: "Vendor@12345",
      role: "VENDOR",
    }),
  });
  const vendData = await vendRes.json();
  const vendCookie = vendRes.headers.get("set-cookie");
  console.log("Vendor Login Status:", vendRes.status, "Business:", vendData.user?.vendor?.businessName, "Role:", vendData.user?.role);

  // 5. Admin Login
  console.log("\n[TEST 5] Testing Admin Login (admin@celebratingyou.com)...");
  const adminRes = await fetch(`${baseUrl}/api/auth/admin-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@celebratingyou.com",
      password: "Admin@12345",
    }),
  });
  const adminData = await adminRes.json();
  const adminCookie = adminRes.headers.get("set-cookie");
  console.log("Admin Login Status:", adminRes.status, "Admin Email:", adminData.user?.email, "Role:", adminData.user?.role);

  // 6. Invalid Password Test
  console.log("\n[TEST 6] Testing Invalid Password...");
  const invalidRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "priya@example.com",
      password: "WrongPassword!999",
      role: "CUSTOMER",
    }),
  });
  const invalidData = await invalidRes.json();
  console.log("Invalid Password Status:", invalidRes.status, "Error:", invalidData.error);

  // 7. Role Cross-Access Mismatch
  console.log("\n[TEST 7] Testing Customer Trying to Login via Vendor Portal...");
  const mismatchRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "priya@example.com",
      password: "Customer@12345",
      role: "VENDOR",
    }),
  });
  const mismatchData = await mismatchRes.json();
  console.log("Role Mismatch Status:", mismatchRes.status, "Error:", mismatchData.error);

  // 8. Admin Trying to Login via Customer Portal
  console.log("\n[TEST 8] Testing Admin Attempting Customer Portal Login...");
  const adminViaCustRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@celebratingyou.com",
      password: "Admin@12345",
      role: "CUSTOMER",
    }),
  });
  const adminViaCustData = await adminViaCustRes.json();
  console.log("Admin via Customer Portal Status:", adminViaCustRes.status, "Error:", adminViaCustData.error);

  // 9. Celebration Creation Test with Authenticated Customer Cookie
  console.log("\n[TEST 9] Testing Celebration Event Creation (/api/customer/events)...");
  const eventRes = await fetch(`${baseUrl}/api/customer/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: custCookie?.split(";")[0] || "",
    },
    body: JSON.stringify({
      title: "Rohan's 30th Birthday Bash",
      eventType: "Birthday",
      eventDate: "2026-12-15",
      eventTime: "19:00",
      locationAddress: "Indiranagar Club, Bangalore",
      city: "Bangalore",
      guestCount: 75,
      overallBudget: 60000,
      notes: "Candid photography, theme balloons and chocolate fudge cake.",
    }),
  });
  const eventData = await eventRes.json();
  console.log("Event Creation Status:", eventRes.status, "Created Event ID:", eventData.event?.id, "Checkpoints Created:", eventData.event?.checkpoints?.length);

  // 10. Logout Test
  console.log("\n[TEST 10] Testing Logout (/api/auth/logout)...");
  const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
    method: "POST",
    headers: { Cookie: custCookie?.split(";")[0] || "" },
  });
  const logoutCookie = logoutRes.headers.get("set-cookie");
  console.log("Logout Status:", logoutRes.status, "Cookie Cleared?", logoutCookie?.includes("Max-Age=0") || logoutCookie?.includes("expires="));

  console.log("\n=== ALL ACCEPTANCE TESTS COMPLETE ===");
}

test().catch(console.error);
