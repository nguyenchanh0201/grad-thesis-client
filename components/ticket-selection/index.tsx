"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { clearBuySession, hasBuySession } from "@/lib/booking/buy-session";
import { useBookingStore } from "@/lib/store/booking";
import {
  mockEventDetail,
  mockEventDetailTheater,
  mockEventDetailZone,
} from "@/lib/mock/events";
import { EventBanner } from "./event-banner";
import { ProgressSteps } from "./progress-steps";
import { TicketPanel } from "./ticket-panel";
import { TimeoutModal } from "./timeout-modal";
import { VenueMap } from "./venue-map";
import { useTicketTimer } from "../../hooks/use-ticket-timer";
import { generateTheaterConfig, generateStadiumConfig } from "./seat-map";
import type { SelectedSeat } from "./seat-map";
import { Zone } from "@/schemas/seat";

// Zone Mock
const ZONE_MAP_ZONES: Zone[] = [
  { id: "svip", label: "SVIP", price: 4_900_000, colorKey: "a", available: 50 },
  {
    id: "vip-l",
    label: "VIP Left",
    price: 2_900_000,
    colorKey: "b",
    available: 80,
  },
  {
    id: "vip-r",
    label: "VIP Right",
    price: 2_900_000,
    colorKey: "b",
    available: 80,
  },
  {
    id: "ga1",
    label: "GA Phase 1",
    price: 1_399_000,
    colorKey: "c",
    available: 200,
  },
  {
    id: "ga2",
    label: "GA Phase 2",
    price: 1_099_000,
    colorKey: "d",
    available: 300,
  },
  { id: "gen", label: "General", price: 799_000, colorKey: "d", available: 0 },
  { id: "stage", label: "Stage", price: 0, colorKey: "stage", available: 0 },
];

// Theater Mock
const THEATER_ZONES: Zone[] = [
  {
    id: "vip",
    label: "VIP (Rows A–C)",
    price: 1_500_000,
    colorKey: "a",
    available: 42,
  },
  {
    id: "standard",
    label: "Standard (Rows D–H)",
    price: 800_000,
    colorKey: "c",
    available: 70,
  },
  {
    id: "economy",
    label: "Economy (Rows I–L)",
    price: 400_000,
    colorKey: "d",
    available: 56,
  },
];

// Stadium Mock
const STADIUM_ZONES: Zone[] = [
  {
    id: "s-vip-front",
    label: "VIP Front",
    price: 2_500_000,
    colorKey: "a",
    available: 40,
  },
  {
    id: "s-vip-side",
    label: "VIP Side",
    price: 1_800_000,
    colorKey: "b",
    available: 80,
  },
  {
    id: "s-standard",
    label: "Standard",
    price: 900_000,
    colorKey: "c",
    available: 120,
  },
  {
    id: "s-economy",
    label: "Economy",
    price: 500_000,
    colorKey: "d",
    available: 80,
  },
];

const MOCK_EVENT_DETAILS = [
  mockEventDetail,
  mockEventDetailTheater,
  mockEventDetailZone,
];
function getMockEvent(slug: string) {
  return MOCK_EVENT_DETAILS.find((e) => e.slug === slug) ?? mockEventDetail;
}

const MAX_PER_ZONE = 8;
const MAX_SEATS = 8;

type Props = { slug: string };

