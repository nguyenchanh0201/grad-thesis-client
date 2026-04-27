"use client";

import { ChevronDown, ChevronUp, MapPin } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { SeatMap } from "./seat-map";
import type { Zone } from "./types";
import type {
  TheaterMapConfig,
  StadiumMapConfig,
  SelectedSeat,
} from "./seat-map";

const COLOR_VARS: Record<string, { bg: string; fg: string }> = {
  a: { bg: "var(--zone-a)", fg: "var(--zone-a-fg)" },
  b: { bg: "var(--zone-b)", fg: "var(--zone-b-fg)" },
  c: { bg: "var(--zone-c)", fg: "var(--zone-c-fg)" },
  d: { bg: "var(--zone-d)", fg: "var(--zone-d-fg)" },
  stage: { bg: "var(--zone-stage)", fg: "var(--zone-stage-fg)" },
};

type Props = {
  zones: Zone[];
  venueImageUrl?: string;
  fallbackImageUrl?: string;
  // Zone mode
  selectedZoneId?: string | null;
  onZoneClick?: (zoneId: string) => void;
  // Seat mode
  seatMapConfig?: TheaterMapConfig | StadiumMapConfig;
  selectedSeats?: string[];
  onSeatToggle?: (seat: SelectedSeat) => void;
};

export function VenueMap({
  zones,
  venueImageUrl,
  fallbackImageUrl,
  selectedZoneId = null,
  onZoneClick,
  seatMapConfig,
  selectedSeats = [],
  onSeatToggle,
}: Props) {
  const [mapOpen, setMapOpen] = useState(true);
  const imageUrl = venueImageUrl ?? fallbackImageUrl;
  const ticketZones = zones.filter(
    (z) => z.colorKey !== "stage" && z.price > 0,
  );
  const isSeatMode = !!seatMapConfig;

  return (
    <div className="flex h-full flex-col">
      {/* Mobile collapse toggle */}
      <button
        className="flex items-center justify-between border-b border-border px-4 py-3 md:hidden"
        onClick={() => setMapOpen((v) => !v)}
        aria-expanded={mapOpen}
        aria-controls="venue-map-body"
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          <MapPin className="size-4 text-muted-foreground" />
          Venue map
        </span>
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
        {isSeatMode ? (
          /* ── Seat-based map ── */
          <SeatMap
            config={seatMapConfig}
            selectedSeats={selectedSeats}
            onSeatToggle={onSeatToggle ?? (() => {})}
          />
        ) : imageUrl ? (
          /* ── Image-based zone map ── */
          <>
            <div className="relative w-full overflow-hidden rounded-md border border-border bg-muted/30">
              <div className="relative aspect-4/3 w-full">
                <Image
                  src={imageUrl}
                  alt={venueImageUrl ? "Venue seat map" : "Event venue"}
                  fill
                  sizes="(max-width: 768px) 100vw, 55vw"
                  className="object-cover object-center"
                />
                {!venueImageUrl && (
                  <div className="absolute inset-0 flex items-end bg-linear-to-t from-black/60 to-transparent">
                    <p className="p-3 text-xs text-white/80">
                      Venue map not available — select a zone from the list
                    </p>
                  </div>
                )}
              </div>
            </div>
            <ZoneLegend
              zones={ticketZones}
              selectedZoneId={selectedZoneId}
              onZoneClick={onZoneClick}
            />
          </>
        ) : (
          /* ── SVG zone map fallback ── */
          <>
            <SVGZoneMap
              zones={zones}
              selectedZoneId={selectedZoneId}
              onZoneClick={onZoneClick ?? (() => {})}
            />
            <ZoneLegend
              zones={ticketZones}
              selectedZoneId={selectedZoneId}
              onZoneClick={onZoneClick}
            />
          </>
        )}
      </div>
    </div>
  );
}

// ─── Zone legend ──────────────────────────────────────────────────────────────

