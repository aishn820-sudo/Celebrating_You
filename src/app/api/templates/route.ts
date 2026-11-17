import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isDatabaseUnavailableError } from "@/lib/dbErrors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const templates = await prisma.eventTemplate.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ templates });
  } catch (err: any) {
    if (isDatabaseUnavailableError(err)) {
      console.warn("[API /templates] Database uninitialized or unavailable. Returning empty array.");
      return NextResponse.json({ templates: [] });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

