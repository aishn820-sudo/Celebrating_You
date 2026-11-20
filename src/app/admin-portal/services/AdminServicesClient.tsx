"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Layers, Plus, CheckCircle2, XCircle, Tag, Search, X } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export default function AdminServicesClient({
  initialServices,
  initialCategories,
}: {
  initialServices: any[];
  initialCategories: any[];
}) {
  const router = useRouter();
  const [services, setServices] = useState(initialServices);
  const [categories, setCategories] = useState(initialCategories);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDesc, setNewCategoryDesc] = useState("");
  const [loading, setLoading] = useState(false);

  const handleToggleStatus = async (serviceId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "PUBLISHED" ? "INACTIVE" : "PUBLISHED";
    try {
      await fetch("/api/admin/services", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId, status: nextStatus }),
      });
      router.refresh();
      window.location.reload();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName, description: newCategoryDesc }),
      });

      if (!res.ok) throw new Error("Failed to add category");

      setIsCategoryModalOpen(false);
      setNewCategoryName("");
      setNewCategoryDesc("");
      router.refresh();
      window.location.reload();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 p-6 sm:p-10 max-w-7xl overflow-y-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-semibold tracking-wider uppercase text-rose-700 dark:text-rose-400">Catalog Moderation</span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-dark-text-primary mt-1">
            Service Catalog & Categories
          </h1>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
            Moderate artisan service listings, inspect pricing configurations, and manage platform categories.
          </p>
        </div>

        <Button
          onClick={() => setIsCategoryModalOpen(true)}
          className="gap-2 shadow-soft"
        >
          <Plus className="w-4 h-4" /> Add Vendor Category
        </Button>
      </div>

      {/* Categories Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        {categories.map((c) => (
          <div key={c.id} className="p-4 bg-white dark:bg-dark-surface rounded-2xl border border-stone-200/90 dark:border-dark-border shadow-soft text-xs transition-colors">
            <span className="font-semibold text-stone-900 dark:text-dark-text-primary block truncate">{c.name}</span>
            <span className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 block">
              {c._count?.services || 0} listings • {c._count?.vendors || 0} vendors
            </span>
          </div>
        ))}
      </div>

      {/* Services Table */}
      <div className="bg-white dark:bg-dark-surface rounded-3xl border border-stone-200/90 dark:border-dark-border shadow-soft overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-stone-700 dark:text-stone-300">
            <thead className="text-[11px] uppercase tracking-wider text-stone-500 dark:text-stone-400 bg-warm-50/70 dark:bg-dark-elevated border-b border-stone-200 dark:border-dark-border">
              <tr>
                <th className="py-4 px-6 font-semibold">Service Title</th>
                <th className="py-4 px-4 font-semibold">Vendor</th>
                <th className="py-4 px-4 font-semibold">Category</th>
                <th className="py-4 px-4 font-semibold">Base Price</th>
                <th className="py-4 px-4 font-semibold">Status</th>
                <th className="py-4 px-4 font-semibold">Bookings</th>
                <th className="py-4 px-6 text-right font-semibold">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-dark-border">
              {services.map((s) => (
                <tr key={s.id} className="hover:bg-warm-50/60 dark:hover:bg-dark-elevated/60 transition">
                  <td className="py-4 px-6">
                    <strong className="text-stone-900 dark:text-dark-text-primary text-sm block">{s.title}</strong>
                    <span className="text-[11px] text-stone-500 dark:text-stone-400 truncate max-w-xs block">
                      {s.description}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <p className="font-semibold text-stone-900 dark:text-dark-text-primary">{s.vendor.businessName}</p>
                    <span className="font-mono text-[10px] text-stone-500 dark:text-stone-400">{s.vendor.vendorCode}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-warm-100 dark:bg-dark-elevated text-stone-800 dark:text-stone-200">
                      {s.category.name}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-bold text-stone-900 dark:text-dark-text-primary">
                    ₹{(s.basePrice / 100).toLocaleString("en-IN")}
                  </td>
                  <td className="py-4 px-4">
                    <Badge variant={s.status === "PUBLISHED" ? "success" : "warning"}>
                      {s.status}
                    </Badge>
                  </td>
                  <td className="py-4 px-4 font-medium">{s._count?.bookings || 0}</td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => handleToggleStatus(s.id, s.status)}
                      className={`px-3 py-1.5 rounded-xl font-semibold text-[11px] transition ${
                        s.status === "PUBLISHED"
                          ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-900"
                          : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-900"
                      }`}
                    >
                      {s.status === "PUBLISHED" ? "Deactivate" : "Publish"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE CATEGORY MODAL */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-surface rounded-3xl max-w-md w-full p-6 sm:p-8 border border-stone-200 dark:border-dark-border shadow-2xl text-xs text-stone-800 dark:text-dark-text-primary transition-colors">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-dark-border mb-5">
              <h3 className="font-serif font-bold text-stone-900 dark:text-dark-text-primary text-lg">Create Vendor Category</h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-dark-elevated transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block font-semibold text-stone-800 dark:text-stone-200 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Live Music & Orchestras"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-dark-border bg-white dark:bg-dark-elevated text-stone-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-800 dark:text-stone-200 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Brief description of the service category..."
                  value={newCategoryDesc}
                  onChange={(e) => setNewCategoryDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-dark-border bg-white dark:bg-dark-elevated text-stone-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-xs"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full justify-center py-2.5 shadow-soft"
              >
                {loading ? "Adding Category..." : "Add Category"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
