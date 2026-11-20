import Navbar from "@/components/Navbar";
import prisma from "@/lib/prisma";
import { isDatabaseUnavailableError } from "@/lib/dbErrors";
import PlanCelebrationClient from "./PlanCelebrationClient";

export const dynamic = "force-dynamic";

export default async function PlanPage({
  searchParams,
}: {
  searchParams: { occasion?: string; templateId?: string; budget?: string };
}) {
  let categories: any[] = [];
  let services: any[] = [];
  let templates: any[] = [];

  try {
    const [catList, srvList, tplList] = await Promise.all([
      prisma.vendorCategory.findMany({ where: { isActive: true } }),
      prisma.service.findMany({
        where: {
          status: "PUBLISHED",
          vendor: { verificationStatus: "VERIFIED" },
        },
        include: {
          category: true,
          vendor: {
            select: {
              id: true,
              businessName: true,
              city: true,
              state: true,
              rating: true,
              reviewCount: true,
              verificationStatus: true,
            },
          },
          packages: { where: { isActive: true } },
          images: { take: 1 },
        },
        orderBy: { rating: "desc" },
      }),
      prisma.eventTemplate.findMany({ where: { isActive: true } }),
    ]);

    categories = catList;
    services = srvList;
    templates = tplList;
  } catch (err) {
    if (isDatabaseUnavailableError(err)) {
      console.warn("[PlanPage] Database uninitialized or unavailable. Rendering with empty sets.");
    } else {
      throw err;
    }
  }

  return (
    <div className="min-h-screen bg-warm-50 flex flex-col font-sans text-stone-800">
      <Navbar />
      <PlanCelebrationClient
        initialCategories={categories}
        initialServices={services}
        templates={templates}
        defaultOccasion={searchParams.occasion}
        defaultTemplateId={searchParams.templateId}
        defaultBudgetTier={searchParams.budget}
      />
    </div>
  );
}
