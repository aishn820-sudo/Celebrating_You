"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Layers,
  Plus,
  CheckCircle2,
  AlertTriangle,
  X,
  Package,
  Calendar,
  Clock,
  Users,
  Image as ImageIcon,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

export default function VendorServicesClient({
  initialServices,
  vendor,
  categories,
}: {
  initialServices: any[];
  vendor: any;
  categories: any[];
}) {
  const router = useRouter();
  const [services, setServices] = useState(initialServices);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    categoryId: vendor.categoryId || (categories[0]?.id || ""),
    description: "",
    basePrice: 15000, // INR
    capacity: "Up to 100 Guests",
    duration: "4 Hours",
    setupTime: "1 Hour prior",
    inclusions: "Dedicated lead artist, High-grade materials, Online deliverables",
    exclusions: "Inter-city travel charges beyond 50km",
    imageUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800",
    packageName: "Standard Royal Package",
    packagePrice: 15000,
    advancePercent: 25,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/vendor/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          categoryId: formData.categoryId,
          description: formData.description,
          basePrice: formData.basePrice,
          status: vendor.isVerified ? "PUBLISHED" : "DRAFT",
          capacity: formData.capacity,
          duration: formData.duration,
          setupTime: formData.setupTime,
          inclusions: formData.inclusions.split(",").map((s) => s.trim()),
          exclusions: formData.exclusions.split(",").map((s) => s.trim()),
          images: [{ imageUrl: formData.imageUrl, isCover: true }],
          packages: [
            {
              name: formData.packageName,
              price: formData.packagePrice,
              advancePercent: formData.advancePercent,
              features: formData.inclusions.split(",").map((s) => s.trim()),
            },
          ],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create service");
      }

      setIsModalOpen(false);
      router.refresh();
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 p-6 sm:p-10 max-w-7xl overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-semibold tracking-wider uppercase text-rose-700">Offerings & Portfolio</span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-1">
            Service Catalog & Packages
          </h1>
          <p className="text-xs text-stone-600 mt-1">
            Create milestone packages, publish signature event services, and manage deliverables.
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="gap-2 shadow-soft"
        >
          <Plus className="w-4 h-4" /> Create New Service
        </Button>
      </div>

      {!vendor.isVerified && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-700 flex-shrink-0" />
          <span>
            <strong>KYC In Review:</strong> While verification is pending, newly created services are saved as{" "}
            <strong>DRAFT</strong> and will be automatically published once your business account is verified.
          </span>
        </div>
      )}

      {/* Services Grid */}
      {services.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-200/90 shadow-soft max-w-md mx-auto my-12">
          <div className="w-12 h-12 rounded-2xl bg-warm-100 flex items-center justify-center mx-auto mb-4 text-stone-400">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-base font-serif font-bold text-stone-900">No Services Listed Yet</h3>
          <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
            Publish your photography, decor, catering, or entertainment packages with clear deliverables and transparent pricing.
          </p>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="mt-5 w-full justify-center"
          >
            Create First Service
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s) => {
            const cover = s.images?.[0]?.imageUrl || "https://images.unsplash.com/photo-1519741497674-611481863552?w=800";
            return (
              <div
                key={s.id}
                className="bg-white rounded-2xl overflow-hidden border border-stone-200/90 shadow-soft flex flex-col justify-between hover:shadow-card hover:border-stone-300 transition duration-200"
              >
                <div>
                  <div className="relative h-48 w-full bg-stone-100 overflow-hidden">
                    <img src={cover} alt={s.title} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-medium text-stone-800 shadow-sm border border-stone-200/60">
                      {s.category?.name}
                    </div>
                    <div className="absolute top-3 right-3">
                      <Badge variant={s.status === "PUBLISHED" ? "success" : "warning"}>
                        {s.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="font-serif font-bold text-stone-900 text-lg leading-snug line-clamp-1">{s.title}</h3>
                    <p className="text-xs text-stone-600 mt-2 line-clamp-2 leading-relaxed">
                      {s.description}
                    </p>

                    <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                      <span className="flex items-center gap-1 font-medium">
                        <Package className="w-3.5 h-3.5 text-rose-700" />
                        {s.packages.length} {s.packages.length === 1 ? "Package" : "Packages"}
                      </span>
                      <span className="font-medium text-stone-700">
                        {s._count?.bookings || 0} Bookings Completed
                      </span>
                    </div>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-3 border-t border-stone-100 bg-warm-50/50 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-stone-500 uppercase tracking-wider block font-semibold">Starting Base</span>
                    <span className="text-lg font-bold text-stone-900">
                      ₹{(s.basePrice / 100).toLocaleString("en-IN")}
                    </span>
                  </div>

                  <span className="text-xs font-semibold text-rose-700 hover:text-rose-800">
                    Live on Marketplace
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE SERVICE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 border border-stone-200 shadow-2xl my-8 text-xs text-stone-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-5">
              <div>
                <h3 className="font-serif font-bold text-stone-900 text-lg">Create New Service Offering</h3>
                <p className="text-stone-500 text-xs mt-0.5">Configure packages, inclusions, and showcase imagery</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-700 flex-shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateService} className="space-y-4">
              <div>
                <label className="block font-semibold text-stone-800 mb-1">Service Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Cinematic 4K Videography & Candid Photography"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Category</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-xs"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Starting Base Price (INR)</label>
                  <input
                    type="number"
                    required
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-800 mb-1">Detailed Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe your artistic approach, equipment, team size, and deliverables..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Duration</label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Setup Time</label>
                  <input
                    type="text"
                    value={formData.setupTime}
                    onChange={(e) => setFormData({ ...formData, setupTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Capacity</label>
                  <input
                    type="text"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-800 mb-1">What's Included (comma separated)</label>
                <input
                  type="text"
                  value={formData.inclusions}
                  onChange={(e) => setFormData({ ...formData, inclusions: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-800 mb-1">Cover Image URL</label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                />
              </div>

              <div className="p-4 bg-warm-50 rounded-2xl border border-stone-200 space-y-2">
                <span className="font-semibold text-stone-900 block text-xs">Standard Package Configuration</span>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Package Name"
                    value={formData.packageName}
                    onChange={(e) => setFormData({ ...formData, packageName: e.target.value })}
                    className="p-2 rounded-xl bg-white border border-stone-300 text-stone-900 text-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  />
                  <input
                    type="number"
                    placeholder="Price (INR)"
                    value={formData.packagePrice}
                    onChange={(e) => setFormData({ ...formData, packagePrice: Number(e.target.value) })}
                    className="p-2 rounded-xl bg-white border border-stone-300 text-stone-900 text-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  />
                  <input
                    type="number"
                    placeholder="Advance %"
                    value={formData.advancePercent}
                    onChange={(e) => setFormData({ ...formData, advancePercent: Number(e.target.value) })}
                    className="p-2 rounded-xl bg-white border border-stone-300 text-stone-900 text-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full justify-center py-3 shadow-soft"
              >
                {loading ? "Publishing Offering..." : "Publish Service Offering"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
