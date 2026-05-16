"use client";

import { ChevronDown, ChevronUp, MapPin } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { CanvasSeatMap } from "./seat-map/canvas-seat-map";
import type { SelectedSeat } from "./seat-map/canvas-seat-map";
import { isSvgImageSource } from "@/lib/image/is-svg-image-source";

export type { SelectedSeat } from "./seat-map/canvas-seat-map";
import type { SeatMapCanvas } from "@/schemas/seat-map";
import type { SectionAvailability } from "@/schemas/seat";
import type { TicketType } from "@/schemas/ticket-type";

type Props = {
  ticketTypes: TicketType[];
  fallbackImageUrl?: string;
  // Zone mode
  selectedZoneId?: string | null;
  onZoneClick?: (ticketTypeId: string) => void;
  // Canvas seat mode
  canvas?: SeatMapCanvas;
  availability?: SectionAvailability[];
  selectedSeats?: string[];
  onSeatToggle?: (seat: SelectedSeat) => void;
  maxSeats?: number;
};

export function SeatMap({
  ticketTypes,
  fallbackImageUrl,
  selectedZoneId = null,
  onZoneClick,
  canvas,
  availability = [],
  selectedSeats = [],
  onSeatToggle,
  maxSeats,
}: Props) {
  const [mapOpen, setMapOpen] = useState(true);
  const isCanvasMode = !!canvas;

  return (
    <div className="flex h-full flex-col">
      {/* Mobile collapse toggle */}
      <button
        className="ml-auto border-b border-border px-4 py-3 md:hidden"
        onClick={() => setMapOpen((v) => !v)}
        aria-expanded={mapOpen}
        aria-controls="venue-map-body"
      >
        {mapOpen ? (
          <ChevronUp className="size-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-4 text-muted-foreground" />
        )}
      </button>

      <div
        id="venue-map-body"
        className={
          mapOpen
            ? "flex flex-1 flex-col gap-4 overflow-y-auto p-4"
            : "hidden md:flex md:flex-1 md:flex-col md:gap-4 md:overflow-y-auto md:p-4"
        }
      >
        {isCanvasMode ? (
          <CanvasSeatMap
            canvas={canvas}
            availability={availability}
            selectedSeats={selectedSeats}
            onSeatToggle={onSeatToggle ?? (() => {})}
            onZoneSelect={onZoneClick}
            maxSeats={maxSeats}
          />
        ) : fallbackImageUrl ? (
          <div className="relative w-full overflow-hidden rounded-md border border-border bg-muted/30">
            <div className="relative aspect-4/3 w-full">
              <Image
                src={fallbackImageUrl}
                alt="Event venue"
                fill
                sizes="(max-width: 768px) 100vw, 55vw"
                className="object-cover object-center"
                unoptimized={isSvgImageSource(fallbackImageUrl)}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-md border border-border bg-muted/30 py-16">
            <p className="text-sm text-muted-foreground">
              No seat map available
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
