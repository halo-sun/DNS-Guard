import { Shield } from "lucide-react";

export function Logo({
  className = "w-4 h-4",
  showText = true,
}: {
  className?: string;
  showText?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-surface-2 border border-hairline-strong shadow-inner">
        <Shield className={`text-primary ${className}`} strokeWidth={2.2} />
        <span className="absolute w-1.5 h-1.5 bg-primary-hover rounded-full animate-ping opacity-75" />
      </div>
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm tracking-tight text-ink">DNS GUARD</span>
            <span className="text-[9px] font-mono font-semibold px-1 py-0.2 bg-primary/20 text-primary-hover border border-primary/30 rounded">
              v1.0
            </span>
          </div>
          <span className="text-[10px] text-ink-subtle tracking-normal">
            Network Telemetry & Defense
          </span>
        </div>
      )}
    </div>
  );
}
