import React, { useState } from "react";
import { Dialog } from "./Dialog";
import { Button } from "./Button";

export interface ConfirmActionProps {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  onConfirm: () => void | Promise<void>;
  trigger: (open: () => void) => React.ReactNode;
}

export function ConfirmAction({
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  trigger,
}: ConfirmActionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  const handleConfirm = async () => {
    setIsBusy(true);
    try {
      await onConfirm();
      setIsOpen(false);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <>
      {trigger(() => setIsOpen(true))}
      <Dialog
        isOpen={isOpen}
        onClose={() => !isBusy && setIsOpen(false)}
        title={title}
        description={description}
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              disabled={isBusy}
              onClick={() => setIsOpen(false)}
            >
              {cancelLabel}
            </Button>
            <Button
              variant={variant === "danger" ? "danger" : "primary"}
              size="sm"
              isLoading={isBusy}
              onClick={handleConfirm}
            >
              {confirmLabel}
            </Button>
          </>
        }
      >
        <p className="text-xs text-ink-muted">
          This operation will take immediate effect on the monitored telemetry and database records.
        </p>
      </Dialog>
    </>
  );
}