export function TicketSelection({ slug }: Props) {
  const router = useRouter();
  const {
    formatted,
    timeRemaining,
    timedOut,
    reset: timerReset,
  } = useTicketTimer();
  const panelRef = useRef<HTMLDivElement>(null);

  const {
    tickets,
    selectedSeats,
    selectedZoneId,
    initStep1,
    setSelectedZoneId,
    incrementTicket,
    decrementTicket,
    deleteTicket,
    clearTickets,
    toggleSeat,
    removeSeat,
    clearSeats,
    reset: storeReset,
  } = useBookingStore();

  // TODO: Eliminate later
  const skipGuard = process.env.NEXT_PUBLIC_SKIP_BUY_SESSION === "true";
  const [authorized] = useState(() => skipGuard || hasBuySession(slug));

  useEffect(() => {
    if (!authorized) {
      storeReset(); // clear persisted state so re-queuing always starts fresh
      router.replace(`/events/${slug}`);
    }
  }, [authorized, slug, router, storeReset]);

  const isWarning = timeRemaining <= 60;

  const event = useMemo(() => getMockEvent(slug), [slug]);
  const mapType = event.seatMapType ?? "zone";

  const activeZones = useMemo<Zone[]>(
    () =>
      mapType === "theater"
        ? THEATER_ZONES
        : mapType === "stadium"
          ? STADIUM_ZONES
          : ZONE_MAP_ZONES,
    [mapType],
  );

  const theaterConfig = useMemo(() => generateTheaterConfig(), []);
  const stadiumConfig = useMemo(() => generateStadiumConfig(), []);
  const seatMapConfig =
    mapType === "theater"
      ? theaterConfig
      : mapType === "stadium"
        ? stadiumConfig
        : undefined;

  // Seed store with slug + zones on mount; resets selection if slug changed
  useEffect(() => {
    initStep1({ slug, zones: activeZones, mapType });
  }, [slug, activeZones, mapType, initStep1]);

  const handleZoneClick = useCallback(
    (zoneId: string) => {
      setSelectedZoneId(zoneId);
      document
        .getElementById(`zone-row-${zoneId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    },
    [setSelectedZoneId],
  );

  const handleIncrement = useCallback(
    (zoneId: string) => incrementTicket(zoneId, MAX_PER_ZONE),
    [incrementTicket],
  );

  const handleDecrement = useCallback(
    (zoneId: string) => decrementTicket(zoneId),
    [decrementTicket],
  );

  const handleSeatToggle = useCallback(
    (seat: SelectedSeat) => toggleSeat(seat, MAX_SEATS),
    [toggleSeat],
  );

  const handleContinue = () => {
    router.replace(`/buy/${slug}/info`);
  };

  const handleTimeoutOk = () => {
    clearBuySession(slug);
    timerReset();
    storeReset();
    router.replace(`/events/${slug}`);
  };

  if (!authorized) return null;

  const isSeatMode = mapType !== "zone";
  const selectedSeatIds = selectedSeats.map((s) => s.id);

  return (
    <div className="flex min-h-[calc(100vh-var(--header-height))] flex-col">
      <ProgressSteps
        currentStep={1}
        formatted={formatted}
        isWarning={isWarning}
        backHref="/events"
      />
      <EventBanner
        eventTitle={event.title}
        eventDate={
          event.dates[0]
            ? `${event.dates[0].label} • ${event.dates[0].startTime.slice(11, 16)}`
            : ""
        }
        eventLocation={`${event.venue.name}, ${event.venue.city}`}
      />
      {/* Two-panel layout */}
      <div className="flex flex-1 flex-col md:flex-row">
        {/* Left: venue map */}
        <div className="border-b border-border md:w-[55%] md:border-b-0 md:border-r">
          <VenueMap
            zones={activeZones}
            venueImageUrl={event.seatMapImage}
            fallbackImageUrl={isSeatMode ? undefined : event.images[0]}
            selectedZoneId={selectedZoneId}
            onZoneClick={handleZoneClick}
            seatMapConfig={seatMapConfig}
            selectedSeats={selectedSeatIds}
            onSeatToggle={handleSeatToggle}
          />
        </div>

        {/* Right: ticket panel */}
        <div
          ref={panelRef}
          className="flex flex-col md:w-[45%] md:overflow-y-auto"
          style={{ maxHeight: "calc(100vh - var(--header-height) - 6rem)" }}
        >
          <TicketPanel
            zones={activeZones}
            eventDate={event.dates[0]?.label ?? ""}
            onContinue={handleContinue}
            onChangeDate={() => {}}
            mode={isSeatMode ? "seat" : "zone"}
            tickets={tickets}
            selectedZoneId={selectedZoneId}
            onIncrement={handleIncrement}
            onDecrement={handleDecrement}
            onDeleteTicket={deleteTicket}
            onDeleteAll={clearTickets}
            onResetZone={() => setSelectedZoneId(null)}
            selectedSeats={selectedSeats}
            onSeatRemove={removeSeat}
            onSeatClearAll={clearSeats}
          />
        </div>
      </div>

      <TimeoutModal open={timedOut} onOk={handleTimeoutOk} />
    </div>
  );
}
