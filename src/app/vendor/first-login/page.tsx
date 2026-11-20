"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, ShieldCheck, ArrowRight, AlertCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import ThemeToggle from "@/components/ThemeToggle";

export default function VendorFirstLoginPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to update password");
      }

      router.push("/vendor/profile");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-dark-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans antialiased text-stone-900 dark:text-dark-text-primary selection:bg-rose-100 selection:text-rose-900 relative transition-colors">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-700 text-white flex items-center justify-center mx-auto mb-4 shadow-soft">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-dark-text-primary">
          First-Time Sign In Setup
        </h2>
        <p className="mt-2 text-xs text-stone-600 dark:text-stone-400">
          You are signed in with a temporary activation key. Please set a confidential permanent password to continue.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white dark:bg-dark-surface py-8 px-6 shadow-card rounded-3xl border border-stone-200/90 dark:border-dark-border sm:px-10 text-xs transition-colors">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-700 dark:text-rose-400 flex-shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-semibold text-stone-800 dark:text-stone-200 mb-1">New Permanent Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-dark-border bg-white dark:bg-dark-elevated text-stone-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-xs"
                />
                <Lock className="w-4 h-4 text-stone-400 dark:text-stone-500 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-stone-800 dark:text-stone-200 mb-1">Confirm Permanent Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-dark-border bg-white dark:bg-dark-elevated text-stone-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-xs"
                />
                <Lock className="w-4 h-4 text-stone-400 dark:text-stone-500 absolute left-3 top-3" />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full justify-center py-3 shadow-soft mt-3"
            >
              {loading ? "Saving Credentials..." : "Update Password & Open Profile"} <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
