"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Mail, Phone, MapPin, User, Save, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { CompanySettings } from "@/lib/companySettings";

export default function AdminSettingsClient({ initialSettings }: { initialSettings: CompanySettings }) {
  const router = useRouter();
  const [formData, setFormData] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/admin/settings/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update company settings");
      }

      setMessage("Company contact information successfully updated!");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-serif text-stone-900 dark:text-dark-text-primary">
          Company Contact Information
        </h1>
        <p className="text-xs text-stone-500 dark:text-dark-text-secondary mt-1">
          Manage official contact details displayed across client support, tax invoices, and platform touchpoints.
        </p>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 text-xs">
          {error}
        </div>
      )}

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Company Legal Name
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 dark:border-dark-border bg-white dark:bg-dark-elevated text-stone-900 dark:text-dark-text-primary"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Official Support Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={formData.companyEmail}
                  onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 dark:border-dark-border bg-white dark:bg-dark-elevated text-stone-900 dark:text-dark-text-primary"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Primary Phone Helpline
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={formData.companyPhone}
                  onChange={(e) => setFormData({ ...formData, companyPhone: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 dark:border-dark-border bg-white dark:bg-dark-elevated text-stone-900 dark:text-dark-text-primary"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Primary Contact Person
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={formData.primaryContact}
                  onChange={(e) => setFormData({ ...formData, primaryContact: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 dark:border-dark-border bg-white dark:bg-dark-elevated text-stone-900 dark:text-dark-text-primary"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Secondary / Escalation Contact
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={formData.secondaryContact}
                onChange={(e) => setFormData({ ...formData, secondaryContact: e.target.value })}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 dark:border-dark-border bg-white dark:bg-dark-elevated text-stone-900 dark:text-dark-text-primary"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Company Physical Address
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <textarea
                rows={2}
                value={formData.companyAddress}
                onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 dark:border-dark-border bg-white dark:bg-dark-elevated text-stone-900 dark:text-dark-text-primary"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-stone-100 dark:border-dark-border">
            <Button type="submit" variant="primary" size="md" isLoading={saving}>
              Save Contact Settings
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
