import React from "react";
import { cn } from "./Button";

export interface PanelProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
}

export function Panel({ title, subtitle, action, className, children, ...props }: PanelProps) {
  return (
    <div
      className={cn("bg-surface-1 rounded-lg border border-hairline overflow-hidden", className)}
      {...props}
    >
      {(title || subtitle || action) && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-hairline bg-surface-2/40">
          <div>
            {title && <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">{title}</h4>}
            {subtitle && <p className="text-xs text-ink-subtle mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}
