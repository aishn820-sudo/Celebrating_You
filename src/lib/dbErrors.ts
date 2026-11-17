import { Prisma } from "@prisma/client";

/**
 * Checks if an error caught during database operations is caused by:
 * - A missing table (e.g. database not yet migrated, uninitialized schema)
 * - An unreachable or unavailable database server
 * - Connection timeouts or failed database initialization
 *
 * This allows public pages (Homepage, Explore, Templates) to render gracefully
 * with empty collections instead of crashing the build or throwing a 500.
 */
export function isDatabaseUnavailableError(error: unknown): boolean {
  if (!error) return false;

  // Prisma known request errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P2021: "The table `{table}` does not exist in the current database."
    // P2022: "The column `{column}` does not exist in the current database."
    // P1000: Authentication failed against database server
    // P1001: Can't reach database server
    // P1002: Database server was reached but timed out
    // P1003: Database does not exist
    // P1017: Server has closed the connection
    const unavailCodes = ["P2021", "P2022", "P1000", "P1001", "P1002", "P1003", "P1017"];
    if (unavailCodes.includes(error.code)) {
      return true;
    }
  }

  // Prisma initialization errors (e.g. invalid connection URL, engine crash, missing driver)
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }

  // Fallback pattern matching on error message for SQLite / driver-level errors
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (
      msg.includes("does not exist in the current database") ||
      msg.includes("no such table") ||
      msg.includes("table main.") ||
      msg.includes("can't reach database") ||
      msg.includes("connection refused") ||
      msg.includes("database server was reached but timed out") ||
      msg.includes("cannot open database") ||
      msg.includes("unable to open database")
    ) {
      return true;
    }
  }

  return false;
}
