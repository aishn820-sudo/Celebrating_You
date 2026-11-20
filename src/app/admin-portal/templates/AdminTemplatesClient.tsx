"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Plus, Layers, CheckSquare, X } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

export default function AdminTemplatesClient({ initialTemplates }: { initialTemplates: any[] }) {
  const router = useRouter();
  const [templates, setTemplates] = useState(initialTemplates);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "Engagement",
    description: "",
    suggestedBudgetMin: 30000, // INR
    suggestedBudgetMax: 150000,
    defaultGuestCount: 60,
    stages: "Concept, Vendor Booking, RSVP, Execution",
    checkpoints: "Ring Ceremony Staging, Catering Menu Tasting, Welcome Easel Setup",
  });
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/admin/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          category: formData.category,
          description: formData.description,
          suggestedBudgetMin: formData.suggestedBudgetMin * 100,
          suggestedBudgetMax: formData.suggestedBudgetMax * 100,
          defaultGuestCount: formData.defaultGuestCount,
          stages: formData.stages.split(",").map((s) => s.trim()),
          checkpoints: formData.checkpoints.split(",").map((s) => ({ title: s.trim() })),
        }),
      });

      if (!res.ok) throw new Error("Failed to create template");

      setIsModalOpen(false);
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
          <span className="text-xs font-semibold tracking-wider uppercase text-rose-700 dark:text-rose-400">Blueprint Architecture</span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-dark-text-primary mt-1">
            Event Template Management
          </h1>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
            Pre-configured celebration milestones, automated checkpoint checklists, and budget estimation bands.
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="gap-2 shadow-soft"
        >
          <Plus className="w-4 h-4" /> Add Event Blueprint
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((tpl) => (
          <div
            key={tpl.id}
            className="bg-white dark:bg-dark-surface p-6 rounded-3xl border border-stone-200/90 dark:border-dark-border shadow-soft flex flex-col justify-between hover:shadow-card transition duration-200"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <Badge variant="rose">
                  {tpl.category}
                </Badge>
                <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                  {tpl.defaultGuestCount} Guests
                </span>
              </div>
              <h3 className="font-serif font-bold text-stone-900 dark:text-dark-text-primary text-lg leading-snug">{tpl.name}</h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-2 leading-relaxed line-clamp-3">
                {tpl.description}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-stone-100 dark:border-dark-border text-xs text-stone-600 dark:text-stone-400 space-y-1.5">
              <div className="flex justify-between">
                <span>Budget Band:</span>
                <span className="font-bold text-stone-900 dark:text-dark-text-primary">
                  ₹{(tpl.suggestedBudgetMin / 100).toLocaleString("en-IN")} - ₹{(tpl.suggestedBudgetMax / 100).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between text-stone-500 dark:text-stone-400">
                <span>Active Events Planned:</span>
                <span className="font-semibold text-stone-800 dark:text-stone-200">{tpl._count?.events || 0}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-dark-surface rounded-3xl max-w-md w-full p-6 sm:p-8 border border-stone-200 dark:border-dark-border shadow-2xl text-xs text-stone-800 dark:text-dark-text-primary my-8 transition-colors">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-dark-border mb-5">
              <h3 className="font-serif font-bold text-stone-900 dark:text-dark-text-primary text-lg">Create Event Blueprint</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-dark-elevated transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block font-semibold text-stone-800 dark:text-stone-200 mb-1">Blueprint Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Engagement Soirée"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-dark-border bg-white dark:bg-dark-elevated text-stone-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-800 dark:text-stone-200 mb-1">Occasion Category</label>
                <input
                  type="text"
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-dark-border bg-white dark:bg-dark-elevated text-stone-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-800 dark:text-stone-200 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-dark-border bg-white dark:bg-dark-elevated text-stone-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-stone-800 dark:text-stone-200 mb-1">Min Budget (INR)</label>
                  <input
                    type="number"
                    value={formData.suggestedBudgetMin}
                    onChange={(e) => setFormData({ ...formData, suggestedBudgetMin: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-dark-border bg-white dark:bg-dark-elevated text-stone-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-800 dark:text-stone-200 mb-1">Max Budget (INR)</label>
                  <input
                    type="number"
                    value={formData.suggestedBudgetMax}
                    onChange={(e) => setFormData({ ...formData, suggestedBudgetMax: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-dark-border bg-white dark:bg-dark-elevated text-stone-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-800 dark:text-stone-200 mb-1">Stages (comma separated)</label>
                <input
                  type="text"
                  value={formData.stages}
                  onChange={(e) => setFormData({ ...formData, stages: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-dark-border bg-white dark:bg-dark-elevated text-stone-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-800 dark:text-stone-200 mb-1">Checkpoints (comma separated)</label>
                <input
                  type="text"
                  value={formData.checkpoints}
                  onChange={(e) => setFormData({ ...formData, checkpoints: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-dark-border bg-white dark:bg-dark-elevated text-stone-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-xs"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full justify-center py-2.5 shadow-soft"
              >
                {loading ? "Saving Blueprint..." : "Save Template"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
