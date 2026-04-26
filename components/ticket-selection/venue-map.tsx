"use client";

import type { Zone } from "./types";

const COLOR_VARS: Record<string, { bg: string; fg: string }> = {
  a: { bg: "var(--zone-a)", fg: "var(--zone-a-fg)" },
  b: { bg: "var(--zone-b)", fg: "var(--zone-b-fg)" },
  c: { bg: "var(--zone-c)", fg: "var(--zone-c-fg)" },
  d: { bg: "var(--zone-d)", fg: "var(--zone-d-fg)" },
  stage: { bg: "var(--zone-stage)", fg: "var(--zone-stage-fg)" },
};

type Props = {
  zones: Zone[];
  selectedZoneId: string | null;
  onZoneClick: (zoneId: string) => void;
};

export function VenueMap({ zones, selectedZoneId, onZoneClick }: Props) {
  const ticketZones = zones.filter((z) => z.colorKey !== "stage");

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Venue Map
      </h2>

      {/* SVG map */}
      <div className="relative w-full overflow-hidden rounded-md border border-border bg-muted/30">
        <svg
          viewBox="0 0 320 260"
          className="w-full"
          role="img"
          aria-label="Venue zone map"
        >
          {/* Stage */}
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

          {/* SVIP — zone a */}
          <SVGZone
            zone={zones.find((z) => z.id === "svip")!}
            x={90}
            y={56}
            w={140}
            h={36}
            selectedZoneId={selectedZoneId}
            onZoneClick={onZoneClick}
          />

          {/* VIP — zone b, left */}
          <SVGZone
            zone={zones.find((z) => z.id === "vip-l")!}
            x={10}
            y={56}
            w={72}
            h={80}
            selectedZoneId={selectedZoneId}
            onZoneClick={onZoneClick}
          />

          {/* VIP — zone b, right */}
          <SVGZone
            zone={zones.find((z) => z.id === "vip-r")!}
            x={238}
            y={56}
            w={72}
            h={80}
            selectedZoneId={selectedZoneId}
            onZoneClick={onZoneClick}
          />

          {/* GA Phase 1 — zone c */}
          <SVGZone
            zone={zones.find((z) => z.id === "ga1")!}
            x={90}
            y={100}
            w={140}
            h={46}
            selectedZoneId={selectedZoneId}
            onZoneClick={onZoneClick}
          />

          {/* GA Phase 2 — zone d */}
          <SVGZone
            zone={zones.find((z) => z.id === "ga2")!}
            x={10}
            y={148}
            w={300}
            h={46}
            selectedZoneId={selectedZoneId}
            onZoneClick={onZoneClick}
          />

          {/* GENERAL — zone d (back) */}
          <SVGZone
            zone={zones.find((z) => z.id === "gen")!}
            x={10}
            y={204}
            w={300}
            h={46}
            selectedZoneId={selectedZoneId}
            onZoneClick={onZoneClick}
          />
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {ticketZones.map((zone) => {
          const colors = COLOR_VARS[zone.colorKey];
          return (
            <div key={zone.id} className="flex items-center gap-1.5">
              <span
                className="size-3 rounded-sm"
                style={{ background: colors.bg }}
                aria-hidden
              />
              <span className="text-xs text-muted-foreground">
                {zone.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type SVGZoneProps = {
  zone: Zone | undefined;
  x: number;
  y: number;
  w: number;
  h: number;
  selectedZoneId: string | null;
  onZoneClick: (id: string) => void;
};

function SVGZone({
  zone,
  x,
  y,
  w,
  h,
  selectedZoneId,
  onZoneClick,
}: SVGZoneProps) {
  if (!zone) return null;
  const colors = COLOR_VARS[zone.colorKey];
  const isSelected = zone.id === selectedZoneId;
  const isUnavailable = zone.available === 0;

  const shortLabel =
    zone.label.length > 12 ? zone.label.slice(0, 11) + "…" : zone.label;

  return (
    <g
      role="button"
      aria-label={`${zone.label}, ${zone.price.toLocaleString("vi-VN")} VND`}
      aria-pressed={isSelected}
      aria-disabled={isUnavailable}
      tabIndex={isUnavailable ? -1 : 0}
      style={{ cursor: isUnavailable ? "not-allowed" : "pointer" }}
      onClick={() => !isUnavailable && onZoneClick(zone.id)}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !isUnavailable)
          onZoneClick(zone.id);
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
