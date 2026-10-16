import React from "react";
import { cn } from "./Button";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          ref={ref}
          className={cn(
            "w-full bg-surface-1 text-ink text-sm rounded-md border border-hairline px-3 py-2 transition-colors appearance-none cursor-pointer",
            "focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary-focus",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error && "border-severity-critical focus:border-severity-critical focus:ring-severity-critical",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-ink-subtle">
          <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
        {error && <p className="mt-1 text-xs text-severity-critical">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";
