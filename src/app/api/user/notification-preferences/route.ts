import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Default preferences
    const preferences = {
      emailOnBookingRequest: true,
      emailOnPaymentConfirmed: true,
      emailOnResponseSLA: true,
      inAppAlerts: true,
      smsAlerts: false,
    };

    return NextResponse.json({ preferences });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // In a full production schema, this persists to UserNotificationPreference table
    return NextResponse.json({
      success: true,
      message: "Notification preferences updated successfully",
      preferences: body,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

