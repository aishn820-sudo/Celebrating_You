import React, { ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "champagne";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = "",
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-dark-bg disabled:opacity-50 disabled:cursor-not-allowed select-none rounded-xl";

    const sizeStyles = {
      sm: "text-xs px-3 py-1.5 gap-1.5",
      md: "text-sm px-4 py-2.5 gap-2",
      lg: "text-base px-6 py-3 gap-2.5 font-semibold",
    };

    const variantStyles = {
      primary:
        "bg-rose-700 hover:bg-rose-800 dark:bg-rose-600 dark:hover:bg-rose-700 text-white shadow-sm hover:shadow active:scale-[0.99] focus:ring-rose-500",
      secondary:
        "bg-stone-100 hover:bg-stone-200 dark:bg-dark-elevated dark:hover:bg-dark-muted text-stone-900 dark:text-dark-text-primary border border-stone-200/80 dark:border-dark-border focus:ring-stone-400 active:scale-[0.99]",
      outline:
        "bg-white hover:bg-stone-50 dark:bg-dark-surface dark:hover:bg-dark-elevated text-stone-800 dark:text-dark-text-primary border border-stone-300 dark:border-dark-border shadow-sm focus:ring-stone-400 active:scale-[0.99]",
      ghost:
        "bg-transparent hover:bg-stone-100 dark:hover:bg-dark-elevated text-stone-700 dark:text-dark-text-secondary hover:text-stone-900 dark:hover:text-dark-text-primary focus:ring-stone-400",
      danger:
        "bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white shadow-sm focus:ring-red-500 active:scale-[0.99]",
      champagne:
        "bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-700 text-white shadow-sm focus:ring-amber-500 active:scale-[0.99]",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
