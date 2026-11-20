import Navbar from "@/components/Navbar";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { isDatabaseUnavailableError } from "@/lib/dbErrors";
import { Sparkles, CheckSquare, Layers, ArrowRight, Users, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  let templates: any[] = [];
  try {
    templates = await prisma.eventTemplate.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      console.warn("[TemplatesPage] Database uninitialized or unavailable. Rendering with empty collection.");
    } else {
      throw error;
    }
  }

  const formatPrice = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;

  return (
    <div className="min-h-screen bg-warm-50 flex flex-col font-sans text-stone-800">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        <div className="max-w-3xl mb-12">
          <Badge variant="rose" size="sm" className="mb-2">
            Structured Event Architecture
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 tracking-tight">
            Celebration Blueprints & Timelines
          </h1>
          <p className="text-sm text-stone-600 mt-2 leading-relaxed">
            Eliminate planning chaos. Start with expert-curated timelines, automated milestone checkpoints, and recommended services tailored to your occasion.
          </p>
        </div>

        {templates.length === 0 ? (
          <EmptyState
            icon={<Sparkles className="w-8 h-8 text-stone-400" />}
            title="Celebration Blueprints Preparing"
            description="Our curated milestone blueprints, recommended budgets, and event timelines are currently being organized. Please check back shortly."
            action={
              <Link href="/explore">
                <Button variant="secondary" size="sm">
                  Explore Verified Vendors
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {templates.map((tpl) => {
            let stages: string[] = [];
            let checkpoints: any[] = [];
            try {
              stages = JSON.parse(tpl.stagesJson || "[]");
            } catch (e) {}
            try {
              checkpoints = JSON.parse(tpl.checkpointsJson || "[]");
            } catch (e) {}

            return (
              <Card
                key={tpl.id}
                hoverEffect
                className="p-7 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <Badge variant="champagne" size="sm">
                      {tpl.category}
                    </Badge>
                    <span className="text-xs text-stone-500 font-medium flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-stone-400" /> ~{tpl.defaultGuestCount} Guests
                    </span>
                  </div>

                  <h3 className="text-xl font-serif font-bold text-stone-900 leading-snug">{tpl.name}</h3>
                  <p className="text-xs text-stone-600 mt-2 leading-relaxed">{tpl.description}</p>

                  {/* Budget Range */}
                  <div className="mt-5 p-3.5 bg-stone-50 rounded-xl border border-stone-200/70 text-xs">
                    <span className="text-stone-400 block text-[10px] font-bold uppercase tracking-wider">
                      Suggested Budget Band
                    </span>
                    <span className="font-bold text-stone-900 text-sm mt-0.5 block">
                      {formatPrice(tpl.suggestedBudgetMin)} – {formatPrice(tpl.suggestedBudgetMax)}
                    </span>
                  </div>

                  {/* Stages */}
                  {stages.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-stone-100">
                      <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-rose-700" /> Key Event Stages
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {stages.map((stg, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 bg-white border border-stone-200 text-stone-700 rounded-lg text-[11px] font-medium"
                          >
                            {i + 1}. {stg}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Checkpoints Checklist */}
                  {checkpoints.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-stone-100">
                      <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <CheckSquare className="w-3.5 h-3.5 text-emerald-700" /> Auto-Generated Checkpoints
                      </p>
                      <ul className="space-y-1.5 text-xs text-stone-600">
                        {checkpoints.slice(0, 3).map((cp: any, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-emerald-700 font-bold">•</span>
                            <span className="line-clamp-1">{cp.title}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-stone-100">
                  <Link href={`/plan?templateId=${tpl.id}`}>
                    <Button variant="primary" size="md" className="w-full">
                      Use This Blueprint <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
          </div>
        )}
      </main>
    </div>
  );
}
