"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import type {
  SeatMapCanvas,
  SeatMapElement,
  SectionElement,
  ZoneElement,
} from "@/schemas/seat-map";
import type { SectionAvailability, SeatAvailability } from "@/schemas/seat";
import { Button } from "@/components/ui/button";
import { toSeatSelectionId } from "@/lib/booking/seat-selection-id";

export type SelectedSeat = {
  id: string;
  label: string;
  ticketTypeId: string;
  seatIndex: number;
};

type SeatWithTicketType = SeatAvailability & {
  ticketTypeId?: string;
};

type Props = {
  canvas: SeatMapCanvas;
  availability: SectionAvailability[];
  selectedSeats: string[];
  onSeatToggle: (seat: SelectedSeat) => void;
  onZoneSelect?: (ticketTypeId: string) => void;
  maxSeats?: number;
};

export function CanvasSeatMap({
  canvas,
  availability,
  selectedSeats,
  onSeatToggle,
  onZoneSelect,
  maxSeats = 8,
}: Props) {
  const [activeSection, setActiveSection] = useState<SectionElement | null>(
    null,
  );
  const selectedSet = new Set(selectedSeats);

  if (activeSection) {
    const sectionSeats = getSeatsForSection(
      activeSection,
      canvas,
      availability,
    );
    return (
      <SectionDetail
        section={activeSection}
        canvas={canvas}
        seats={sectionSeats}
        selectedSet={selectedSet}
        maxSeats={maxSeats}
        totalSelected={selectedSeats.length}
        onSeatToggle={onSeatToggle}
        onBack={() => setActiveSection(null)}
      />
    );
  }

  return (
    <CanvasOverview
      canvas={canvas}
      availability={availability}
      selectedSet={selectedSet}
      onSectionClick={setActiveSection}
      onZoneSelect={onZoneSelect}
    />
  );
}

// Overview
type OverviewProps = {
  canvas: SeatMapCanvas;
  availability: SectionAvailability[];
  selectedSet: Set<string>;
  onSectionClick: (el: SectionElement) => void;
  onZoneSelect?: (ticketTypeId: string) => void;
};

