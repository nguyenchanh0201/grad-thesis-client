"use client";

import { Check } from "lucide-react";
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
  isWarning?: boolean;
  backHref?: string;
  onBack?: () => void;
};

export function ProgressSteps({
  currentStep = 1,
  formatted,
  isWarning = false,
  backHref,
  onBack,
}: Props) {
  return (
    <div className="flex items-center justify-between border-b border-border bg-background px-4 py-3 sm:px-6">
      <BackButton backHref={backHref} title="Go back" onBack={onBack} />

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
                    isActive &&
                      "border border-primary bg-primary/10 text-primary",
                    isDone && "bg-primary text-primary-foreground",
                    !isActive &&
                      !isDone &&
                      "border border-border text-muted-foreground",
                  )}
                >
                  {isDone ? <Check className="size-3.5" /> : num}
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
          "flex items-center justify-end gap-1.5 rounded-full border px-2.5 py-1 text-md font-semibold tabular-nums transition-colors",
          "border-border bg-card text-foreground",
          isWarning &&
            "border-destructive/40 bg-destructive/10 text-destructive",
        )}
        aria-label={`Time remaining: ${formatted}`}
        aria-live="polite"
      >
        {formatted}
      </div>
    </div>
  );
}
