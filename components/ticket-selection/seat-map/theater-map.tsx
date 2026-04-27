"use client";

import { useRef } from "react";
import { SeatCell, getZoneColor } from "./seat-cell";
import type { TheaterMapConfig, SelectedSeat } from "./types";

const ZONE_LABELS: Record<string, string> = {
  vip: "VIP",
  standard: "Standard",
  economy: "Economy",
};

type Props = {
  config: TheaterMapConfig;
  selectedSeats: string[];
  maxSeats: number;
  onSeatToggle: (seat: SelectedSeat) => void;
};

export function TheaterMap({
  config,
  selectedSeats,
  maxSeats,
  onSeatToggle,
}: Props) {
  const gridRef = useRef<HTMLDivElement>(null);
  const selectedSet = new Set(selectedSeats);
  const seatCount = config.rows[0]?.seats.length ?? 0;

  function focusCell(rowIdx: number, seatIdx: number) {
    const grid = gridRef.current;
    if (!grid) return;
    const rows = grid.querySelectorAll("[data-row]");
    const row = rows[rowIdx];
    if (!row) return;
    const cells = row.querySelectorAll<HTMLElement>("[role='gridcell']");
    cells[seatIdx]?.focus();
  }

  function handleKeyDown(
    e: React.KeyboardEvent,
    rowIdx: number,
    seatIdx: number,
  ) {
    const moves: Record<string, [number, number]> = {
      ArrowRight: [0, 1],
      ArrowLeft: [0, -1],
      ArrowDown: [1, 0],
      ArrowUp: [-1, 0],
    };
    const delta = moves[e.key];
    if (!delta) return;
    e.preventDefault();
    focusCell(rowIdx + delta[0], seatIdx + delta[1]);
  }

  // Collect unique zones for the legend strip
  const zoneOrder = Array.from(
    new Map(
      config.rows.map((r) => [r.seats[0]?.zoneId, r.seats[0]?.zoneId]),
    ).values(),
  ).filter(Boolean);

  return (
    <div className="flex flex-col gap-3">
      {/* Stage */}
      <div className="mx-auto w-3/5 rounded-sm bg-foreground/10 py-1.5 text-center text-xs font-semibold tracking-widest text-muted-foreground border border-border">
        STAGE
      </div>

      {/* Zone color strip */}
      <div className="flex items-center justify-center gap-4">
        {zoneOrder.map((zoneId) => {
          const { bg } = getZoneColor(zoneId);
          return (
            <div key={zoneId} className="flex items-center gap-1.5">
              <span
                className="size-3 rounded-sm"
                style={{ background: bg }}
                aria-hidden
              />
              <span className="text-xs text-muted-foreground">
                {ZONE_LABELS[zoneId] ?? zoneId}
              </span>
            </div>
          );
        })}
        <div className="flex items-center gap-1.5">
          <span
            className="size-3 rounded-sm border border-dashed border-muted-foreground bg-muted opacity-55"
            aria-hidden
          />
          <span className="text-xs text-muted-foreground">Reserved</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-muted opacity-25" aria-hidden />
          <span className="text-xs text-muted-foreground">Sold</span>
        </div>
      </div>

      {/* Seat grid */}
      <div className="overflow-x-auto">
        <div
          ref={gridRef}
          role="grid"
          aria-label="Theater seat map"
          aria-multiselectable="true"
          className="inline-flex flex-col gap-1 px-2 pb-2"
        >
          {/* Seat number header */}
          <div className="flex items-center gap-1 pl-7">
            {Array.from({ length: seatCount }, (_, i) => (
              <span
                key={i}
                aria-hidden
                className="flex w-6 items-center justify-center text-[8px] text-muted-foreground/60"
              >
                {i + 1}
              </span>
            ))}
          </div>

          {config.rows.map((row, rowIdx) => {
            const prevZone =
              rowIdx > 0 ? config.rows[rowIdx - 1].seats[0]?.zoneId : null;
            const curZone = row.seats[0]?.zoneId;
            const showDivider = prevZone && prevZone !== curZone;

            return (
              <div key={row.id}>
                {showDivider && (
                  <div
                    className="my-1 border-t border-dashed border-border"
                    aria-hidden
                  />
                )}
                <div
                  role="row"
                  data-row={rowIdx}
                  aria-label={`Row ${row.label}`}
                  className="flex items-center gap-1"
                >
                  <span
                    aria-hidden
                    className="w-6 shrink-0 text-center text-xs font-semibold text-muted-foreground"
                  >
                    {row.label}
                  </span>
                  {row.seats.map((seat, seatIdx) => (
                    <SeatCell
                      key={seat.id}
                      seat={seat}
                      isSelected={selectedSet.has(seat.id)}
                      onToggle={() => {
                        if (
                          !selectedSet.has(seat.id) &&
                          selectedSeats.length >= maxSeats
                        )
                          return;
                        onSeatToggle({
                          id: seat.id,
                          label: seat.label,
                          zoneId: seat.zoneId,
                        });
                      }}
                      onKeyDown={(e) => handleKeyDown(e, rowIdx, seatIdx)}
                    />
                  ))}
                  <span
                    aria-hidden
                    className="w-6 shrink-0 text-center text-xs font-semibold text-muted-foreground"
                  >
                    {row.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedSeats.length >= maxSeats && (
        <p className="text-center text-xs text-warning" role="alert">
          Maximum {maxSeats} seats selected
        </p>
      )}
    </div>
  );
}