function CanvasOverview({
  canvas,
  availability,
  selectedSet,
  onSectionClick,
  onZoneSelect,
}: OverviewProps) {
  const availMap = new Map(availability.map((a) => [a.ticketTypeId, a.seats]));

  return (
    <div className="flex flex-col gap-3">
      <p className="text-center text-xs text-muted-foreground">
        Click a section to choose your seats
      </p>
      <div className="relative w-full overflow-hidden rounded-md border border-border">
        <svg
          viewBox={`0 0 ${canvas.width} ${canvas.height}`}
          className="w-full"
          aria-label="Seat map overview"
        >
          {canvas.elements.map((el) => {
            if (el.type === "stage") {
              return (
                <g key={el.id}>
                  <rect
                    x={el.x}
                    y={el.y}
                    width={el.width}
                    height={el.height}
                    rx={4}
                    fill="var(--zone-stage, #374151)"
                  />
                  <text
                    x={el.x + el.width / 2}
                    y={el.y + el.height / 2 + 4}
                    textAnchor="middle"
                    fontSize={Math.min(14, el.height * 0.45)}
                    fontWeight="600"
                    fill="var(--zone-stage-fg, #f9fafb)"
                  >
                    {el.label ?? "STAGE"}
                  </text>
                </g>
              );
            }

            if (el.type === "label") {
              return (
                <text
                  key={el.id}
                  x={el.x}
                  y={el.y}
                  fontSize={el.fontSize ?? 12}
                  fill={el.color ?? "var(--muted-foreground)"}
                >
                  {el.text}
                </text>
              );
            }

            if (el.type === "section") {
              const seats = getSeatsForSection(el, canvas, availability);
              const available = seats.filter(
                (s) => s.status === "available",
              ).length;
              const total = seats.length;
              const sold = Math.max(0, total - available);
              const selectedInSection = seats.filter((s) =>
                selectedSet.has(
                  toSeatSelectionId(
                    s.ticketTypeId ?? el.ticketTypeId ?? el.id,
                    s.seatIndex,
                  ),
                ),
              ).length;
              const soldOut = total > 0 && available === 0;
              const hasData = total > 0;
              const fill = el.color ?? "#6366f1";
              const isInteractive = hasData && !soldOut;

              return (
                <g
                  key={el.id}
                  role={isInteractive ? "button" : undefined}
                  tabIndex={isInteractive ? 0 : -1}
                  aria-label={`${el.name}${selectedInSection > 0 ? `, ${selectedInSection} selected` : ""}${soldOut ? ", sold out" : !hasData ? ", not yet available" : ""}`}
                  style={{ cursor: isInteractive ? "pointer" : "default" }}
                  onClick={() => {
                    if (!isInteractive) return;
                    onSectionClick(el);
                  }}
                  onKeyDown={(e) => {
                    if ((e.key === "Enter" || e.key === " ") && isInteractive) {
                      onSectionClick(el);
                    }
                  }}
                >
                  <rect
                    x={el.x}
                    y={el.y}
                    width={el.width}
                    height={el.height}
                    rx={3}
                    fill={fill}
                    opacity={soldOut || !hasData ? 0.35 : 0.85}
                    className={
                      isInteractive
                        ? "transition-opacity hover:opacity-100"
                        : ""
                    }
                  />
                  <text
                    x={el.x + el.width / 2}
                    y={
                      el.y +
                      el.height / 2 -
                      (hasData || selectedInSection > 0 ? 5 : 0)
                    }
                    textAnchor="middle"
                    fontSize={Math.min(11, el.height * 0.3)}
                    fontWeight="600"
                    fill="#ffffff"
                  >
                    {el.name}
                  </text>
                  {!hasData ? (
                    <text
                      x={el.x + el.width / 2}
                      y={el.y + el.height / 2 + 9}
                      textAnchor="middle"
                      fontSize={Math.min(9, el.height * 0.25)}
                      fill="#ffffff"
                      opacity={0.7}
                    >
                      Not available
                    </text>
                  ) : hasData ? (
                    <text
                      x={el.x + el.width / 2}
                      y={el.y + el.height / 2 + 9}
                      textAnchor="middle"
                      fontSize={Math.min(9, el.height * 0.25)}
                      fill="#ffffff"
                      opacity={0.85}
                    >
                      {soldOut
                        ? "Sold Out"
                        : selectedInSection > 0
                          ? `${selectedInSection} selected`
                          : `${sold}/${total}`}
                    </text>
                  ) : null}
                </g>
              );
            }

            if (el.type === "zone") {
              const seats = el.ticketTypeId
                ? (availMap.get(el.ticketTypeId) ?? [])
                : [];
              const available =
                seats.length > 0
                  ? seats.filter((s) => s.status === "available").length
                  : el.capacity;
              const total = seats.length > 0 ? seats.length : el.capacity;
              const sold = Math.max(0, total - available);
              const soldOut = total > 0 && available === 0;
              const fill = el.color ?? "#10b981";
              const canSelect = !!el.ticketTypeId && available > 0;
              const isCommitted = !!el.ticketTypeId;

              return (
                <g
                  key={el.id}
                  role={canSelect ? "button" : undefined}
                  tabIndex={canSelect ? 0 : -1}
                  aria-label={`${el.name}${soldOut ? ", sold out" : ""}`}
                  style={{ cursor: canSelect ? "pointer" : "default" }}
                  onClick={() => canSelect && onZoneSelect?.(el.ticketTypeId!)}
                  onKeyDown={(e) => {
                    if ((e.key === "Enter" || e.key === " ") && canSelect)
                      onZoneSelect?.(el.ticketTypeId!);
                  }}
                >
                  <rect
                    x={el.x}
                    y={el.y}
                    width={el.width}
                    height={el.height}
                    rx={3}
                    fill={fill}
                    opacity={soldOut || !isCommitted ? 0.35 : 0.8}
                    className={
                      canSelect ? "transition-opacity hover:opacity-100" : ""
                    }
                  />
                  <text
                    x={el.x + el.width / 2}
                    y={el.y + el.height / 2 - 4}
                    textAnchor="middle"
                    fontSize={Math.min(10, el.height * 0.3)}
                    fontWeight="600"
                    fill="#ffffff"
                  >
                    {el.name}
                  </text>
                  <text
                    x={el.x + el.width / 2}
                    y={el.y + el.height / 2 + 8}
                    textAnchor="middle"
                    fontSize={Math.min(9, el.height * 0.25)}
                    fill="#ffffff"
                    opacity={0.85}
                  >
                    {!isCommitted
                      ? "Not available"
                      : soldOut
                        ? "Sold Out"
                        : `${sold}/${total} sold/total`}
                  </text>
                </g>
              );
            }

            return null;
          })}
        </svg>
      </div>

      <SectionLegend canvas={canvas} />
    </div>
  );
}

