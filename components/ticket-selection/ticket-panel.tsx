"use client";

import { ChevronDown, ChevronUp, Minus, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SelectedTicket } from "../../schemas/seat/types";
import type { SelectedSeat } from "./seat-map";
import { fmt } from "@/lib/strings/money";
import { ZoneMode } from "@/schemas/seat";
import type { SectionAvailability } from "@/schemas/seat";
import type { TicketType } from "@/schemas/ticket-type";
import { toSeatSelectionId } from "@/lib/booking/seat-selection-id";

type Props = {
  ticketTypes: TicketType[];
  eventDate: string;
  maxTicketsPerOrder: number;
  onContinue: () => void;
  onChangeDate: () => void;
  isLoading?: boolean;
  // Zone mode
  mode?: ZoneMode;
  tickets?: SelectedTicket[];
  selectedZoneId?: string | null;
  onIncrement?: (ticketTypeId: string) => void;
  onDecrement?: (ticketTypeId: string) => void;
  onDeleteTicket?: (ticketTypeId: string) => void;
  onDeleteAll?: () => void;
  onResetZone?: () => void;
  // Seat mode
  selectedSeats?: SelectedSeat[];
  onSeatRemove?: (seatId: string) => void;
  onSeatClearAll?: () => void;
  seatAvailability?: SectionAvailability[];
};

