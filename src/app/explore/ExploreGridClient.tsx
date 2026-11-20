"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Star,
  Clock,
  ArrowRight,
  Check,
  X,
  Layers,
  Scale,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";

export default function ExploreGridClient({
  services,
}: {
  services: any[];
}) {
  const [selectedForCompare, setSelectedForCompare] = useState<any[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  const formatPrice = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;

  const toggleCompare = (service: any) => {
    if (selectedForCompare.find((s) => s.id === service.id)) {
      setSelectedForCompare(selectedForCompare.filter((s) => s.id !== service.id));
    } else {
      if (selectedForCompare.length >= 3) {
        alert("You can compare up to 3 services at a time.");
        return;
      }
      setSelectedForCompare([...selectedForCompare, service]);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {services.map((service) => {
          const isSelected = !!selectedForCompare.find((s) => s.id === service.id);
          return (
            <Card key={service.id} hoverEffect className="flex flex-col justify-between">
              <div>
                {/* Image Thumbnail */}
                <div className="h-44 w-full bg-stone-200 relative overflow-hidden">
                  {service.images[0] ? (
                    <img
                      src={service.images[0].imageUrl}
                      alt={service.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-stone-100 text-stone-400">
                      <span className="text-xs font-medium">Curated Vendor Portfolio</span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <Badge
                      variant="neutral"
                      size="sm"
                      className="bg-white/95 backdrop-blur-sm shadow-sm font-medium"
                    >
                      {service.category.name}
                    </Badge>
                  </div>
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <button
                      onClick={() => toggleCompare(service)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm transition flex items-center gap-1 ${
                        isSelected
                          ? "bg-rose-700 text-white"
                          : "bg-white/95 backdrop-blur-sm text-stone-700 hover:bg-stone-100"
                      }`}
                      title="Compare service side-by-side"
                    >
                      <Scale className="w-3 h-3" />
                      {isSelected ? "Comparing" : "Compare"}
                    </button>
                    <Badge variant="success" size="sm" dot>
                      Verified
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-6">
                  <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
                    <span className="font-semibold text-stone-800">{service.vendor.businessName}</span>
                    <div className="flex items-center gap-1 text-amber-700 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{service.vendor.rating.toFixed(1)}</span>
                      <span className="text-stone-400 font-normal">({service.vendor.reviewCount})</span>
                    </div>
                  </div>

                  <h3 className="font-serif font-bold text-base text-stone-900 leading-snug line-clamp-1">
                    {service.title}
                  </h3>
                  <p className="text-xs text-stone-500 mt-2 line-clamp-2 leading-relaxed">
                    {service.description}
                  </p>

                  <div className="mt-4 flex items-center gap-2 text-[11px] text-stone-500">
                    <Clock className="w-3.5 h-3.5 text-rose-700 shrink-0" />
                    <span>Guaranteed 2-hour response window</span>
                  </div>
                </CardContent>
              </div>

              <div className="px-6 py-4 bg-stone-50/60 border-t border-stone-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Starting At</p>
                  <p className="text-base font-bold text-stone-900">
                    {formatPrice(service.packages[0]?.price || service.basePrice)}
                  </p>
                </div>

                <Link href={`/services/${service.id}`}>
                  <Button variant="primary" size="sm">
                    View Packages <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Floating Compare Action Bar */}
      {selectedForCompare.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-stone-900/95 backdrop-blur-md text-white px-5 py-3 rounded-full shadow-2xl border border-stone-800 flex items-center gap-4 text-xs animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-rose-400" />
            <span className="font-semibold">
              Comparing {selectedForCompare.length} {selectedForCompare.length === 1 ? "vendor" : "vendors"} (max 3)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setIsCompareModalOpen(true)}
              className="bg-rose-600 hover:bg-rose-500 text-white rounded-full px-4 text-xs font-bold"
            >
              Compare Side-by-Side
            </Button>
            <button
              onClick={() => setSelectedForCompare([])}
              className="p-1 text-stone-400 hover:text-white"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Side-by-Side Comparison Modal */}
      {isCompareModalOpen && (
        <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 border border-stone-200 shadow-2xl text-stone-900 my-8 text-xs animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-6">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-rose-700">Vendor Comparison</span>
                <h3 className="font-serif font-bold text-stone-900 text-xl mt-0.5">
                  Service Feature & Pricing Comparison
                </h3>
              </div>
              <button
                onClick={() => setIsCompareModalOpen(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-200">
                    <th className="p-3 font-semibold text-stone-500 text-[11px] w-48">Feature</th>
                    {selectedForCompare.map((s) => (
                      <th key={s.id} className="p-3 font-serif font-bold text-stone-900 text-sm">
                        {s.title}
                        <span className="block font-sans font-medium text-[11px] text-stone-500 mt-0.5">
                          by {s.vendor.businessName}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  <tr>
                    <td className="p-3 font-semibold text-stone-500">Category</td>
                    {selectedForCompare.map((s) => (
                      <td key={s.id} className="p-3 font-medium">
                        <Badge variant="rose" size="sm">
                          {s.category.name}
                        </Badge>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-stone-500">Starting Price</td>
                    {selectedForCompare.map((s) => (
                      <td key={s.id} className="p-3 font-bold text-stone-900 text-base">
                        {formatPrice(s.packages[0]?.price || s.basePrice)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-stone-500">Advance Deposit Required</td>
                    {selectedForCompare.map((s) => (
                      <td key={s.id} className="p-3 font-medium text-stone-800">
                        {s.packages[0]?.advancePercent || 25}% of package price
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-stone-500">Artisan Rating</td>
                    {selectedForCompare.map((s) => (
                      <td key={s.id} className="p-3 font-medium">
                        <div className="flex items-center gap-1 text-amber-700 font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          <span>{s.vendor.rating.toFixed(1)}</span>
                          <span className="text-stone-400 font-normal">({s.vendor.reviewCount} reviews)</span>
                        </div>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-stone-500">Duration & Setup</td>
                    {selectedForCompare.map((s) => (
                      <td key={s.id} className="p-3 text-stone-600">
                        Duration: {s.duration || "Standard engagement"}
                        <br />
                        Setup: {s.setupTime || "1 hour prior"}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-stone-500">Available Packages</td>
                    {selectedForCompare.map((s) => (
                      <td key={s.id} className="p-3">
                        <ul className="space-y-1">
                          {s.packages.map((pkg: any) => (
                            <li key={pkg.id} className="text-stone-800 font-medium">
                              • {pkg.name} — <strong className="text-stone-900">{formatPrice(pkg.price)}</strong>
                            </li>
                          ))}
                        </ul>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-stone-500">SLA Guarantee</td>
                    {selectedForCompare.map((s) => (
                      <td key={s.id} className="p-3 text-stone-600">
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                          <Check className="w-3.5 h-3.5 text-emerald-600" /> 2-Hour Response Rule
                        </span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-stone-500">Action</td>
                    {selectedForCompare.map((s) => (
                      <td key={s.id} className="p-3">
                        <Link href={`/services/${s.id}`}>
                          <Button size="sm" className="w-full justify-center">
                            Book Artisan <ArrowRight className="w-3.5 h-3.5 ml-1" />
                          </Button>
                        </Link>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