function SectionLegend({ canvas }: { canvas: SeatMapCanvas }) {
  const sections = canvas.elements.filter(
    (el): el is SectionElement => el.type === "section",
  );
  const zones = canvas.elements.filter(
    (el): el is ZoneElement => el.type === "zone",
  );

  if (sections.length === 0 && zones.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1">
      {sections.map((el) => (
        <div key={el.id} className="flex items-center gap-1.5">
          <span
            className="size-3 rounded-sm"
            style={{ background: el.color ?? "#6366f1" }}
            aria-hidden
          />
          <span className="text-xs text-muted-foreground">{el.name}</span>
        </div>
      ))}
      {zones.map((el) => (
        <div key={el.id} className="flex items-center gap-1.5">
          <span
            className="size-3 rounded-sm opacity-80"
            style={{ background: el.color ?? "#10b981" }}
            aria-hidden
          />
          <span className="text-xs text-muted-foreground">{el.name} (GA)</span>
        </div>
      ))}
    </div>
  );
}

// Section Detail
type DetailProps = {
  section: SectionElement;
  canvas: SeatMapCanvas;
  seats: SeatWithTicketType[];
  selectedSet: Set<string>;
  maxSeats: number;
  totalSelected: number;
  onSeatToggle: (seat: SelectedSeat) => void;
  onBack: () => void;
};

