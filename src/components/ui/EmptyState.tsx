import React from "react";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-12 text-center bg-stone-50/50 dark:bg-dark-surface/40 rounded-2xl border border-dashed border-stone-300 dark:border-dark-border ${className}`}
    >
      {icon && (
        <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-dark-elevated flex items-center justify-center text-stone-500 dark:text-dark-text-secondary mb-4 shadow-sm border border-transparent dark:border-dark-border">
          {icon}
        </div>
      )}
      <h4 className="text-base font-bold text-stone-900 dark:text-dark-text-primary tracking-tight">{title}</h4>
      <p className="text-sm text-stone-500 dark:text-dark-text-secondary max-w-sm mt-1.5 leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse bg-stone-200/80 dark:bg-dark-elevated rounded-xl ${className}`}
      {...props}
    />
  );
}
