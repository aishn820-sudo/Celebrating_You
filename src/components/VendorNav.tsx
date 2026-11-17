"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarCheck2,
  FileText,
  Layers,
  CalendarDays,
  IndianRupee,
  Building2,
  LogOut,
  ShieldCheck,
  AlertTriangle,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import NotificationDropdown from "./NotificationDropdown";

export default function VendorNav({ vendor }: { vendor?: any }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const navItems = [
    { label: "Dashboard", href: "/vendor/dashboard", icon: LayoutDashboard },
    { label: "Bookings Queue", href: "/vendor/bookings", icon: CalendarCheck2 },
    { label: "Invoice Dashboard", href: "/vendor/invoices", icon: FileText, highlight: true },
    { label: "Services & Pricing", href: "/vendor/services", icon: Layers },
    { label: "Calendar & Blackouts", href: "/vendor/calendar", icon: CalendarDays },
    { label: "Financials & Payouts", href: "/vendor/financials", icon: IndianRupee },
    { label: "Business Profile", href: "/vendor/profile", icon: Building2 },
  ];

  const isVerified = vendor?.verificationStatus === "VERIFIED";

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-stone-900 text-stone-100 px-4 py-3 flex items-center justify-between border-b border-stone-800 sticky top-0 z-40">
        <Link href="/vendor/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-stone-800 text-amber-200 border border-stone-700 flex items-center justify-center font-serif font-bold text-sm">
            CY
          </div>
          <span className="font-bold text-sm tracking-tight">Vendor Workspace</span>
        </Link>
        <div className="flex items-center gap-2">
          <NotificationDropdown />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1.5 text-stone-300 hover:text-white rounded-lg hover:bg-stone-800"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Sidebar Desktop & Mobile */}
      <aside
        className={`w-full md:w-64 bg-stone-900 text-stone-300 flex-shrink-0 flex flex-col justify-between border-r border-stone-800/90 min-h-screen ${
          mobileOpen ? "block" : "hidden md:flex"
        }`}
      >
        <div>
          {/* Brand */}
          <div className="p-6 border-b border-stone-800">
            <Link href="/vendor/dashboard" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-stone-800 text-amber-200 border border-stone-700 flex items-center justify-center font-serif text-base font-bold shadow-sm">
                CY
              </div>
              <div>
                <span className="text-base font-bold text-white tracking-tight font-serif">
                  Celebrating <span className="text-rose-400 italic">YOU</span>
                </span>
                <span className="block text-[9px] text-stone-400 font-semibold uppercase tracking-widest">
                  Vendor Workspace
                </span>
              </div>
            </Link>

            {/* Verification Status */}
            <div className="mt-4 pt-3.5 border-t border-stone-800/80 flex items-center justify-between text-xs">
              <span className="text-stone-400 text-[11px] font-medium">KYC Status:</span>
              {isVerified ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 bg-amber-950/50 border border-amber-800/40 px-2 py-0.5 rounded-full">
                  <AlertTriangle className="w-3.5 h-3.5" /> {vendor?.verificationStatus || "Pending"}
                </span>
              )}
            </div>
          </div>

          {/* Navigation list */}
          <nav className="p-4 space-y-1 text-xs">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-colors ${
                    active
                      ? "bg-rose-700 text-white shadow-sm font-semibold"
                      : "text-stone-400 hover:text-white hover:bg-stone-800/60"
                  } ${item.highlight && !active ? "text-amber-300 font-semibold" : ""}`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      active ? "text-white" : item.highlight ? "text-amber-300" : "text-stone-400"
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Profile & Logout */}
        <div className="p-4 border-t border-stone-800">
          <div className="flex items-center justify-between mb-3 px-2">
            <div className="truncate">
              <p className="text-xs font-bold text-white truncate">
                {vendor?.businessName || "Artisan Business"}
              </p>
              <p className="text-[10px] text-stone-400 font-mono truncate">
                {vendor?.vendorCode || "CY-VEND"}
              </p>
            </div>
            <div className="hidden md:block">
              <NotificationDropdown />
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-stone-400 hover:text-rose-400 hover:bg-stone-800/70 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
