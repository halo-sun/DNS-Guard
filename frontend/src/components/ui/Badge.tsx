import React from "react";
import { cn } from "./Button";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "primary" | "outline" | "success" | "warning" | "danger" | "muted";
  size?: "sm" | "md";
}

export function Badge({ className, variant = "default", size = "sm", children, ...props }: BadgeProps) {
  const variants = {
    default: "bg-surface-3 text-ink-muted border-hairline",
    primary: "bg-primary/15 text-primary-hover border-primary/30",
    outline: "bg-transparent text-ink-subtle border-hairline-strong",
    success: "bg-severity-low/15 text-severity-low border-severity-low/30",
    warning: "bg-severity-medium/15 text-severity-medium border-severity-medium/30",
    danger: "bg-severity-critical/15 text-severity-critical border-severity-critical/30",
    muted: "bg-surface-2 text-ink-tertiary border-hairline",
  };

  const sizes = {
    sm: "text-[11px] px-2 py-0.5",
    md: "text-xs px-2.5 py-1",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-mono font-medium rounded border tracking-tight select-none",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
