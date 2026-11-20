import React from "react";

export type BadgeVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "rose"
  | "champagne";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: "sm" | "md";
  dot?: boolean;
}

export function Badge({
  children,
  className = "",
  variant = "neutral",
  size = "md",
  dot = false,
  ...props
}: BadgeProps) {
  const variantStyles: Record<BadgeVariant, { bg: string; dotColor: string }> = {
    success: {
      bg: "bg-emerald-50 text-emerald-800 border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60",
      dotColor: "bg-emerald-500",
    },
    warning: {
      bg: "bg-amber-50 text-amber-800 border-amber-200/80 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60",
      dotColor: "bg-amber-500",
    },
    danger: {
      bg: "bg-rose-50 text-rose-800 border-rose-200/80 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/60",
      dotColor: "bg-rose-500",
    },
    info: {
      bg: "bg-sky-50 text-sky-800 border-sky-200/80 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800/60",
      dotColor: "bg-sky-500",
    },
    neutral: {
      bg: "bg-stone-100 text-stone-700 border-stone-200 dark:bg-dark-elevated dark:text-dark-text-primary dark:border-dark-border",
      dotColor: "bg-stone-400 dark:bg-stone-500",
    },
    rose: {
      bg: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900/60",
      dotColor: "bg-rose-600 dark:bg-rose-400",
    },
    champagne: {
      bg: "bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-900/60",
      dotColor: "bg-amber-600 dark:bg-amber-400",
    },
  };

  const sizeStyles = {
    sm: "text-[11px] px-2 py-0.5 font-medium",
    md: "text-xs px-2.5 py-1 font-semibold",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border transition-colors ${variantStyles[variant].bg} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${variantStyles[variant].dotColor}`}
        />
      )}
      <span>{children}</span>
    </span>
  );
}

export default Badge;
