"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";

interface ThemeToggleProps {
  className?: string;
  variant?: "pill" | "icon" | "nav";
}

export default function ThemeToggle({ className = "", variant = "icon" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = theme === "dark";

  if (!mounted) {
    // Avoid layout shift before mount with consistent placeholder
    return (
      <button
        type="button"
        aria-label="Theme toggle"
        className={`relative inline-flex items-center justify-center rounded-xl transition-all ${
          variant === "pill"
            ? "px-3 py-1.5 gap-2 text-xs font-semibold border border-stone-200 dark:border-dark-border bg-stone-100 dark:bg-dark-elevated text-stone-700 dark:text-dark-text-primary"
            : "w-9 h-9 border border-stone-200/80 dark:border-dark-border bg-white dark:bg-dark-elevated text-stone-600 dark:text-dark-text-primary shadow-sm"
        } ${className}`}
      >
        <Moon className="w-4 h-4 opacity-50" />
        {variant === "pill" && <span>Theme</span>}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`relative inline-flex items-center justify-center transition-all duration-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/50 select-none ${
        variant === "pill"
          ? "px-3 py-1.5 gap-2 text-xs font-semibold border border-stone-200 dark:border-dark-border bg-stone-100 dark:bg-dark-elevated text-stone-700 dark:text-dark-text-primary hover:bg-stone-200 dark:hover:bg-dark-muted"
          : "w-9 h-9 border border-stone-200/80 dark:border-dark-border bg-white dark:bg-dark-elevated text-stone-600 dark:text-dark-text-primary hover:bg-stone-100 dark:hover:bg-dark-muted hover:text-stone-900 dark:hover:text-white shadow-sm"
      } ${className}`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-stone-600 transition-transform hover:-rotate-12" />
      )}
      {variant === "pill" && (
        <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
      )}
    </button>
  );
}
