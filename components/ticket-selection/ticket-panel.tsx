"use client";

import { ChevronDown, ChevronUp, Minus, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SelectedTicket } from "../../schemas/seat/types";
import type { SelectedSeat } from "./seat-map";
import { fmt } from "@/lib/strings/money";
import { Zone, ZoneMode } from "@/schemas/seat";

type Props = {
  zones: Zone[];
  eventDate: string;
  onContinue: () => void;
  onChangeDate: () => void;
  // Zone mode
  mode?: ZoneMode;
  tickets?: SelectedTicket[];
  selectedZoneId?: string | null;
  onIncrement?: (zoneId: string) => void;
  onDecrement?: (zoneId: string) => void;
  onDeleteTicket?: (zoneId: string) => void;
  onDeleteAll?: () => void;
  onResetZone?: () => void;
  // Seat mode
  selectedSeats?: SelectedSeat[];
  onSeatRemove?: (seatId: string) => void;
  onSeatClearAll?: () => void;
};

export function TicketPanel({
  zones,
  eventDate,
  onContinue,
  onChangeDate,
  mode = "zone",
  tickets = [],
  selectedZoneId = null,
  onIncrement,
  onDecrement,
  onDeleteTicket,
  onDeleteAll,
  onResetZone,
  selectedSeats = [],
  onSeatRemove,
  onSeatClearAll,
}: Props) {
  const [summaryOpen, setSummaryOpen] = useState(true);

  const zoneTotal = tickets.reduce((s, t) => {
    const zone = zones.find((z) => z.id === t.zoneId);
    return s + (zone?.price ?? 0) * t.quantity;
  }, 0);
  const zoneTotalQty = tickets.reduce((s, t) => s + t.quantity, 0);

  const seatTotal = selectedSeats.reduce((s, seat) => {
    const zone = zones.find((z) => z.id === seat.zoneId);
    return s + (zone?.price ?? 0);
  }, 0);

  const totalQty = mode === "seat" ? selectedSeats.length : zoneTotalQty;
  const totalPrice = mode === "seat" ? seatTotal : zoneTotal;

  const getQty = (zoneId: string) =>
    tickets.find((t) => t.zoneId === zoneId)?.quantity ?? 0;

  return (
    <div className="flex h-full flex-col">
      {/* Date row */}
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <span className="text-sm font-medium text-foreground">{eventDate}</span>
        <Button variant="ghost" size="sm" onClick={onChangeDate}>
          Change
        </Button>
      </div>

      {mode === "zone" && (
        <>
          {selectedZoneId && (
            <div className="border-b border-border px-5 py-2">
              <button
                onClick={onResetZone}
                className="text-sm text-primary underline-offset-2 hover:underline"
              >
                ← Choose another area
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {zones
              .filter((z) => z.colorKey !== "stage")
              .map((zone) => {
                const qty = getQty(zone.id);
                const isHighlighted = zone.id === selectedZoneId;
                const isSoldOut = zone.available === 0;
                return (
                  <div
                    key={zone.id}
                    id={`zone-row-${zone.id}`}
                    className={cn(
                      "flex items-center justify-between border-b border-border px-5 py-4 transition-colors",
                      isHighlighted && "bg-primary/5",
                    )}
                  >
                    <div className="flex-1 pr-4">
                      <p
                        className={cn(
                          "text-sm font-semibold",
                          isSoldOut && "text-muted-foreground",
                        )}
                      >
                        {zone.label}
                      </p>
                      <p
                        className={cn(
                          "mt-0.5 text-xs",
                          isSoldOut ? "text-muted-foreground" : "text-primary",
                        )}
                      >
                        {isSoldOut ? "Sold out" : `${fmt(zone.price)} VND`}
                      </p>
                    </div>
                    {isSoldOut ? (
                      <span className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                        Unavailable
                      </span>
                    ) : (
                      <div
                        className="flex items-center gap-2"
                        role="group"
                        aria-label={`Quantity for ${zone.label}`}
                      >
                        <button
                          onClick={() => onDecrement?.(zone.id)}
                          disabled={qty === 0}
                          aria-label="Decrease quantity"
                          className={cn(
                            "flex size-7 items-center justify-center rounded border transition",
                            qty === 0
                              ? "cursor-not-allowed border-border text-muted-foreground opacity-40"
                              : "border-border hover:bg-muted",
                          )}
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="w-5 text-center text-sm font-semibold tabular-nums">
                          {qty}
                        </span>
                        <button
                          onClick={() => onIncrement?.(zone.id)}
                          aria-label="Increase quantity"
                          className="flex size-7 items-center justify-center rounded border border-border transition hover:bg-muted"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </>
      )}

      {mode === "seat" && (
        <div className="flex-1 overflow-y-auto">
          {selectedSeats.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <p className="text-sm font-medium text-muted-foreground">
                No seats selected
              </p>
              <p className="text-xs text-muted-foreground/70">
                Click a seat on the map to select it
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {selectedSeats.map((seat) => {
                const zone = zones.find((z) => z.id === seat.zoneId);
                return (
                  <div
                    key={seat.id}
                    className="flex items-center justify-between px-5 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold">Seat {seat.label}</p>
                      <p className="mt-0.5 text-xs text-primary">
                        {zone?.label ?? seat.zoneId} · {fmt(zone?.price ?? 0)}{" "}
                        VND
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => onSeatRemove?.(seat.id)}
                      aria-label={`Remove seat ${seat.label}`}
                      className="text-muted-foreground transition hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      {totalQty > 0 && (
        <div className="border-t border-border bg-muted/30">
          <Button
            variant="link"
            onClick={mode === "seat" ? onSeatClearAll : onDeleteAll}
            className="w-full flex justify-end pr-5 text-sm text-muted-foreground underline-offset-2 hover:text-destructive hover:underline"
          >
            Clear all
          </Button>

          <Button
            variant="outline"
            onClick={() => setSummaryOpen((v) => !v)}
            className="flex w-full items-center justify-between px-5 py-3 text-sm font-semibold"
            aria-expanded={summaryOpen}
          >
            <span>
              {mode === "seat"
                ? `${totalQty} seat${totalQty > 1 ? "s" : ""} selected`
                : `Selected tickets (${totalQty})`}
            </span>
            {summaryOpen ? (
              <ChevronDown className="size-4 text-muted-foreground" />
            ) : (
              <ChevronUp className="size-4 text-muted-foreground" />
            )}
          </Button>

          {summaryOpen && (
            <div className="space-y-1 px-5 pb-3">
              {mode === "zone" &&
                tickets.map((t) => {
                  const zone = zones.find((z) => z.id === t.zoneId);
                  if (!zone) return null;
                  return (
                    <div
                      key={t.zoneId}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="truncate text-foreground">
                        {zone.label} x {t.quantity}
                      </span>
                      <div className="flex shrink-0 items-center gap-3 pl-4">
                        <span className="text-muted-foreground">
                          {fmt(zone.price * t.quantity)} VND
                        </span>
                        <Button
                          variant="ghost"
                          onClick={() => onDeleteTicket?.(t.zoneId)}
                          aria-label={`Remove ${zone.label}`}
                          className="text-muted-foreground transition hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}

              <div className="flex items-center justify-between border-t border-border pt-2 text-sm font-semibold">
                <span>Subtotal</span>
                <span>{fmt(totalPrice)} VND</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CTA */}
      <div className="border-t border-border p-4">
        <Button
          onClick={onContinue}
          disabled={totalQty === 0}
          className={cn(
            "h-11 w-full text-sm font-semibold",
            totalQty === 0 && "opacity-50",
          )}
        >
          {totalQty === 0
            ? "Select tickets to continue"
            : `${fmt(totalPrice)} VND - Continue`}
        </Button>
      </div>
    </div>
  );
}
