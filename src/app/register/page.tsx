"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowRight, User, Mail, Phone, Lock, MapPin } from "lucide-react";
import Button from "@/components/ui/Button";
import ThemeToggle from "@/components/ThemeToggle";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    address: "",
    city: "Bangalore",
    state: "Karnataka",
    pincode: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      router.push("/customer/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-dark-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans antialiased text-stone-900 dark:text-dark-text-primary relative transition-colors duration-200">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
          <div className="w-12 h-12 rounded-2xl bg-rose-700 text-white flex items-center justify-center font-serif text-xl font-bold shadow-soft group-hover:scale-105 transition-transform">
            CY
          </div>
        </Link>
        <h2 className="text-3xl font-serif font-bold text-stone-900 dark:text-dark-text-primary tracking-tight">
          Join <span className="text-rose-700 dark:text-rose-400">Celebrating YOU</span>
        </h2>
        <p className="mt-2 text-xs text-stone-600 dark:text-dark-text-secondary">
          Create your account to start planning milestone events and booking verified vendors
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4 sm:px-0">
        <div className="bg-white dark:bg-dark-surface py-8 px-6 shadow-card rounded-3xl border border-stone-200/90 dark:border-dark-border sm:px-10 transition-colors">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-700 dark:text-rose-400 flex-shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-stone-800 dark:text-dark-text-primary mb-1">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Priya Sharma"
                    required
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-dark-border bg-white dark:bg-dark-elevated text-stone-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 placeholder-stone-400 dark:placeholder-stone-500 text-xs transition-colors"
                  />
                  <User className="w-4 h-4 text-stone-400 dark:text-stone-500 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-800 dark:text-dark-text-primary mb-1">Phone Number</label>
                <div className="relative">
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    required
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-dark-border bg-white dark:bg-dark-elevated text-stone-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 placeholder-stone-400 dark:placeholder-stone-500 text-xs transition-colors"
                  />
                  <Phone className="w-4 h-4 text-stone-400 dark:text-stone-500 absolute left-3 top-3" />
                </div>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-stone-800 dark:text-dark-text-primary mb-1">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="priya@example.com"
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-dark-border bg-white dark:bg-dark-elevated text-stone-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 placeholder-stone-400 dark:placeholder-stone-500 text-xs transition-colors"
                />
                <Mail className="w-4 h-4 text-stone-400 dark:text-stone-500 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-stone-800 dark:text-dark-text-primary mb-1">Password</label>
              <div className="relative">
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="At least 6 characters"
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-dark-border bg-white dark:bg-dark-elevated text-stone-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 placeholder-stone-400 dark:placeholder-stone-500 text-xs transition-colors"
                />
                <Lock className="w-4 h-4 text-stone-400 dark:text-stone-500 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-stone-800 dark:text-dark-text-primary mb-1">Address / Landmark</label>
              <div className="relative">
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Apartment, Street name..."
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-dark-border bg-white dark:bg-dark-elevated text-stone-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 placeholder-stone-400 dark:placeholder-stone-500 text-xs transition-colors"
                />
                <MapPin className="w-4 h-4 text-stone-400 dark:text-stone-500 absolute left-3 top-3" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-stone-800 dark:text-dark-text-primary mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-300 dark:border-dark-border bg-white dark:bg-dark-elevated text-stone-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-xs transition-colors"
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-800 dark:text-dark-text-primary mb-1">State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-300 dark:border-dark-border bg-white dark:bg-dark-elevated text-stone-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-xs transition-colors"
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-800 dark:text-dark-text-primary mb-1">Pincode</label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  placeholder="560001"
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-300 dark:border-dark-border bg-white dark:bg-dark-elevated text-stone-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-xs transition-colors"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full justify-center py-3 shadow-soft mt-3"
            >
              {loading ? "Creating Account..." : "Create My Account"} <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-stone-600 dark:text-dark-text-secondary pt-4 border-t border-stone-100 dark:border-dark-border">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-rose-700 dark:text-rose-400 hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
