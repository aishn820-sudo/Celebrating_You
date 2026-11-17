"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShieldAlert,
  Users,
  Store,
  Layers,
  Sparkles,
  CalendarRange,
  BadgePercent,
  History,
  AlertCircle,
  LogOut,
  LayoutDashboard,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin-portal/login");
  };

  const navItems = [
    { label: "Overview", href: "/admin-portal/dashboard", icon: LayoutDashboard },
    { label: "Vendor Verification", href: "/admin-portal/vendors", icon: Store },
    { label: "Service Moderation", href: "/admin-portal/services", icon: Layers },
    { label: "Event Templates", href: "/admin-portal/templates", icon: Sparkles },
    { label: "Customer Directory", href: "/admin-portal/customers", icon: Users },
    { label: "Bookings & Expiry", href: "/admin-portal/bookings", icon: CalendarRange },
    { label: "Financial Analytics", href: "/admin-portal/financials", icon: BadgePercent },
    { label: "Disputes & Complaints", href: "/admin-portal/complaints", icon: AlertCircle },
    { label: "System Audit Logs", href: "/admin-portal/audit-logs", icon: History },
  ];

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-stone-950 text-stone-100 px-4 py-3 flex items-center justify-between border-b border-stone-800 sticky top-0 z-40">
        <Link href="/admin-portal/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-stone-900 border border-stone-800 text-rose-400 flex items-center justify-center font-bold text-xs">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm tracking-tight">Admin Console</span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-900"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <aside
        className={`w-full md:w-64 bg-stone-950 text-stone-300 flex-shrink-0 flex flex-col justify-between border-r border-stone-800/90 min-h-screen ${
          mobileOpen ? "block" : "hidden md:flex"
        }`}
      >
        <div>
          {/* Brand */}
          <div className="p-6 border-b border-stone-800/80">
            <Link href="/admin-portal/dashboard" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-stone-900 border border-stone-800 text-rose-500 flex items-center justify-center shadow-sm">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-bold text-white tracking-tight font-serif">
                  Celebrating <span className="text-rose-400">YOU</span>
                </span>
                <span className="block text-[9px] text-stone-400 font-semibold uppercase tracking-widest">
                  Admin Console
                </span>
              </div>
            </Link>
            <div className="mt-3 px-2.5 py-1 rounded-md bg-stone-900 border border-stone-800 text-[10px] font-mono text-stone-400 text-center">
              SECURE OPERATIONAL ACCESS
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
                      ? "bg-stone-800 text-white font-semibold border-l-2 border-rose-500"
                      : "text-stone-400 hover:text-white hover:bg-stone-900"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? "text-rose-400" : "text-stone-400"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Profile & Logout */}
        <div className="p-4 border-t border-stone-800">
          <div className="mb-3 px-2">
            <p className="text-xs font-bold text-white">Super Administrator</p>
            <p className="text-[10px] text-stone-400 font-mono">admin@celebratingyou.com</p>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-950/40 rounded-xl border border-rose-900/30 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out Admin
          </button>
        </div>
      </aside>
    </>
  );
}
