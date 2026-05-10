"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { clearBuySession, hasBuySession } from "@/lib/booking/buy-session";
import { useBookingStore } from "@/lib/store/booking";
import { useEventBySlug } from "@/hooks/use-events";
import { EventBanner } from "./event-banner";
import { ProgressSteps } from "./progress-steps";
import { TicketPanel } from "./ticket-panel";
import { TimeoutModal } from "./timeout-modal";
import { VenueMap } from "./venue-map";
import { useTicketTimer } from "../../hooks/use-ticket-timer";
import type { SelectedSeat } from "./seat-map";
import type { Zone, ZoneColorKey } from "@/schemas/seat";
import type { TicketType } from "@/schemas/ticket-type";
import { fmtIsoDate } from "@/lib/date";
import { getEventSeatMap } from "@/services/seat-map.service";
import { getEventSeats } from "@/services/event.service";
import { SectionAvailability } from "@/schemas/seat";

const ZONE_COLORS: ZoneColorKey[] = ["a", "b", "c", "d"];

function ticketTypeToZone(tt: TicketType, idx: number): Zone {
  const quantity = tt.quantity ?? 100;
  const soldCount = tt.soldCount ?? 0;
  return {
    id: tt.id,
    label: tt.name,
    price: tt.price / 100,
    colorKey: ZONE_COLORS[idx % ZONE_COLORS.length],
    available: Math.max(0, quantity - soldCount),
  };
}

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

  const [authorized] = useState(() => hasBuySession(slug));

  useEffect(() => {
    if (!authorized) {
      storeReset();
      router.replace(`/events/${slug}`);
    }
  }, [authorized, slug, router, storeReset]);

  const { data: eventResult } = useEventBySlug(slug);
  const event = eventResult?.data;
  const eventId = event?.id;
  const isSeated = event?.isSeated ?? false;

  // Fetch canvas only for seated events
  const { data: seatMapResult } = useQuery({
    queryKey: ["seatMap", "event", eventId],
    queryFn: () => getEventSeatMap(eventId!),
    enabled: !!eventId && isSeated,
    staleTime: 5 * 60 * 1000,
  });
  const canvas = seatMapResult?.data?.canvas;

  // Fetch availability, refresh every 10s while user is on this page
  const { data: seatsResult } = useQuery({
    queryKey: ["seatMap", "availability", eventId],
    queryFn: () => getEventSeats(eventId!),
    enabled: !!eventId && isSeated,
    refetchInterval: 10_000,
    staleTime: 5_000,
  });
  const availability: SectionAvailability[] = seatsResult?.data ?? [];

  const isWarning = timeRemaining <= 60;
  const maxPerZone = event?.maxTicketsPerOrder ?? MAX_SEATS;

  const activeZones = useMemo<Zone[]>(() => {
    if (event?.ticketTypes && event.ticketTypes.length > 0) {
      return event.ticketTypes.map(ticketTypeToZone);
    }
    return [];
  }, [event]);

  useEffect(() => {
    if (activeZones.length === 0) return;
    initStep1({
      slug,
      zones: activeZones,
      mapType: isSeated ? "seated" : "zone",
    });
  }, [slug, activeZones, isSeated, initStep1]);

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
    (zoneId: string) => incrementTicket(zoneId, maxPerZone),
    [incrementTicket, maxPerZone],
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

  const selectedSeatIds = selectedSeats.map((s) => s.id);

  const eventTitle = event?.eventName ?? "";
  const eventDateStr = event
    ? `${fmtIsoDate(event.eventDate)} • ${event.eventDate.slice(11, 16)}`
    : "";
  const eventLocation = event?.venue
    ? `${event.venue.venueName}, ${event.venue.city}`
    : "";
  const eventImageUrl = event?.featuredImageUrl ?? event?.eventImageUrls?.[0];

  return (
    <div className="flex min-h-[calc(100vh-var(--header-height))] flex-col">
      <ProgressSteps
        currentStep={1}
        formatted={formatted}
        isWarning={isWarning}
        backHref="/events"
      />
      <EventBanner
        eventTitle={eventTitle}
        eventDate={eventDateStr}
        eventLocation={eventLocation}
      />
      <div className="flex flex-1 flex-col md:flex-row">
        <div className="border-b border-border md:w-[55%] md:border-b-0 md:border-r">
          <VenueMap
            zones={activeZones}
            venueImageUrl={undefined}
            fallbackImageUrl={eventImageUrl}
            selectedZoneId={selectedZoneId}
            onZoneClick={handleZoneClick}
            canvas={canvas}
            availability={availability}
            selectedSeats={selectedSeatIds}
            onSeatToggle={handleSeatToggle}
            maxSeats={maxPerZone}
          />
        </div>

        <div
          ref={panelRef}
          className="flex flex-col md:w-[45%] md:overflow-y-auto"
          style={{ maxHeight: "calc(100vh - var(--header-height) - 6rem)" }}
        >
          <TicketPanel
            zones={activeZones}
            eventDate={event ? fmtIsoDate(event.eventDate) : ""}
            onContinue={handleContinue}
            onChangeDate={() => {}}
            mode={isSeated && canvas ? "seat" : "zone"}
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
