import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getCompanySettings } from "@/lib/companySettings";

export async function GET() {
  try {
    const settings = await getCompanySettings();
    return NextResponse.json({ settings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { companyName, companyEmail, companyPhone, primaryContact, secondaryContact, companyAddress } = body;

    const updates = [
      { key: "COMPANY_NAME", value: companyName || "" },
      { key: "COMPANY_EMAIL", value: companyEmail || "" },
      { key: "COMPANY_PHONE", value: companyPhone || "" },
      { key: "PRIMARY_CONTACT", value: primaryContact || "" },
      { key: "SECONDARY_CONTACT", value: secondaryContact || "" },
      { key: "COMPANY_ADDRESS", value: companyAddress || "" },
    ];

    for (const item of updates) {
      await prisma.platformSetting.upsert({
        where: { key: item.key },
        create: {
          key: item.key,
          value: item.value,
          description: `Company contact information: ${item.key}`,
        },
        update: {
          value: item.value,
        },
      });
    }

    // Log admin audit
    await prisma.auditLog.create({
      data: {
        adminId: user.userId,
        action: "UPDATE_COMPANY_SETTINGS",
        targetEntity: "PlatformSetting",
        newValue: JSON.stringify(body),
      },
    });

    const updated = await getCompanySettings();
    return NextResponse.json({ success: true, settings: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
