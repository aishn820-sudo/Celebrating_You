import prisma from "./prisma";

export interface CompanySettings {
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  primaryContact: string;
  secondaryContact: string;
  companyAddress: string;
}

const DEFAULT_SETTINGS: CompanySettings = {
  companyName: "Celebrating YOU Technologies",
  companyEmail: "support@celebratingyou.com",
  companyPhone: "+91 80 4567 8900",
  primaryContact: "Priya Sharma (Client Happiness Lead)",
  secondaryContact: "Karthik Verma (Operations Escalations)",
  companyAddress: "Celebrating YOU Hub, 100 Feet Road, Indiranagar, Bangalore 560038, Karnataka, India",
};

export async function getCompanySettings(): Promise<CompanySettings> {
  try {
    const keys = [
      "COMPANY_NAME",
      "COMPANY_EMAIL",
      "COMPANY_PHONE",
      "PRIMARY_CONTACT",
      "SECONDARY_CONTACT",
      "COMPANY_ADDRESS",
    ];

    const records = await prisma.platformSetting.findMany({
      where: { key: { in: keys } },
    });

    const map = new Map(records.map((r) => [r.key, r.value]));

    return {
      companyName: map.get("COMPANY_NAME") || DEFAULT_SETTINGS.companyName,
      companyEmail: map.get("COMPANY_EMAIL") || DEFAULT_SETTINGS.companyEmail,
      companyPhone: map.get("COMPANY_PHONE") || DEFAULT_SETTINGS.companyPhone,
      primaryContact: map.get("PRIMARY_CONTACT") || DEFAULT_SETTINGS.primaryContact,
      secondaryContact: map.get("SECONDARY_CONTACT") || DEFAULT_SETTINGS.secondaryContact,
      companyAddress: map.get("COMPANY_ADDRESS") || DEFAULT_SETTINGS.companyAddress,
    };
  } catch (err) {
    console.warn("[getCompanySettings] Using defaults:", err);
    return DEFAULT_SETTINGS;
  }
}
