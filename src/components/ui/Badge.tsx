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
      bg: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
      dotColor: "bg-emerald-500",
    },
    warning: {
      bg: "bg-amber-50 text-amber-800 border-amber-200/80",
      dotColor: "bg-amber-500",
    },
    danger: {
      bg: "bg-rose-50 text-rose-800 border-rose-200/80",
      dotColor: "bg-rose-500",
    },
    info: {
      bg: "bg-sky-50 text-sky-800 border-sky-200/80",
      dotColor: "bg-sky-500",
    },
    neutral: {
      bg: "bg-stone-100 text-stone-700 border-stone-200",
      dotColor: "bg-stone-400",
    },
    rose: {
      bg: "bg-rose-50 text-rose-700 border-rose-200",
      dotColor: "bg-rose-600",
    },
    champagne: {
      bg: "bg-amber-50 text-amber-900 border-amber-200",
      dotColor: "bg-amber-600",
    },
  };

  const sizeStyles = {
    sm: "text-[11px] px-2 py-0.5 font-medium",
    md: "text-xs px-2.5 py-1 font-semibold",
  };

  const style = variantStyles[variant] || variantStyles.neutral;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border tracking-wide uppercase ${style.bg} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dotColor}`} />}
      {children}
    </span>
  );
}

export default Badge;
