import React, { SelectHTMLAttributes, forwardRef } from "react";
import { ChevronDown } from "lucide-react";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, id, className = "", children, disabled, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold text-stone-700 dark:text-dark-text-secondary tracking-wide uppercase"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            id={selectId}
            ref={ref}
            disabled={disabled}
            className={`w-full appearance-none rounded-xl border bg-white dark:bg-dark-elevated px-3.5 py-2.5 pr-10 text-sm text-stone-900 dark:text-dark-text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-dark-bg disabled:bg-stone-50 dark:disabled:bg-dark-surface disabled:text-stone-400 dark:disabled:text-stone-600 disabled:cursor-not-allowed ${
              error
                ? "border-red-300 dark:border-red-800 focus:border-red-500 focus:ring-red-200 dark:focus:ring-red-950"
                : "border-stone-300 dark:border-dark-border hover:border-stone-400 dark:hover:border-stone-600 focus:border-rose-600 dark:focus:border-rose-500 focus:ring-rose-100 dark:focus:ring-rose-950/40"
            } ${className}`}
            {...props}
          >
            {children}
          </select>
          <div className="absolute right-3.5 text-stone-400 dark:text-stone-500 pointer-events-none flex items-center">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        {error ? (
          <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-stone-500 dark:text-dark-text-secondary">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = "Select";

export default Select;
