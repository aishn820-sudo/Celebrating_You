import { NextRequest, NextResponse } from "next/server";
import { checkAndExpireOverdueBookings } from "@/lib/bookingStateMachine";

function verifyCronAuth(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  // In development without a secret configured, allow execution
  if (!cronSecret && process.env.NODE_ENV !== "production") {
    return true;
  }
  const authHeader = req.headers.get("authorization");
  const cronKeyHeader = req.headers.get("x-cron-key");

  if (authHeader === `Bearer ${cronSecret}` || cronKeyHeader === cronSecret) {
    return true;
  }
  return false;
}

export async function GET(req: NextRequest) {
  try {
    if (!verifyCronAuth(req)) {
      return NextResponse.json({ error: "Unauthorized cron execution" }, { status: 401 });
    }
    await checkAndExpireOverdueBookings();
    return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!verifyCronAuth(req)) {
      return NextResponse.json({ error: "Unauthorized cron execution" }, { status: 401 });
    }
    await checkAndExpireOverdueBookings();
    return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
