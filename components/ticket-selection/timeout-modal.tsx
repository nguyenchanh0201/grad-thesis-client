"use client";

import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onOk: () => void;
};

export function TimeoutModal({ open, onOk }: Props) {
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
          Ticket booking timeout
        </h2>
        <p id="timeout-desc" className="mt-2 text-sm text-muted-foreground">
          You can only complete the ticket booking within a 10-minute time
          frame. Please rebook.
        </p>
        <div className="mt-5">
          <Button variant="outline" onClick={onOk} className="w-full">
            OK
          </Button>
        </div>
      </div>
    </div>
  );
}
