import React from "react";
import { cn } from "./Button";
import { AlertCircle, Inbox, WifiOff, RefreshCw } from "lucide-react";
import { Button } from "./Button";

export interface StateProps {
  title?: string;
  description?: string;
  className?: string;
  action?: React.ReactNode;
  onRetry?: () => void;
}

export function EmptyState({
  title = "No data found",
  description = "No events or records match the current filters.",
  action,
  className,
}: StateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center rounded-lg border border-hairline border-dashed bg-surface-1/50 my-4",
        className
      )}
    >
      <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center text-ink-subtle mb-3">
        <Inbox className="w-5 h-5 stroke-[1.8]" />
      </div>
      <h4 className="text-sm font-semibold text-ink">{title}</h4>
      <p className="text-xs text-ink-subtle max-w-sm mt-1">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadingState({
  title = "Loading telemetry...",
  description = "Retrieving DNS records and analyzing threat profiles",
  className,
}: StateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-12 text-center rounded-lg border border-hairline bg-surface-1/40 my-4",
        className
      )}
    >
      <div className="relative w-8 h-8 mb-3">
        <div className="w-8 h-8 rounded-full border-2 border-hairline-strong border-t-primary animate-spin" />
      </div>
      <h4 className="text-sm font-medium text-ink">{title}</h4>
      <p className="text-xs text-ink-subtle mt-1">{description}</p>
    </div>
  );
}

export function ErrorState({
  title = "Failed to load telemetry",
  description = "An error occurred while communicating with the DNS Guard backend.",
  action,
  onRetry,
  className,
}: StateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center rounded-lg border border-severity-critical/30 bg-severity-critical/5 my-4",
        className
      )}
    >
      <div className="w-10 h-10 rounded-full bg-severity-critical/15 text-severity-critical flex items-center justify-center mb-3">
        <AlertCircle className="w-5 h-5 stroke-[2]" />
      </div>
      <h4 className="text-sm font-semibold text-ink">{title}</h4>
      <p className="text-xs text-ink-subtle max-w-md mt-1">{description}</p>
      {action && <div className="mt-4">{action}</div>}
      {!action && onRetry && (
        <div className="mt-4">
          <Button size="sm" variant="outline" onClick={onRetry} className="gap-2">
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </Button>
        </div>
      )}
    </div>
  );
}

export function OfflineState({
  title = "Backend Service Disconnected",
  description = "DNS Guard is operating offline. Telemetry updates and live ingestion are temporarily suspended.",
  onRetry,
  className,
}: StateProps & { onRetry?: () => void }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center rounded-lg border border-severity-medium/30 bg-severity-medium/5 my-4",
        className
      )}
    >
      <div className="w-10 h-10 rounded-full bg-severity-medium/15 text-severity-medium flex items-center justify-center mb-3">
        <WifiOff className="w-5 h-5 stroke-[2]" />
      </div>
      <h4 className="text-sm font-semibold text-ink">{title}</h4>
      <p className="text-xs text-ink-subtle max-w-md mt-1">{description}</p>
      {onRetry && (
        <div className="mt-4">
          <Button size="sm" variant="outline" onClick={onRetry} className="gap-2">
            <RefreshCw className="w-3.5 h-3.5" /> Reconnect
          </Button>
        </div>
      )}
    </div>
  );
}
