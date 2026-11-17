import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized administrative access" }, { status: 403 });
    }

    const auditLogs = await prisma.auditLog.findMany({
      include: {
        admin: { select: { email: true } },
      },
      orderBy: { timestamp: "desc" },
      take: 100,
    });

    return NextResponse.json({ auditLogs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

