import React from "react";
import { cn } from "./Button";
import { ShieldCheck, AlertTriangle, AlertCircle, ShieldAlert, Info } from "lucide-react";

export type SeverityLevel = "low" | "medium" | "high" | "critical" | "informational";

export interface SeverityBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  severity: SeverityLevel | string;
  score?: number;
  showIcon?: boolean;
}

export function SeverityBadge({
  severity,
  score,
  showIcon = true,
  className,
  ...props
}: SeverityBadgeProps) {
  const norm = severity.toLowerCase();

  let styles = "bg-surface-3 text-ink-subtle border-hairline";
  let Icon = Info;
  let label = severity.toUpperCase();

  switch (norm) {
    case "critical":
      styles = "bg-severity-critical/15 text-[#ff6b6b] border-severity-critical/40";
      Icon = ShieldAlert;
      label = "CRITICAL";
      break;
    case "high":
      styles = "bg-severity-high/15 text-[#ff9248] border-severity-high/40";
      Icon = AlertCircle;
      label = "HIGH";
      break;
    case "medium":
      styles = "bg-severity-medium/15 text-[#fbbf24] border-severity-medium/40";
      Icon = AlertTriangle;
      label = "MEDIUM";
      break;
    case "low":
      styles = "bg-severity-low/15 text-[#4ade80] border-severity-low/40";
      Icon = ShieldCheck;
      label = "LOW";
      break;
    case "informational":
    case "info":
      styles = "bg-primary/15 text-primary-hover border-primary/30";
      Icon = Info;
      label = "INFO";
      break;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold px-2 py-0.5 rounded border tracking-wide select-none",
        styles,
        className
      )}
      {...props}
    >
      {showIcon && <Icon className="w-3 h-3 stroke-[2.2]" aria-hidden="true" />}
      <span>{label}</span>
      {score !== undefined && (
        <span className="opacity-80 text-[10px] ml-0.5 font-normal">({score})</span>
      )}
    </span>
  );
}
