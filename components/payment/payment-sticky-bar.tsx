"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  canContinue: boolean;
  onBack: () => void;
  onContinue: () => void;
};

export function PaymentStickyBar({ canContinue, onBack, onContinue }: Props) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <p className="min-w-0 text-xs text-muted-foreground">
          By clicking Continue you have read and agree to TicketGo&apos;s{" "}
          <a
            href="/operation-regulations"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2"
          >
            Operation Regulations
          </a>
        </p>

        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" onClick={onBack}>
            <span className="hidden sm:inline">Select the ticket again</span>
            <span className="sm:hidden">Go back</span>
          </Button>
          <Button
            onClick={onContinue}
            disabled={!canContinue}
            className={cn(!canContinue && "opacity-60")}
          >
            Continue <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
