"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Lock, Mail, ArrowRight, AlertCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import ThemeToggle from "@/components/ThemeToggle";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@celebratingyou.com");
  const [password, setPassword] = useState("Admin@12345");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      router.push("/admin-portal/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-stone-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-stone-900 dark:text-stone-100 font-sans antialiased selection:bg-rose-900 selection:text-white relative transition-colors duration-200">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-14 h-14 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-rose-600 dark:text-rose-500 flex items-center justify-center mx-auto mb-4 shadow-xl">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-3xl font-serif font-bold text-stone-900 dark:text-white tracking-tight">
          Admin Console
        </h2>
        <p className="mt-2 text-xs text-stone-600 dark:text-stone-400">
          Restricted administrative oversight for Celebrating YOU operations, verification & finance
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white dark:bg-stone-900/90 py-8 px-6 shadow-2xl rounded-3xl border border-stone-200 dark:border-stone-800 sm:px-10 text-xs transition-colors">
          {error && (
            <div className="mb-4 p-3.5 bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">Administrative Email</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-800 text-stone-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-xs transition-colors"
                />
                <Mail className="w-4 h-4 text-stone-400 dark:text-stone-500 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">Master Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-800 text-stone-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-xs transition-colors"
                />
                <Lock className="w-4 h-4 text-stone-400 dark:text-stone-500 absolute left-3 top-3" />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full justify-center py-3 shadow-soft mt-3"
            >
              {loading ? "Authenticating Master Key..." : "Sign In to Admin Console"} <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-stone-200 dark:border-stone-800 text-[11px] text-stone-500 dark:text-stone-400 text-center font-mono">
            Default Demo Credentials: admin@celebratingyou.com / Admin@12345
          </div>
        </div>
      </div>
    </div>
  );
}
