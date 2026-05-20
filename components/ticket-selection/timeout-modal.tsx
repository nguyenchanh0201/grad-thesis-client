"use client";

import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onOk?: () => void;
  isLoading?: boolean;
  title?: string;
  description?: string;
  loadingLabel?: string;
};

export function TimeoutModal({
  open,
  onOk,
  isLoading = false,
  title = "Ticket booking timeout",
  description = "You can only complete the ticket booking within a 10-minute time frame. Please rebook.",
  loadingLabel = "Redirecting...",
}: Props) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="timeout-title"
      aria-describedby="timeout-desc"
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm"
    >
      <div className="mx-4 w-full max-w-sm rounded-xl border border-border bg-popover p-6 shadow-xl">
        <h2
          id="timeout-title"
          className="text-base font-semibold text-foreground"
        >
          {title}
        </h2>
        <p id="timeout-desc" className="mt-2 text-sm text-muted-foreground">
          {description}
        </p>

        {isLoading ? (
          <div className="mt-5 flex items-center justify-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            <span>{loadingLabel}</span>
          </div>
        ) : (
          <div className="mt-5">
            <Button
              variant="outline"
              onClick={onOk}
              disabled={!onOk}
              className="w-full"
            >
              OK
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
