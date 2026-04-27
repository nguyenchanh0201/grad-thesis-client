"use client";

import { cn } from "@/lib/utils";
import { BackButton } from "../shared/back-button";

const STEPS = [
  { label: "Select Tickets", num: 1 },
  { label: "Enter Information", num: 2 },
  { label: "Payment", num: 3 },
];

type Props = {
  currentStep?: number;
  formatted: string;
  isWarning: boolean;
  backHref?: string;
};

export function ProgressSteps({
  currentStep = 1,
  formatted,
  isWarning,
  backHref,
}: Props) {
  return (
    <div className="flex items-center justify-between border-b border-border bg-background px-4 py-3 sm:px-6">
      <BackButton backHref={backHref} title="Go back" />

      <ol className="flex items-center gap-2 sm:gap-4" role="list">
        {STEPS.map(({ label, num }, idx) => {
          const isActive = num === currentStep;
          const isDone = num < currentStep;
          return (
            <li key={num} className="flex items-center gap-2 sm:gap-3">
              {idx > 0 && (
                <span
                  aria-hidden
                  className="h-px w-6 shrink-0 bg-border sm:w-10"
                />
              )}
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    isActive && "bg-primary text-primary-foreground",
                    isDone && "bg-primary/20 text-primary",
                    !isActive &&
                      !isDone &&
                      "border border-border text-muted-foreground",
                  )}
                >
                  {num}
                </span>
                <span
                  className={cn(
                    "hidden text-xs sm:block",
                    isActive
                      ? "font-semibold text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {label}
                </span>
              </div>
            </li>
          );
        })}
      </ol>

      <div
        className={cn(
          "font-mono text-base font-bold tabular-nums",
          isWarning ? "text-destructive" : "text-foreground",
        )}
        aria-label={`Time remaining: ${formatted}`}
        aria-live="polite"
      >
        {formatted}
      </div>
    </div>
  );
}
