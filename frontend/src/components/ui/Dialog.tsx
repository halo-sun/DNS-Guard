import React, { useEffect } from "react";
import { cn } from "./Button";
import { X } from "lucide-react";

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
}

export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = "md",
}: DialogProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidths = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          "relative w-full rounded-lg bg-surface-1 border border-hairline shadow-2xl z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-150",
          maxWidths[maxWidth]
        )}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-hairline bg-surface-2/40">
          <div>
            <h2 id="dialog-title" className="text-sm font-semibold text-ink">
              {title}
            </h2>
            {description && <p className="text-xs text-ink-subtle mt-0.5">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-ink-tertiary hover:text-ink transition-colors p-1 rounded-md hover:bg-surface-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-focus"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 text-sm text-ink-muted max-h-[75vh] overflow-y-auto">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-hairline bg-surface-2/30">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
