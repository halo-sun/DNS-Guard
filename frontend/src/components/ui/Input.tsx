import React from "react";
import { cn } from "./Button";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", error, icon, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-subtle">
            {icon}
          </div>
        )}
        <input
          type={type}
          ref={ref}
          className={cn(
            "w-full bg-surface-1 text-ink placeholder:text-ink-tertiary text-sm rounded-md border border-hairline px-3 py-2 transition-colors",
            "focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary-focus",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            icon ? "pl-9" : "",
            error && "border-severity-critical focus:border-severity-critical focus:ring-severity-critical",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-severity-critical">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
