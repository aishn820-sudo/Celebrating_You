"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, AlertCircle, ArrowRight, Lock, Mail } from "lucide-react";
import Button from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<"CUSTOMER" | "VENDOR">("CUSTOMER");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Check if vendor first login requires forced password change
      if (data.user.role === "VENDOR" && data.user.isFirstLogin) {
        router.push("/vendor/first-login");
        return;
      }

      if (data.user.role === "VENDOR") {
        router.push("/vendor/dashboard");
      } else {
        router.push("/customer/dashboard");
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans antialiased text-stone-900 selection:bg-rose-100 selection:text-rose-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
          <div className="w-12 h-12 rounded-2xl bg-rose-700 text-white flex items-center justify-center font-serif text-xl font-bold shadow-soft group-hover:scale-105 transition-transform">
            CY
          </div>
        </Link>
        <h2 className="text-3xl font-serif font-bold text-stone-900 tracking-tight">
          Welcome to <span className="text-rose-700">Celebrating YOU</span>
        </h2>
        <p className="mt-2 text-xs text-stone-600">
          Sign in to access your curated event plans and artisan bookings
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-card rounded-3xl border border-stone-200/90 sm:px-10">
          {/* Role selector tabs (Customer vs Vendor ONLY - Admin is strictly absent!) */}
          <div className="flex rounded-2xl bg-warm-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => {
                setRole("CUSTOMER");
                setError("");
              }}
              className={`w-1/2 py-2.5 rounded-xl text-xs font-semibold transition ${
                role === "CUSTOMER"
                  ? "bg-white text-rose-700 shadow-sm"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Host / Customer
            </button>
            <button
              type="button"
              onClick={() => {
                setRole("VENDOR");
                setError("");
              }}
              className={`w-1/2 py-2.5 rounded-xl text-xs font-semibold transition ${
                role === "VENDOR"
                  ? "bg-white text-rose-700 shadow-sm"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Artisan / Vendor
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-700 flex-shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-stone-800 mb-1">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={role === "CUSTOMER" ? "priya@example.com" : "studio@memories.com"}
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 placeholder-stone-400 text-xs"
                />
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-stone-800 mb-1">Password</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 placeholder-stone-400 text-xs"
                />
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full justify-center py-3 shadow-soft mt-2"
            >
              {loading ? "Signing in..." : "Continue to Dashboard"} <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </form>

          {/* Quick Demo Credentials Assistant */}
          <div className="mt-6 pt-5 border-t border-stone-100 text-[11px] text-stone-500">
            <span className="font-semibold text-stone-700 block mb-1">Pre-configured Demo Credentials:</span>
            {role === "CUSTOMER" ? (
              <p className="bg-warm-50 p-2.5 rounded-xl font-mono text-[11px] text-stone-700 border border-stone-200">
                Email: priya@example.com <br />
                Password: Customer@12345
              </p>
            ) : (
              <p className="bg-warm-50 p-2.5 rounded-xl font-mono text-[11px] text-stone-700 border border-stone-200">
                Email: studio@memories.com <br />
                Password: Vendor@12345
              </p>
            )}
          </div>

          <div className="mt-6 text-center text-xs text-stone-600">
            Don't have an account?{" "}
            <Link href="/register" className="font-semibold text-rose-700 hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