export function TicketPanel({
  ticketTypes,
  eventDate,
  maxTicketsPerOrder,
  onContinue,
  onChangeDate: _onChangeDate,
  isLoading = false,
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
  seatAvailability = [],
}: Props) {
  const [summaryOpen, setSummaryOpen] = useState(true);

  const zoneTotal = tickets.reduce((s, t) => {
    const tt = ticketTypes.find((x) => x.id === t.ticketTypeId);
    return s + (tt?.price ?? 0) * t.quantity;
  }, 0);
  const zoneTotalQty = tickets.reduce((s, t) => s + t.quantity, 0);

  const seatTotal = selectedSeats.reduce((s, seat) => {
    const tt = ticketTypes.find((x) => x.id === seat.ticketTypeId);
    return s + (tt?.price ?? 0);
  }, 0);

  const totalQty = mode === "seat" ? selectedSeats.length : zoneTotalQty;
  const totalPrice = mode === "seat" ? seatTotal : zoneTotal;

  const getQty = (ticketTypeId: string) =>
    mode === "seat"
      ? selectedSeats.filter((seat) => seat.ticketTypeId === ticketTypeId)
          .length
      : (tickets.find((t) => t.ticketTypeId === ticketTypeId)?.quantity ?? 0);
  const selectedSeatIds = new Set(
    selectedSeats.map((seat) =>
      toSeatSelectionId(seat.ticketTypeId, seat.seatIndex),
    ),
  );

  return (
    <div className="flex h-full flex-col">
      {/* Date row */}
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <span className="text-sm font-medium text-foreground">{eventDate}</span>
        <span className="text-xs text-muted-foreground">
          Max {maxTicketsPerOrder} per order
        </span>
        {/* TODO: This is for multi dates */}
        {/* <Button variant="ghost" size="sm" onClick={onChangeDate}>
          Change
        </Button> */}
      </div>

      {
        <>
          {mode === "zone" && selectedZoneId && (
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
            {ticketTypes.map((tt) => {
              const qty = getQty(tt.id);
              const isHighlighted = mode === "zone" && tt.id === selectedZoneId;
              const limitHit = totalQty >= maxTicketsPerOrder;
              const availableSeatsForTicketType =
                mode === "seat" && seatAvailability.length > 0
                  ? (
                      seatAvailability.find(
                        (section) => section.ticketTypeId === tt.id,
                      )?.seats ?? []
                    ).filter(
                      (seat) =>
                        seat.status === "available" &&
                        !selectedSeatIds.has(
                          toSeatSelectionId(tt.id, seat.seatIndex),
                        ),
                    ).length
                  : null;
              const availableForZoneMode =
                tt.quantity != null && tt.soldCount != null
                  ? Math.max(0, tt.quantity - tt.soldCount)
                  : null;
              const isSoldOut =
                mode === "seat"
                  ? availableSeatsForTicketType !== null &&
                    availableSeatsForTicketType === 0
                  : availableForZoneMode !== null && availableForZoneMode === 0;
              const canIncrease =
                mode === "seat"
                  ? !limitHit &&
                    (availableSeatsForTicketType === null ||
                      availableSeatsForTicketType > 0)
                  : !isSoldOut &&
                    !limitHit &&
                    (availableForZoneMode === null ||
                      qty < availableForZoneMode);
              return (
                <div
                  key={tt.id}
                  id={`zone-row-${tt.id}`}
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
                      {tt.name}
                    </p>
                    <p
                      className={cn(
                        "mt-0.5 text-xs",
                        isSoldOut ? "text-muted-foreground" : "text-primary",
                      )}
                    >
                      {isSoldOut
                        ? "Sold out"
                        : `${fmt(tt.price)} ${tt.currency}`}
                    </p>
                  </div>
                  {isSoldOut ? (
                    <span className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                      Unavailable
                    </span>
                  ) : mode === "seat" ? (
                    <div className="flex items-center gap-3 text-sm">
                      <span className="font-semibold tabular-nums">{qty}</span>
                      <span className="text-xs text-muted-foreground">
                        selected
                      </span>
                    </div>
                  ) : (
                    <div
                      className="flex items-center gap-2"
                      role="group"
                      aria-label={`Quantity for ${tt.name}`}
                    >
                      <Button
                        variant="outline"
                        onClick={() => onDecrement?.(tt.id)}
                        disabled={qty === 0}
                        aria-label="Decrease quantity"
                        className={cn(
                          "flex items-center justify-center rounded border transition",
                          qty === 0
                            ? "cursor-not-allowed border-border text-muted-foreground opacity-40"
                            : "border-border hover:bg-muted",
                        )}
                      >
                        <Minus className="size-4" />
                      </Button>
                      <span className="w-5 text-center text-sm font-semibold tabular-nums">
                        {qty}
                      </span>
                      <Button
                        variant="outline"
                        onClick={() => onIncrement?.(tt.id)}
                        disabled={!canIncrease}
                        aria-label="Increase quantity"
                        className={cn(
                          "flex items-center justify-center rounded border transition",
                          canIncrease
                            ? "border-border hover:bg-muted"
                            : "cursor-not-allowed border-border text-muted-foreground opacity-40",
                        )}
                      >
                        <Plus className="size-4" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      }

      {false && mode === "seat" && (
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
                const tt = ticketTypes.find((x) => x.id === seat.ticketTypeId);
                return (
                  <div
                    key={seat.id}
                    className="flex items-center justify-between px-5 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold">Seat {seat.label}</p>
                      <p className="mt-0.5 text-xs text-primary">
                        {tt?.name ?? seat.ticketTypeId} · {fmt(tt?.price ?? 0)}{" "}
                        {tt?.currency ?? "VND"}
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
                  const tt = ticketTypes.find((x) => x.id === t.ticketTypeId);
                  if (!tt) return null;
                  return (
                    <div
                      key={t.ticketTypeId}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="truncate text-foreground">
                        {tt.name} x {t.quantity}
                      </span>
                      <div className="flex shrink-0 items-center gap-3 pl-4">
                        <span className="text-muted-foreground">
                          {fmt(tt.price * t.quantity)} {tt.currency}
                        </span>
                        <Button
                          variant="ghost"
                          onClick={() => onDeleteTicket?.(t.ticketTypeId)}
                          aria-label={`Remove ${tt.name}`}
                          className="text-muted-foreground transition hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}

              {mode === "seat" &&
                selectedSeats.map((seat) => {
                  const tt = ticketTypes.find(
                    (ticketType) => ticketType.id === seat.ticketTypeId,
                  );
                  if (!tt) return null;
                  return (
                    <div
                      key={seat.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="min-w-0">
                        <span className="block truncate text-foreground">
                          {seat.label}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {tt.name}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-3 pl-4">
                        <span className="text-muted-foreground">
                          {fmt(tt.price)} {tt.currency}
                        </span>
                        <Button
                          variant="ghost"
                          onClick={() => onSeatRemove?.(seat.id)}
                          aria-label={`Remove ${seat.label}`}
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
          disabled={totalQty === 0 || isLoading}
          className={cn(
            "h-11 w-full text-sm font-semibold",
            (totalQty === 0 || isLoading) && "opacity-50",
          )}
        >
          {isLoading
            ? "Processing..."
            : totalQty === 0
              ? "Select tickets to continue"
              : `${fmt(totalPrice)} VND - Continue`}
        </Button>
      </div>
    </div>
  );
}
