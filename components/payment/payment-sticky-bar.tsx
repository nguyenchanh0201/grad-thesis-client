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
      <div className="mx-auto flex max-w-screen-2xl flex-col gap-3 px-4 py-3 sm:px-6 md:flex-row md:items-center md:justify-between">
        <p className="line-clamp-none min-w-0 text-xs leading-relaxed text-muted-foreground md:max-w-[60ch]">
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

        <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex sm:items-center">
          <Button variant="outline" onClick={onBack} className="min-h-11">
            <span className="hidden sm:inline">Select the ticket again</span>
            <span className="sm:hidden">Go back</span>
          </Button>
          <Button
            onClick={onContinue}
            disabled={!canContinue}
            className={cn("min-h-11", !canContinue && "opacity-60")}
          >
            Continue <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
