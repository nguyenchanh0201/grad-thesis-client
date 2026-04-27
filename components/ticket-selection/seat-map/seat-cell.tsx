"use client";

import { cn } from "@/lib/utils";
import type { Seat } from "./types";

const ZONE_COLORS: Record<string, { bg: string; fg: string }> = {
  // theater zones
  vip: { bg: "var(--zone-a)", fg: "var(--zone-a-fg)" },
  standard: { bg: "var(--zone-c)", fg: "var(--zone-c-fg)" },
  economy: { bg: "var(--zone-d)", fg: "var(--zone-d-fg)" },
  // stadium zones
  "s-vip-front": { bg: "var(--zone-a)", fg: "var(--zone-a-fg)" },
  "s-vip-side": { bg: "var(--zone-b)", fg: "var(--zone-b-fg)" },
  "s-standard": { bg: "var(--zone-c)", fg: "var(--zone-c-fg)" },
  "s-economy": { bg: "var(--zone-d)", fg: "var(--zone-d-fg)" },
};

export function getZoneColor(zoneId: string) {
  return (
    ZONE_COLORS[zoneId] ?? { bg: "var(--muted)", fg: "var(--muted-foreground)" }
  );
}

type Props = {
  seat: Seat;
  isSelected: boolean;
  size?: "sm" | "md";
  onToggle: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
};

export function SeatCell({
  seat,
  isSelected,
  size = "md",
  onToggle,
  onKeyDown,
}: Props) {
  const canInteract = seat.status === "available" || isSelected;
  const { bg } = getZoneColor(seat.zoneId);
  const dim = size === "sm" ? "w-5 h-5 text-[7px]" : "w-6 h-6 text-[8px]";

  return (
    <button
      role="gridcell"
      aria-label={`Seat ${seat.label}, ${seat.status}${isSelected ? ", selected" : ""}`}
      aria-selected={isSelected}
      aria-disabled={!canInteract}
      tabIndex={canInteract ? 0 : -1}
      onClick={canInteract ? onToggle : undefined}
      onKeyDown={onKeyDown}
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-[3px] font-bold transition-all duration-100 select-none",
        dim,
        canInteract
          ? "cursor-pointer hover:brightness-110 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-foreground"
          : "cursor-not-allowed",
        isSelected &&
          "ring-2 ring-foreground ring-offset-1 ring-offset-background scale-110",
        seat.status === "reserved" &&
          "border border-dashed border-muted-foreground",
      )}
      style={{
        background:
          seat.status === "sold"
            ? "var(--muted)"
            : seat.status === "reserved"
              ? "var(--muted)"
              : bg,
        opacity:
          seat.status === "sold" ? 0.25 : seat.status === "reserved" ? 0.55 : 1,
      }}
    >
      {seat.status === "sold" && (
        <span aria-hidden className="text-foreground/80 leading-none">
          ✕
        </span>
      )}
    </button>
  );
}
