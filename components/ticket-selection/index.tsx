"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { clearBuySession, hasBuySession } from "@/lib/booking/buy-session";
import { useBookingStore } from "@/lib/store/booking";
import { useEventBySlug } from "@/hooks/use-events";
import {
  useCreateGAReservation,
  useCreateSeatedReservation,
} from "@/hooks/use-booking";
import { EventBanner } from "./event-banner";
import { ProgressSteps } from "./progress-steps";
import { TicketPanel } from "./ticket-panel";
import { TimeoutModal } from "./timeout-modal";
import { SeatMap } from "./seat-map";
import { useTicketTimer } from "../../hooks/use-ticket-timer";
import type { SelectedSeat } from "./seat-map";
import { fmtIsoDate } from "@/lib/date";
import { getEventSeats } from "@/services/event.service";
import { SectionAvailability } from "@/schemas/seat";
import { SeatMapCanvasSchema } from "@/schemas/seat-map";

const MAX_SEATS = 8;

type Props = { slug: string };

export function TicketSelection({ slug }: Props) {
  const router = useRouter();
  const {
    formatted,
    timeRemaining,
    timedOut,
    reset: timerReset,
    syncToExpiry,
  } = useTicketTimer();
  const {
    tickets,
    selectedSeats,
    selectedZoneId,
    waitRoomToken,
    initStep1,
    setSelectedZoneId,
    setReservationId,
    incrementTicket,
    decrementTicket,
    deleteTicket,
    clearTickets,
    toggleSeat,
    removeSeat,
    clearSeats,
    reset: storeReset,
  } = useBookingStore();

  // Initialize to true so server and client render the same initial tree.
  // hasBuySession reads sessionStorage (client-only) — checked in useEffect.
  const [authorized, setAuthorized] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const gaReservationMutation = useCreateGAReservation();
  const seatedReservationMutation = useCreateSeatedReservation();

  useEffect(() => {
    if (!hasBuySession(slug)) {
      setAuthorized(false);
      storeReset();
      router.replace(`/events/${slug}`);
    }
  }, [slug, router, storeReset]);

  const { data: eventResult } = useEventBySlug(slug);
  const event = eventResult?.data;
  const eventId = event?.id;
  const isSeated = event?.isSeated ?? false;

  // Canvas is embedded in the event response — no separate network call needed.
  // Only use canvas mode when the canvas has at least one committed section or zone
  // (i.e. elements with ticketTypeId). A stage-only or label-only canvas means the
  // organizer hasn't committed sections yet — fall back to image mode.
  const canvas = useMemo(() => {
    if (!isSeated || !event?.seatMap?.canvas) return undefined;
    const result = SeatMapCanvasSchema.safeParse(event.seatMap.canvas);
    if (!result.success) return undefined;
    const hasSections = result.data.elements.some(
      (el) => el.type === "section" || el.type === "zone",
    );
    return hasSections ? result.data : undefined;
  }, [isSeated, event?.seatMap?.canvas]);

  // Poll seat availability every 10s
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
  const ticketTypes = event?.ticketTypes ?? [];

  useEffect(() => {
    if (!event) return;
    initStep1({
      slug,
      ticketTypes,
      mapType: isSeated ? "seated" : "zone",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, isSeated, initStep1, event]);

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
    (ticketTypeId: string) => incrementTicket(ticketTypeId, maxPerZone),
    [incrementTicket, maxPerZone],
  );

  const handleDecrement = useCallback(
    (ticketTypeId: string) => decrementTicket(ticketTypeId),
    [decrementTicket],
  );

  const handleSeatToggle = useCallback(
    (seat: SelectedSeat) => toggleSeat(seat, MAX_SEATS),
    [toggleSeat],
  );

  const handleContinue = async () => {
    if (isCreating) return;
    setIsCreating(true);
    try {
      let result;
      if (isSeated && canvas) {
        result = await seatedReservationMutation.mutateAsync({
          eventSlug: slug,
          seatIndices: selectedSeats.map((s) => s.seatIndex),
          waitRoomToken: waitRoomToken ?? undefined,
        });
      } else {
        result = await gaReservationMutation.mutateAsync({
          eventSlug: slug,
          items: tickets.map((t) => ({
            ticketTypeId: t.ticketTypeId,
            quantity: t.quantity,
          })),
          waitRoomToken: waitRoomToken ?? undefined,
        });
      }
      const reservationId = result.data.id;
      setReservationId(reservationId);
      if (result.data.expiresAt) {
        syncToExpiry(result.data.expiresAt);
      }
      router.replace(`/buy/${slug}/info`);
    } catch {
      clearBuySession(slug);
      storeReset();
      router.replace(`/events/${slug}`);
    } finally {
      setIsCreating(false);
    }
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
          <SeatMap
            ticketTypes={ticketTypes}
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
          className="flex flex-col md:w-[45%] md:overflow-y-auto"
          style={{ maxHeight: "calc(100vh - var(--header-height) - 6rem)" }}
        >
          <TicketPanel
            ticketTypes={ticketTypes}
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
            isLoading={isCreating}
          />
        </div>
      </div>

      <TimeoutModal open={timedOut} onOk={handleTimeoutOk} />
    </div>
  );
}