function ZoneLegend({
  zones,
  selectedZoneId,
  onZoneClick,
}: {
  zones: Zone[];
  selectedZoneId: string | null;
  onZoneClick?: (id: string) => void;
}) {
  if (zones.length === 0) return null;
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Zones
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {zones.map((zone) => {
          const colors = COLOR_VARS[zone.colorKey];
          const isSelected = zone.id === selectedZoneId;
          const isSoldOut = zone.available === 0;
          return (
            <button
              key={zone.id}
              onClick={() => !isSoldOut && onZoneClick?.(zone.id)}
              disabled={isSoldOut}
              className="flex items-center gap-1.5 disabled:opacity-40"
            >
              <span
                className="size-3 shrink-0 rounded-sm transition"
                style={{
                  background: colors.bg,
                  ...(isSelected && {
                    outline: "2px solid var(--foreground)",
                    outlineOffset: "1px",
                  }),
                }}
                aria-hidden
              />
              <span
                className={`text-xs ${isSelected ? "font-semibold text-foreground" : "text-muted-foreground"}`}
              >
                {zone.label}
                {isSoldOut && " (Sold out)"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── SVG zone map ─────────────────────────────────────────────────────────────

function SVGZoneMap({
  zones,
  selectedZoneId,
  onZoneClick,
}: {
  zones: Zone[];
  selectedZoneId: string | null;
  onZoneClick: (id: string) => void;
}) {
  return (
    <div className="relative w-full overflow-hidden rounded-md border border-border bg-muted/30">
      <svg
        viewBox="0 0 320 260"
        className="w-full"
        role="img"
        aria-label="Venue zone map"
      >
        <rect
          x="90"
          y="10"
          width="140"
          height="36"
          rx="4"
          fill="var(--zone-stage)"
        />
        <text
          x="160"
          y="33"
          textAnchor="middle"
          fontSize="13"
          fontWeight="600"
          fill="var(--zone-stage-fg)"
        >
          STAGE
        </text>
        <SVGZone
          zone={zones.find((z) => z.id === "svip")!}
          x={90}
          y={56}
          w={140}
          h={36}
          sel={selectedZoneId}
          onClick={onZoneClick}
        />
        <SVGZone
          zone={zones.find((z) => z.id === "vip-l")!}
          x={10}
          y={56}
          w={72}
          h={80}
          sel={selectedZoneId}
          onClick={onZoneClick}
        />
        <SVGZone
          zone={zones.find((z) => z.id === "vip-r")!}
          x={238}
          y={56}
          w={72}
          h={80}
          sel={selectedZoneId}
          onClick={onZoneClick}
        />
        <SVGZone
          zone={zones.find((z) => z.id === "ga1")!}
          x={90}
          y={100}
          w={140}
          h={46}
          sel={selectedZoneId}
          onClick={onZoneClick}
        />
        <SVGZone
          zone={zones.find((z) => z.id === "ga2")!}
          x={10}
          y={148}
          w={300}
          h={46}
          sel={selectedZoneId}
          onClick={onZoneClick}
        />
        <SVGZone
          zone={zones.find((z) => z.id === "gen")!}
          x={10}
          y={204}
          w={300}
          h={46}
          sel={selectedZoneId}
          onClick={onZoneClick}
        />
      </svg>
    </div>
  );
}

function SVGZone({
  zone,
  x,
  y,
  w,
  h,
  sel,
  onClick,
}: {
  zone: Zone | undefined;
  x: number;
  y: number;
  w: number;
  h: number;
  sel: string | null;
  onClick: (id: string) => void;
}) {
  if (!zone) return null;
  const colors = COLOR_VARS[zone.colorKey];
  const isSelected = zone.id === sel;
  const isUnavailable = zone.available === 0;
  const shortLabel =
    zone.label.length > 12 ? zone.label.slice(0, 11) + "…" : zone.label;
  return (
    <g
      role="button"
      aria-label={`${zone.label}`}
      aria-pressed={isSelected}
      aria-disabled={isUnavailable}
      tabIndex={isUnavailable ? -1 : 0}
      style={{ cursor: isUnavailable ? "not-allowed" : "pointer" }}
      onClick={() => !isUnavailable && onClick(zone.id)}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !isUnavailable)
          onClick(zone.id);
      }}
    >
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={3}
        fill={isUnavailable ? "var(--muted)" : colors.bg}
        opacity={isUnavailable ? 0.5 : isSelected ? 1 : 0.85}
        stroke={isSelected ? "var(--foreground)" : "transparent"}
        strokeWidth={isSelected ? 2 : 0}
      />
      <text
        x={x + w / 2}
        y={y + h / 2 - 4}
        textAnchor="middle"
        fontSize="9"
        fontWeight="600"
        fill={isUnavailable ? "var(--muted-foreground)" : colors.fg}
        opacity={isUnavailable ? 0.6 : 1}
      >
        {shortLabel}
      </text>
      <text
        x={x + w / 2}
        y={y + h / 2 + 8}
        textAnchor="middle"
        fontSize="8"
        fill={isUnavailable ? "var(--muted-foreground)" : colors.fg}
        opacity={0.8}
      >
        {isUnavailable ? "Sold Out" : `${(zone.price / 1_000_000).toFixed(1)}M`}
      </text>
    </g>
  );
}