function SectionDetail({
  section,
  canvas,
  seats,
  selectedSet,
  maxSeats,
  totalSelected,
  onSeatToggle,
  onBack,
}: DetailProps) {
  // Group seats by row label
  const rows = buildRows(seats);

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="link"
          onClick={onBack}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
          aria-label="Back to overview"
        >
          <ArrowLeft className="size-3.5" />
          Overview
        </Button>
        <div className="flex items-center gap-2">
          <span
            className="size-3 rounded-sm"
            style={{ background: section.color ?? "#6366f1" }}
            aria-hidden
          />
          <span className="text-sm font-semibold">{section.name}</span>
        </div>
      </div>

      {/* Mini-map */}
      <MiniMap canvas={canvas} activeSectionId={section.id} />

      {/* Seat grid */}
      {rows.length > 0 ? (
        <div className="overflow-x-auto">
          <div
            role="grid"
            aria-label={`${section.name} seats`}
            aria-multiselectable="true"
            className="inline-flex flex-col gap-1 px-2 pb-2"
          >
            {rows.map(({ label, seats: rowSeats }) => (
              <div
                key={label}
                role="row"
                aria-label={`Row ${label}`}
                className="flex items-center gap-1"
              >
                <span
                  aria-hidden
                  className="w-6 shrink-0 text-center text-xs font-semibold text-muted-foreground"
                >
                  {label}
                </span>
                {rowSeats.map((seat) => {
                  const resolvedTicketTypeId =
                    seat.ticketTypeId ?? section.ticketTypeId ?? section.id;
                  const isSelected = selectedSet.has(
                    toSeatSelectionId(resolvedTicketTypeId, seat.seatIndex),
                  );
                  const isAvailable = seat.status === "available";
                  const isLocked = seat.status === "locked";
                  return (
                    <button
                      key={seat.seatLabel}
                      role="gridcell"
                      aria-label={`Seat ${seat.seatLabel}`}
                      aria-selected={isSelected}
                      aria-disabled={!isAvailable && !isSelected}
                      disabled={!isAvailable && !isSelected}
                      onClick={() => {
                        if (!isSelected && totalSelected >= maxSeats) return;
                        if (!isAvailable && !isSelected) return;
                        onSeatToggle({
                          id: toSeatSelectionId(
                            resolvedTicketTypeId,
                            seat.seatIndex,
                          ),
                          label: `${section.name} · ${seat.seatLabel}`,
                          ticketTypeId:
                            resolvedTicketTypeId,
                          seatIndex: seat.seatIndex,
                        });
                      }}
                      className={[
                        "flex size-5 shrink-0 items-center justify-center rounded-sm text-[7px] font-medium transition-all",
                        isSelected ? "scale-105 ring-2 ring-white" : "",
                        isAvailable && !isSelected
                          ? "cursor-pointer hover:opacity-90"
                          : "",
                        isLocked ? "cursor-not-allowed opacity-60" : "",
                        !isAvailable && !isSelected && !isLocked
                          ? "cursor-not-allowed opacity-30"
                          : "",
                      ]
                        .join(" ")
                        .trim()}
                      style={{
                        background: isSelected
                          ? (section.color ?? "#6366f1")
                          : isAvailable
                            ? `${section.color ?? "#6366f1"}99`
                            : isLocked
                              ? "#f59e0b66"
                              : "var(--muted)",
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-center text-sm text-muted-foreground">
          Seat data not available yet.
        </p>
      )}

      {/* Status legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <LegendItem
          color={`${section.color ?? "#6366f1"}99`}
          label="Available"
        />
        <LegendItem color={section.color ?? "#6366f1"} label="Selected" ring />
        <LegendItem color="#f59e0b66" label="Held" />
        <LegendItem color="var(--muted)" label="Sold" />
      </div>

      {totalSelected >= maxSeats && (
        <p className="text-center text-xs text-amber-500" role="alert">
          Maximum {maxSeats} seats selected
        </p>
      )}
    </div>
  );
}

function LegendItem({
  color,
  label,
  ring,
}: {
  color: string;
  label: string;
  ring?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`size-3 rounded-sm ${ring ? "ring-2 ring-white ring-offset-1 ring-offset-background" : ""}`}
        style={{ background: color }}
        aria-hidden
      />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function MiniMap({
  canvas,
  activeSectionId,
}: {
  canvas: SeatMapCanvas;
  activeSectionId: string;
}) {
  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${canvas.width} ${canvas.height}`}
        className="h-16 w-full"
        aria-hidden
      >
        {canvas.elements.map((el) => {
          if (el.type === "stage") {
            return (
              <rect
                key={el.id}
                x={el.x}
                y={el.y}
                width={el.width}
                height={el.height}
                rx={3}
                fill="var(--zone-stage, #374151)"
                opacity={0.4}
              />
            );
          }
          if (el.type === "section" || el.type === "zone") {
            const isActive = el.id === activeSectionId;
            return (
              <rect
                key={el.id}
                x={el.x}
                y={el.y}
                width={el.width}
                height={el.height}
                rx={2}
                fill={el.color ?? "#6366f1"}
                opacity={isActive ? 1 : 0.25}
                stroke={isActive ? "white" : "none"}
                strokeWidth={isActive ? 2 : 0}
              />
            );
          }
          return null;
        })}
      </svg>
    </div>
  );
}

// Generate seats from section rowConfigs when the backend provides no seat data.
// Status defaults to "available"; actual availability supersedes this when present.
function getSeatsForSection(
  section: SectionElement,
  canvas: SeatMapCanvas,
  availability: SectionAvailability[],
): SeatWithTicketType[] {
  if (section.ticketTypeId) {
    return (
      availability
        .find((a) => a.ticketTypeId === section.ticketTypeId)
        ?.seats.map((seat) => ({
          ...seat,
          ticketTypeId: section.ticketTypeId,
        })) ?? []
    );
  }

  const { start, end } = getSectionSeatIndexRange(section, canvas);
  const seats = availability.flatMap((group) =>
    group.seats
      .filter((seat) => seat.seatIndex >= start && seat.seatIndex < end)
      .map((seat) => ({ ...seat, ticketTypeId: group.ticketTypeId })),
  );

  return seats;
}

function getSectionSeatIndexRange(
  section: SectionElement,
  canvas: SeatMapCanvas,
) {
  let start = 0;

  for (const element of canvas.elements) {
    if (element.id === section.id) {
      break;
    }
    if (isSectionElement(element)) {
      start += getSectionSeatCount(element);
    }
  }

  return {
    start,
    end: start + getSectionSeatCount(section),
  };
}

function getSectionSeatCount(section: SectionElement) {
  if (section.rowConfigs && section.rowConfigs.length > 0) {
    return section.rowConfigs.reduce((sum, row) => sum + row.seatCount, 0);
  }

  return (section.rows ?? 0) * (section.seatsPerRow ?? 0);
}

function isSectionElement(element: SeatMapElement): element is SectionElement {
  return element.type === "section";
}

// Helpers
function buildRows(
  seats: SeatWithTicketType[],
): { label: string; seats: SeatWithTicketType[] }[] {
  const map = new Map<string, SeatWithTicketType[]>();
  for (const seat of seats) {
    const existing = map.get(seat.seatRow);
    if (existing) {
      existing.push(seat);
    } else {
      map.set(seat.seatRow, [seat]);
    }
  }
  return Array.from(map.entries()).map(([label, rowSeats]) => ({
    label,
    seats: rowSeats.sort((a, b) => a.seatNumber - b.seatNumber),
  }));
}
