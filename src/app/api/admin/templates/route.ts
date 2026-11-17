import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const templates = await prisma.eventTemplate.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        _count: { select: { events: true } },
      },
    });
    return NextResponse.json({ templates });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      category,
      description,
      suggestedBudgetMin,
      suggestedBudgetMax,
      defaultGuestCount,
      stages,
      recommendedServices,
      checkpoints,
    } = body;

    if (!name || !category) {
      return NextResponse.json({ error: "Name and category are required" }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const template = await prisma.eventTemplate.create({
      data: {
        name,
        slug,
        category,
        description: description || "",
        suggestedBudgetMin: Number(suggestedBudgetMin) || 2000000,
        suggestedBudgetMax: Number(suggestedBudgetMax) || 10000000,
        defaultGuestCount: Number(defaultGuestCount) || 50,
        stagesJson: JSON.stringify(stages || ["Planning", "Booking", "Execution"]),
        recommendedServicesJson: JSON.stringify(recommendedServices || []),
        checkpointsJson: JSON.stringify(checkpoints || []),
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId: session.userId,
        action: "CREATE_EVENT_TEMPLATE",
        targetEntity: "EventTemplate",
        targetId: template.id,
        newValue: name,
      },
    });

    return NextResponse.json({ success: true, template });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

