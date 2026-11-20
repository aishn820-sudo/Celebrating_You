"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Sparkles, AlertCircle, ArrowRight, Lock, Mail } from "lucide-react";
import Button from "@/components/ui/Button";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect");

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

      // Follow redirect if provided
      if (redirectUrl && redirectUrl.startsWith("/")) {
        router.push(redirectUrl);
      } else if (data.user.role === "VENDOR") {
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
    <div className="bg-white py-8 px-6 shadow-card rounded-3xl border border-stone-200/90 sm:px-10">
      {/* Role selector tabs */}
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
          Customer
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
          Vendor
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
          {loading ? "Signing in..." : "Continue"} <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </form>

      {/* Quick Demo Credentials Assistant */}
      <div className="mt-6 pt-5 border-t border-stone-100 text-[11px] text-stone-500">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-semibold text-stone-700">Demonstration Credentials:</span>
          <button
            type="button"
            onClick={() => {
              if (role === "CUSTOMER") {
                setEmail("priya@example.com");
                setPassword("Customer@12345");
              } else {
                setEmail("studio@memories.com");
                setPassword("Vendor@12345");
              }
            }}
            className="text-[10px] font-bold text-rose-700 hover:text-rose-800 underline uppercase tracking-wider"
          >
            Auto-fill credentials
          </button>
        </div>
        {role === "CUSTOMER" ? (
          <div
            onClick={() => {
              setEmail("priya@example.com");
              setPassword("Customer@12345");
            }}
            className="bg-warm-50 hover:bg-warm-100/80 cursor-pointer transition p-2.5 rounded-xl font-mono text-[11px] text-stone-700 border border-stone-200"
          >
            <div>Email: <strong className="text-stone-900">priya@example.com</strong></div>
            <div>Password: <strong className="text-stone-900">Customer@12345</strong></div>
            <div className="text-[10px] text-stone-400 mt-1 font-sans">Role: Verified Demo Customer (Click to auto-fill)</div>
          </div>
        ) : (
          <div
            onClick={() => {
              setEmail("studio@memories.com");
              setPassword("Vendor@12345");
            }}
            className="bg-warm-50 hover:bg-warm-100/80 cursor-pointer transition p-2.5 rounded-xl font-mono text-[11px] text-stone-700 border border-stone-200"
          >
            <div>Email: <strong className="text-stone-900">studio@memories.com</strong></div>
            <div>Password: <strong className="text-stone-900">Vendor@12345</strong></div>
            <div className="text-[10px] text-stone-400 mt-1 font-sans">Role: Moments & Memories Studio (Click to auto-fill)</div>
          </div>
        )}
      </div>

      <div className="mt-6 text-center text-xs text-stone-600">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-semibold text-rose-700 hover:underline">
          Create an account
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
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
          Sign in to access your curated event plans and vendor bookings
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Suspense fallback={<div className="p-8 text-center text-xs text-stone-400">Loading login...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
