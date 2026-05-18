"use client";

import { AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  isValid: boolean;
  onBack: () => void;
  onContinue: () => void;
};

export function StickyValidationBar({ isValid, onBack, onContinue }: Props) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {!isValid ? (
          <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
            <AlertTriangle className="size-4 shrink-0 text-warning" />
            <span className="hidden truncate sm:block">
              You need to fill in all information before proceeding to the next
              step
            </span>
            <span className="truncate sm:hidden">
              Fill in all required fields
            </span>
          </div>
        ) : (
          <span />
        )}

        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" onClick={onBack}>
            <span className="hidden sm:inline">Select the ticket again</span>
            <span className="sm:hidden">Go back</span>
          </Button>
          <Button
            onClick={onContinue}
            disabled={!isValid}
            className={cn(!isValid && "cursor-not-allowed opacity-60")}
          >
            Continue <ArrowRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
