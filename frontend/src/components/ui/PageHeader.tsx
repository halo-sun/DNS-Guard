import React from "react";
import { cn } from "./Button";

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  badge,
  actions,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-hairline mb-6",
        className
      )}
      {...props}
    >
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-bold tracking-tight text-ink">{title}</h1>
          {badge}
        </div>
        {description && (
          <p className="text-xs text-ink-subtle mt-1 max-w-2xl">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
    </div>
  );
}
