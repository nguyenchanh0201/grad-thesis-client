"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

type Props = {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  rightSlot?: React.ReactNode;
  className?: string;
};

export function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
  rightSlot,
  className,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={cn("border-b border-border", className)}>
      <Button
        variant="ghost"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-8 text-left text-sm font-semibold text-foreground transition-colors hover:bg-muted/40"
        aria-expanded={open}
      >
        <span>{title}</span>
        <div className="flex items-center gap-2">
          {rightSlot}
          {open ? (
            <ChevronUp className="size-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
          )}
        </div>
      </Button>
      {open && <div className="px-5 pb-4">{children}</div>}
    </div>
  );
}
