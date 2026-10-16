import React from "react";
import { cn } from "./Button";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "surface-1" | "surface-2" | "surface-3";
  hoverable?: boolean;
}

export function Card({
  className,
  variant = "surface-1",
  hoverable = false,
  children,
  ...props
}: CardProps) {
  const surfaceClasses = {
    "surface-1": "bg-surface-1",
    "surface-2": "bg-surface-2",
    "surface-3": "bg-surface-3",
  };

  return (
    <div
      className={cn(
        "rounded-lg border border-hairline p-4 transition-all duration-150",
        surfaceClasses[variant],
        hoverable && "hover:border-hairline-strong hover:bg-surface-2 cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center justify-between pb-3 border-b border-hairline mb-3", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-sm font-semibold tracking-tight text-ink", className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-xs text-ink-subtle mt-0.5", className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("text-sm text-ink-muted", className)} {...props}>
      {children}
    </div>
  );
}
