"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Sparkles, Calendar, BookOpen, LogOut, ChevronDown, Menu, X, LayoutDashboard, FileText } from "lucide-react";
import NotificationDropdown from "./NotificationDropdown";
import ThemeToggle from "./ThemeToggle";
import { Button } from "./ui/Button";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {});
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 bg-warm-50/90 dark:bg-dark-bg/90 backdrop-blur-md border-b border-stone-200/80 dark:border-dark-border transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-stone-900 text-amber-100 flex items-center justify-center font-serif text-lg font-bold shadow-sm border border-stone-800 dark:border-stone-700 transition-transform group-hover:scale-105">
            CY
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-stone-900 dark:text-dark-text-primary font-serif">
              Celebrating <span className="text-rose-700 dark:text-rose-400 italic">YOU</span>
            </span>
            <span className="block text-[9px] uppercase tracking-widest font-semibold text-stone-500 dark:text-dark-text-secondary">
              Let&apos;s Celebrate Together
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-stone-600 dark:text-dark-text-secondary">
          <Link
            href="/plan"
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              pathname.startsWith("/plan")
                ? "bg-rose-700 text-white shadow-sm"
                : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50"
            }`}
          >
            Plan Celebration
          </Link>
          <Link
            href="/explore"
            className={`transition-colors hover:text-stone-900 dark:hover:text-white ${
              pathname === "/explore" ? "text-rose-700 dark:text-rose-400 font-semibold" : ""
            }`}
          >
            Explore Services
          </Link>
          {user?.role === "CUSTOMER" && (
            <Link
              href="/customer/events"
              className={`transition-colors hover:text-stone-900 dark:hover:text-white ${
                pathname.startsWith("/customer/events") ? "text-rose-700 dark:text-rose-400 font-semibold" : ""
              }`}
            >
              My Celebrations
            </Link>
          )}
          {user?.role === "VENDOR" && (
            <Link
              href="/vendor/dashboard"
              className="text-stone-900 dark:text-dark-text-primary font-semibold flex items-center gap-1.5 hover:text-rose-700 dark:hover:text-rose-400"
            >
              <LayoutDashboard className="w-4 h-4 text-rose-700 dark:text-rose-400" /> Vendor Workspace
            </Link>
          )}
        </nav>

        {/* User Actions & Theme Toggle */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {user ? (
            <div className="flex items-center gap-3">
              <NotificationDropdown />
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2.5 pl-3 pr-2.5 py-1.5 rounded-full border border-stone-200 dark:border-dark-border bg-white dark:bg-dark-elevated hover:border-stone-300 dark:hover:border-stone-600 text-xs font-semibold text-stone-700 dark:text-dark-text-primary shadow-sm transition-all"
                >
                  <div className="w-6 h-6 rounded-full bg-stone-900 text-amber-100 flex items-center justify-center font-bold text-[11px]">
                    {user.customer?.name?.[0] || user.vendor?.businessName?.[0] || user.email[0].toUpperCase()}
                  </div>
                  <span className="max-w-[120px] truncate">
                    {user.customer?.name || user.vendor?.businessName || user.email.split("@")[0]}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-dark-surface rounded-2xl shadow-premium border border-stone-200/90 dark:border-dark-border py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-2.5 border-b border-stone-100 dark:border-dark-border">
                      <p className="text-xs font-bold text-stone-900 dark:text-dark-text-primary truncate">
                        {user.customer?.name || user.vendor?.businessName || "User Account"}
                      </p>
                      <p className="text-[11px] text-stone-500 dark:text-dark-text-secondary truncate">{user.email}</p>
                      <span className="inline-block mt-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-stone-100 dark:bg-dark-elevated text-stone-600 dark:text-dark-text-primary">
                        {user.role}
                      </span>
                    </div>

                    {user.role === "CUSTOMER" && (
                      <>
                        <Link
                          href="/customer/dashboard"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-stone-700 dark:text-dark-text-secondary hover:bg-stone-50 dark:hover:bg-dark-elevated hover:text-stone-900 dark:hover:text-white"
                        >
                          <LayoutDashboard className="w-4 h-4 text-stone-400" /> Overview Dashboard
                        </Link>
                        <Link
                          href="/customer/events"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-stone-700 dark:text-dark-text-secondary hover:bg-stone-50 dark:hover:bg-dark-elevated hover:text-stone-900 dark:hover:text-white"
                        >
                          <Calendar className="w-4 h-4 text-stone-400" /> My Celebrations
                        </Link>
                        <Link
                          href="/customer/invoices"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-stone-700 dark:text-dark-text-secondary hover:bg-stone-50 dark:hover:bg-dark-elevated hover:text-stone-900 dark:hover:text-white"
                        >
                          <FileText className="w-4 h-4 text-stone-400" /> Invoices & Receipts
                        </Link>
                      </>
                    )}

                    {user.role === "VENDOR" && (
                      <Link
                        href="/vendor/dashboard"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-stone-700 dark:text-dark-text-secondary hover:bg-stone-50 dark:hover:bg-dark-elevated hover:text-stone-900 dark:hover:text-white"
                      >
                        <LayoutDashboard className="w-4 h-4 text-rose-700 dark:text-rose-400" /> Vendor Workspace
                      </Link>
                    )}

                    <div className="border-t border-stone-100 dark:border-dark-border my-1" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" size="sm">
                  Get Started
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile hamburger toggle */}
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="md:hidden p-2 text-stone-600 dark:text-dark-text-secondary hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-dark-elevated rounded-xl"
            aria-label="Toggle navigation"
          >
            {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileNavOpen && (
        <div className="md:hidden border-t border-stone-200/80 dark:border-dark-border bg-warm-50 dark:bg-dark-bg px-4 pt-3 pb-6 space-y-3 animate-in fade-in duration-150">
          <Link
            href="/plan"
            onClick={() => setMobileNavOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300"
          >
            Plan Celebration
          </Link>
          <Link
            href="/explore"
            onClick={() => setMobileNavOpen(false)}
            className="block px-3 py-2 rounded-xl text-sm font-medium text-stone-700 dark:text-dark-text-secondary hover:bg-stone-100 dark:hover:bg-dark-elevated"
          >
            Explore Services
          </Link>
          {user?.role === "CUSTOMER" && (
            <>
              <Link
                href="/customer/events"
                onClick={() => setMobileNavOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-medium text-stone-700 dark:text-dark-text-secondary hover:bg-stone-100 dark:hover:bg-dark-elevated"
              >
                My Celebrations
              </Link>
              <Link
                href="/customer/invoices"
                onClick={() => setMobileNavOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-medium text-stone-700 dark:text-dark-text-secondary hover:bg-stone-100 dark:hover:bg-dark-elevated"
              >
                Invoices & Receipts
              </Link>
            </>
          )}
          {user?.role === "VENDOR" && (
            <Link
              href="/vendor/dashboard"
              onClick={() => setMobileNavOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-medium text-stone-700 dark:text-dark-text-secondary hover:bg-stone-100 dark:hover:bg-dark-elevated"
            >
              Vendor Workspace
            </Link>
          )}

          <div className="pt-2 border-t border-stone-200/80 dark:border-dark-border flex items-center justify-between">
            <span className="text-xs text-stone-500 dark:text-dark-text-secondary font-medium">Appearance</span>
            <ThemeToggle variant="pill" />
          </div>
        </div>
      )}
    </header>
  );
}
