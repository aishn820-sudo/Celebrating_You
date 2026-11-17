import { isDatabaseUnavailableError } from "../src/lib/dbErrors.ts";
import { Prisma } from "@prisma/client";

async function testDatabaseGracefulHandling() {
  console.log("=============================================================");
  console.log("CELEBRATING YOU — RENDER BUILD & DB UNAVAILABILITY TEST SUITE");
  console.log("=============================================================\n");

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

  // TEST 1: P2021 (Table does not exist) detection
  const tableError = new Prisma.PrismaClientKnownRequestError(
    "The table main.EventTemplate does not exist in the current database.",
    { code: "P2021", clientVersion: "5.22.0" }
  );
  assert(isDatabaseUnavailableError(tableError) === true, "isDatabaseUnavailableError detects P2021 (missing table)");

  // TEST 2: P1001 (Can't reach database server)
  const connError = new Prisma.PrismaClientKnownRequestError(
    "Can't reach database server at db:5432",
    { code: "P1001", clientVersion: "5.22.0" }
  );
  assert(isDatabaseUnavailableError(connError) === true, "isDatabaseUnavailableError detects P1001 (unreachable DB)");

  // TEST 3: PrismaClientInitializationError
  const initError = new Prisma.PrismaClientInitializationError(
    "Unable to open the database file",
    "5.22.0"
  );
  assert(isDatabaseUnavailableError(initError) === true, "isDatabaseUnavailableError detects PrismaClientInitializationError");

  // TEST 4: Generic SQLite string error
  const stringErr = new Error("The table main.VendorCategory does not exist in the current database.");
  assert(isDatabaseUnavailableError(stringErr) === true, "isDatabaseUnavailableError detects exact Render error message string");

  // TEST 5: Unrelated programming error must NOT be suppressed
  const syntaxErr = new TypeError("Cannot read properties of undefined (reading 'map')");
  assert(isDatabaseUnavailableError(syntaxErr) === false, "Unrelated programming error (TypeError) is NOT suppressed");

  const nullErr = null;
  assert(isDatabaseUnavailableError(nullErr) === false, "Null error is safely ignored");

  console.log("\n=============================================================");
  console.log(`DB ERROR DETECTION TESTS COMPLETED: ${passed} PASSED, ${failed} FAILED`);
  console.log("=============================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

testDatabaseGracefulHandling();
