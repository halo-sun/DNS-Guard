import React from "react";
import { cn } from "./Button";

export interface StatusDotProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: "online" | "offline" | "warning" | "error" | "syncing" | "idle";
  label?: string;
}

export function StatusDot({ status, label, className, ...props }: StatusDotProps) {
  const statusColors = {
    online: "bg-severity-low shadow-[0_0_8px_rgba(39,166,68,0.4)]",
    offline: "bg-ink-tertiary",
    warning: "bg-severity-medium shadow-[0_0_8px_rgba(245,158,11,0.4)]",
    error: "bg-severity-critical shadow-[0_0_8px_rgba(220,38,38,0.4)]",
    syncing: "bg-primary animate-pulse shadow-[0_0_8px_rgba(94,106,210,0.4)]",
    idle: "bg-ink-subtle",
  };

  return (
    <span className={cn("inline-flex items-center gap-2 text-xs text-ink-muted", className)} {...props}>
      <span className={cn("w-2 h-2 rounded-full inline-block shrink-0", statusColors[status])} />
      {label && <span>{label}</span>}
    </span>
  );
}
