"use client";

import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { SeatCell, getZoneColor } from "./seat-cell";
import type { StadiumMapConfig, StadiumSection, SelectedSeat } from "./types";
import { Button } from "@/components/ui/button";

const ZONE_COLOR_KEYS: Record<string, string> = {
  "s-vip-front": "a",
  "s-vip-side": "b",
  "s-standard": "c",
  "s-economy": "d",
};

type Props = {
  config: StadiumMapConfig;
  selectedSeats: string[];
  maxSeats: number;
  onSeatToggle: (seat: SelectedSeat) => void;
};

export function StadiumMap({
  config,
  selectedSeats,
  maxSeats,
  onSeatToggle,
}: Props) {
  const [activeSection, setActiveSection] = useState<StadiumSection | null>(
    null,
  );
  const selectedSet = new Set(selectedSeats);

  if (activeSection) {
    return (
      <SectionDetail
        section={activeSection}
        selectedSet={selectedSet}
        maxSeats={maxSeats}
        totalSelected={selectedSeats.length}
        allSections={config.sections}
        onSeatToggle={onSeatToggle}
        onBack={() => setActiveSection(null)}
      />
    );
  }

  return (
    <StadiumOverview
      config={config}
      selectedSet={selectedSet}
      onSectionClick={setActiveSection}
    />
  );
}

// Overview
type OverviewProps = {
  config: StadiumMapConfig;
  selectedSet: Set<string>;
  onSectionClick: (s: StadiumSection) => void;
};

function StadiumOverview({
  config,
  selectedSet,
  onSectionClick,
}: OverviewProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-center text-xs text-muted-foreground">
        Click a section to choose your seats
      </p>

      <div className="relative w-full overflow-hidden rounded-md border border-border bg-muted/30">
        <svg
          viewBox="0 0 320 270"
          className="w-full"
          role="img"
          aria-label="Stadium overview map"
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

          {config.sections.map((section) => {
            const colorKey = ZONE_COLOR_KEYS[section.zoneId] ?? "d";
            const selectedInSection = section.rows
              .flatMap((r) => r.seats)
              .filter((s) => selectedSet.has(s.id)).length;
            const totalAvail = section.rows
              .flatMap((r) => r.seats)
              .filter((s) => s.status === "available").length;
            const isFull = totalAvail === 0;

            return (
              <g
                key={section.id}
                role="button"
                aria-label={`Section ${section.label}${selectedInSection > 0 ? `, ${selectedInSection} selected` : ""}`}
                tabIndex={0}
                style={{ cursor: isFull ? "not-allowed" : "pointer" }}
                onClick={() => !isFull && onSectionClick(section)}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === " ") && !isFull)
                    onSectionClick(section);
                }}
              >
                <rect
                  x={section.svgX}
                  y={section.svgY}
                  width={section.svgW}
                  height={section.svgH}
                  rx={3}
                  fill={`var(--zone-${colorKey})`}
                  opacity={isFull ? 0.3 : 0.85}
                  className="transition-opacity hover:opacity-100"
                />
                <text
                  x={section.svgX + section.svgW / 2}
                  y={
                    section.svgY +
                    section.svgH / 2 -
                    (selectedInSection > 0 ? 5 : 0)
                  }
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="600"
                  fill={`var(--zone-${colorKey}-fg)`}
                >
                  {section.label}
                </text>
                {selectedInSection > 0 && (
                  <text
                    x={section.svgX + section.svgW / 2}
                    y={section.svgY + section.svgH / 2 + 8}
                    textAnchor="middle"
                    fontSize="8"
                    fill={`var(--zone-${colorKey}-fg)`}
                    opacity={0.9}
                  >
                    ({selectedInSection})
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {[
          { id: "s-vip-front", label: "VIP Front" },
          { id: "s-vip-side", label: "VIP Side" },
          { id: "s-standard", label: "Standard" },
          { id: "s-economy", label: "Economy" },
        ].map(({ id, label }) => {
          const { bg } = getZoneColor(id);
          return (
            <div key={id} className="flex items-center gap-1.5">
              <span
                className="size-3 rounded-sm"
                style={{ background: bg }}
                aria-hidden
              />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Section Detail
type DetailProps = {
  section: StadiumSection;
  selectedSet: Set<string>;
  maxSeats: number;
  totalSelected: number;
  allSections: StadiumSection[];
  onSeatToggle: (seat: SelectedSeat) => void;
  onBack: () => void;
};

function SectionDetail({
  section,
  selectedSet,
  maxSeats,
  totalSelected,
  allSections,
  onSeatToggle,
  onBack,
}: DetailProps) {
  const colorKey = ZONE_COLOR_KEYS[section.zoneId] ?? "d";
  const { bg } = getZoneColor(section.zoneId);
  const seatCount = section.rows[0]?.seats.length ?? 0;

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="link"
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
          aria-label="Back to overview"
        >
          <ArrowLeft className="size-4" />
          Overview
        </Button>
        <div className="flex items-center gap-2">
          <span
            className="size-3 rounded-sm"
            style={{ background: bg }}
            aria-hidden
          />
          <span className="text-sm font-semibold">Section {section.label}</span>
        </div>
      </div>

      {/* Mini-map */}
      <div className="relative w-full">
        <svg viewBox="0 0 320 270" className="h-16 w-full" aria-hidden>
          <rect
            x="90"
            y="10"
            width="140"
            height="36"
            rx="4"
            fill="var(--zone-stage)"
            opacity={0.5}
          />
          <text
            x="160"
            y="33"
            textAnchor="middle"
            fontSize="10"
            fill="var(--zone-stage-fg)"
            opacity={0.6}
          >
            STAGE
          </text>
          {allSections.map((s) => {
            const ck = ZONE_COLOR_KEYS[s.zoneId] ?? "d";
            const isActive = s.id === section.id;
            return (
              <rect
                key={s.id}
                x={s.svgX}
                y={s.svgY}
                width={s.svgW}
                height={s.svgH}
                rx={2}
                fill={`var(--zone-${ck})`}
                opacity={isActive ? 1 : 0.3}
                stroke={isActive ? "var(--foreground)" : "none"}
                strokeWidth={isActive ? 2 : 0}
              />
            );
          })}
        </svg>
      </div>

      {/* Seat grid */}
      <div className="overflow-x-auto">
        <div
          role="grid"
          aria-label={`Section ${section.label} seats`}
          aria-multiselectable="true"
          className="inline-flex flex-col gap-1 px-2 pb-2"
        >
          {/* Seat number header */}
          <div className="flex items-center gap-1 pl-7">
            {Array.from({ length: seatCount }, (_, i) => (
              <span
                key={i}
                aria-hidden
                className="flex w-5 items-center justify-center text-[7px] text-muted-foreground/60"
              >
                {i + 1}
              </span>
            ))}
          </div>

          {section.rows.map((row, rowIdx) => (
            <div
              key={row.id}
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
              {row.seats.map((seat) => (
                <SeatCell
                  key={seat.id}
                  seat={seat}
                  isSelected={selectedSet.has(seat.id)}
                  size="sm"
                  onToggle={() => {
                    if (!selectedSet.has(seat.id) && totalSelected >= maxSeats)
                      return;
                    onSeatToggle({
                      id: seat.id,
                      label: `${section.label}-${seat.label}`,
                      zoneId: seat.zoneId,
                    });
                  }}
                  onKeyDown={() => {}}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {totalSelected >= maxSeats && (
        <p className="text-center text-xs text-warning" role="alert">
          Maximum {maxSeats} seats selected
        </p>
      )}
    </div>
  );
}
