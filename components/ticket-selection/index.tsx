"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { clearBuySession, hasBuySession } from "@/lib/booking/buy-session";
import { isAppError } from "@/core/error";
import { useBookingStore } from "@/lib/store/booking";
import { useEventBySlug } from "@/hooks/use-events";
import {
  useCreateGAReservation,
  useCreateSeatedReservation,
} from "@/hooks/use-booking";
import { EventBanner } from "./event-banner";
import { TicketPanel } from "./ticket-panel";
import { SeatMap } from "./seat-map";
import { useBuyProcess } from "@/components/buy-process/buy-process-shell";
import type { SelectedSeat } from "./seat-map";
import { fmtIsoDate } from "@/lib/date";
import {
  getEventBySlug,
  getEventSeatsByEventCode,
} from "@/services/event.service";
import { eventKeys } from "@/hooks/use-events";
import { useSeatAvailabilityStream } from "@/hooks/use-seat-availability-stream";
import { SectionAvailability } from "@/schemas/seat";
import { SeatMapCanvasSchema } from "@/schemas/seat-map";
import type { TicketType } from "@/schemas/ticket-type";
import { toSeatSelectionId } from "@/lib/booking/seat-selection-id";
import { toast } from "sonner";

const MAX_SEATS = 8;
const EMPTY_TICKET_TYPES: TicketType[] = [];
const EMPTY_AVAILABILITY: SectionAvailability[] = [];

type Props = { slug: string };

export function TicketSelection({ slug }: Props) {
  const router = useRouter();
  const { syncToExpiry, exitPurchaseFlow } = useBuyProcess();
  const {
    tickets,
    selectedSeats,
    selectedZoneId,
    waitRoomToken,
    waitRoomSlug,
    reservationSeatIndices,
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
    hydrateFromReservation,
  } = useBookingStore();

  // Hard gate: never render ticket UI until booking store hydration + auth check complete.
  const [isStoreHydrated, setIsStoreHydrated] = useState(() =>
    useBookingStore.persist.hasHydrated(),
  );
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const gaReservationMutation = useCreateGAReservation();
  const seatedReservationMutation = useCreateSeatedReservation();

  useEffect(() => {
    const unsubscribe = useBookingStore.persist.onFinishHydration(() => {
      setIsStoreHydrated(true);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isStoreHydrated) return;

    if (!hasBuySession(slug)) {
      setAuthorized(false);
      exitPurchaseFlow();
      return;
    }

    if (waitRoomSlug && waitRoomSlug !== slug) {
      setAuthorized(false);
      exitPurchaseFlow();
      return;
    }

    setAuthorized(true);
  }, [exitPurchaseFlow, isStoreHydrated, slug, waitRoomSlug]);

  const { data: eventResult } = useEventBySlug(slug);
  const event = eventResult?.data;
  const eventCode = event?.eventCode;
  const isSeated = event?.isSeated ?? false;
  const ticketTypes = event?.ticketTypes ?? EMPTY_TICKET_TYPES;

  // Canvas is embedded in the event response — no separate network call needed.
  const canvas = useMemo(() => {
    if (!isSeated || !event?.seatMap?.canvas) return undefined;
    const result = SeatMapCanvasSchema.safeParse(event.seatMap.canvas);
    if (!result.success) return undefined;
    const hasSections = result.data.elements.some(
      (el) => el.type === "section" || el.type === "zone",
    );
    return hasSections ? result.data : undefined;
  }, [isSeated, event?.seatMap?.canvas]);
  const requiresSeatMap = isSeated;
  const isSeatMapAvailable = !!canvas;

  const { isConnected: isSeatStreamConnected } = useSeatAvailabilityStream(
    eventCode,
    !!eventCode && isSeated,
  );

  const { data: seatsResult } = useQuery({
    queryKey: eventKeys.seats(eventCode ?? ""),
    queryFn: () => getEventSeatsByEventCode(eventCode!),
    enabled: !!eventCode && isSeated,
    refetchInterval: isSeatStreamConnected ? false : 30_000,
    staleTime: isSeatStreamConnected ? Infinity : 15_000,
  });
  const availability: SectionAvailability[] =
    seatsResult?.data ?? EMPTY_AVAILABILITY;

  const maxTicketsPerOrder = event?.maxTicketsPerOrder ?? MAX_SEATS;

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
      if (isSeated) {
        if (!canvas) {
          toast.error("Seat map is unavailable. Please try again later.");
          return;
        }
        const seat = findNextAvailableSeatForTicketType(
          zoneId,
          availability,
          selectedSeats.map((s) =>
            toSeatSelectionId(s.ticketTypeId, s.seatIndex),
          ),
          selectedSeats.map((s) => s.seatIndex),
          ticketTypes,
        );
        if (seat) {
          if (selectedSeats.length >= maxTicketsPerOrder) {
            toast.error(
              `You can select up to ${maxTicketsPerOrder} seats for this event.`,
            );
            return;
          }
          toggleSeat(seat, maxTicketsPerOrder);
        } else {
          toast.error("No more available seats in this section.");
        }
      } else {
        const totalSelected = tickets.reduce(
          (sum, ticket) => sum + ticket.quantity,
          0,
        );
        if (totalSelected >= maxTicketsPerOrder) {
          toast.error(
            `You can select up to ${maxTicketsPerOrder} tickets for this event.`,
          );
          return;
        }
        incrementTicket(zoneId, maxTicketsPerOrder);
      }
      document
        .getElementById(`zone-row-${zoneId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    },
    [
      availability,
      canvas,
      incrementTicket,
      isSeated,
      maxTicketsPerOrder,
      selectedSeats,
      setSelectedZoneId,
      tickets,
      ticketTypes,
      toggleSeat,
    ],
  );

  const handleIncrement = useCallback(
    (ticketTypeId: string) => {
      if (isSeated) {
        if (!canvas) {
          toast.error("Seat map is unavailable. Please try again later.");
          return;
        }
        const seat = findNextAvailableSeatForTicketType(
          ticketTypeId,
          availability,
          selectedSeats.map((s) =>
            toSeatSelectionId(s.ticketTypeId, s.seatIndex),
          ),
          selectedSeats.map((s) => s.seatIndex),
          ticketTypes,
        );
        if (selectedSeats.length >= maxTicketsPerOrder) {
          toast.error(
            `You can select up to ${maxTicketsPerOrder} seats for this event.`,
          );
          return;
        }
        if (seat) {
          toggleSeat(seat, maxTicketsPerOrder);
        } else {
          toast.error("No more available seats for this ticket type.");
        }
        return;
      }
      const totalSelected = tickets.reduce(
        (sum, ticket) => sum + ticket.quantity,
        0,
      );
      if (totalSelected >= maxTicketsPerOrder) {
        toast.error(
          `You can select up to ${maxTicketsPerOrder} tickets for this event.`,
        );
        return;
      }
      incrementTicket(ticketTypeId, maxTicketsPerOrder);
    },
    [
      availability,
      canvas,
      incrementTicket,
      isSeated,
      maxTicketsPerOrder,
      selectedSeats,
      tickets,
      ticketTypes,
      toggleSeat,
    ],
  );

  const handleDecrement = useCallback(
    (ticketTypeId: string) => {
      if (isSeated) {
        if (!canvas) return;
        const seat = [...selectedSeats]
          .reverse()
          .find((s) => s.ticketTypeId === ticketTypeId);
        if (seat) removeSeat(seat.id);
        return;
      }
      decrementTicket(ticketTypeId);
    },
    [canvas, decrementTicket, isSeated, removeSeat, selectedSeats],
  );

  const handleSeatToggle = useCallback(
    (seat: SelectedSeat) => {
      const duplicateSeatIndex = selectedSeats.find(
        (selectedSeat) =>
          selectedSeat.seatIndex === seat.seatIndex &&
          selectedSeat.id !== seat.id,
      );
      if (duplicateSeatIndex) {
        toast.error("This seat is already selected in another section.");
        return;
      }
      toggleSeat(seat, maxTicketsPerOrder);
    },
    [maxTicketsPerOrder, selectedSeats, toggleSeat],
  );

  const handleContinue = async () => {
    if (isCreating) return;
    setIsCreating(true);
    try {
      if (requiresSeatMap && !isSeatMapAvailable) {
        toast.error(
          "Cannot continue because this seated event has no active seat map.",
        );
        return;
      }

      if (isSeated && canvas) {
        if (!eventCode) {
          toast.error(
            "Could not verify seat availability. Please refresh and try again.",
          );
          return;
        }

        const freshSeatsResponse = await getEventSeatsByEventCode(eventCode);
        const latestSeatStatusByKey = freshSeatsResponse.data.reduce(
          (map, section) => {
            for (const seat of section.seats) {
              map.set(
                toSeatSelectionId(section.ticketTypeId, seat.seatIndex),
                seat.status,
              );
            }
            return map;
          },
          new Map<string, "available" | "locked" | "sold">(),
        );

        const staleSeats = selectedSeats.filter((seat) => {
          if (reservationSeatIndices.includes(seat.seatIndex)) return false;
          const status = latestSeatStatusByKey.get(
            toSeatSelectionId(seat.ticketTypeId, seat.seatIndex),
          );
          return status !== "available";
        });

        if (staleSeats.length > 0) {
          for (const seat of staleSeats) {
            removeSeat(seat.id);
          }
          toast.error(
            "Some selected seats are no longer available. We removed them. Please review your selection.",
          );
          return;
        }
      } else {
        const freshEventResponse = await getEventBySlug(slug);
        const latestTicketTypes = freshEventResponse.data.ticketTypes ?? [];
        const staleTickets = tickets.filter((ticket) => {
          const latestTicketType = latestTicketTypes.find(
            (ticketType) => ticketType.id === ticket.ticketTypeId,
          );
          if (!latestTicketType) return true;

          const availableQuantity =
            latestTicketType.quantity != null &&
            latestTicketType.soldCount != null
              ? Math.max(
                  0,
                  latestTicketType.quantity - latestTicketType.soldCount,
                )
              : (latestTicketType.quantity ?? 0);

          return availableQuantity <= 0 || ticket.quantity > availableQuantity;
        });

        if (staleTickets.length > 0) {
          for (const ticket of staleTickets) {
            deleteTicket(ticket.ticketTypeId);
          }
          toast.error(
            "Some selected ticket types are no longer available. We removed them. Please review your selection.",
          );
          return;
        }
      }

      let result;
      if (isSeated && canvas) {
        const validSeatIndices = selectedSeats
          .map((seat) => seat.seatIndex)
          .filter((seatIndex) => Number.isInteger(seatIndex) && seatIndex >= 0);
        const uniqueSeatIndices = new Set(validSeatIndices);

        if (validSeatIndices.length === 0) {
          toast.error("Please select at least one valid seat.");
          return;
        }
        if (uniqueSeatIndices.size !== validSeatIndices.length) {
          toast.error(
            "Two selected seats map to the same index. Please reselect seats.",
          );
          return;
        }

        result = await seatedReservationMutation.mutateAsync({
          eventSlug: slug,
          seatIndices: validSeatIndices,
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
      hydrateFromReservation(result.data);
      const reservationId = result.data.id;
      setReservationId(reservationId);
      if (result.data.expiresAt) {
        syncToExpiry(result.data.expiresAt);
      }
      router.replace(`/buy/${slug}/info`);
    } catch (error) {
      if (isAppError(error) && [401, 403].includes(error.status)) {
        clearBuySession(slug);
        exitPurchaseFlow();
        return;
      }

      if (isAppError(error) && error.status === 409) {
        if (isSeated && canvas && eventCode) {
          const freshSeatsResponse = await getEventSeatsByEventCode(eventCode);
          const latestSeatStatusByKey = freshSeatsResponse.data.reduce(
            (map, section) => {
              for (const seat of section.seats) {
                map.set(
                  toSeatSelectionId(section.ticketTypeId, seat.seatIndex),
                  seat.status,
                );
              }
              return map;
            },
            new Map<string, "available" | "locked" | "sold">(),
          );
          const staleSeats = selectedSeats.filter((seat) => {
            if (reservationSeatIndices.includes(seat.seatIndex)) return false;
            const status = latestSeatStatusByKey.get(
              toSeatSelectionId(seat.ticketTypeId, seat.seatIndex),
            );
            return status !== "available";
          });
          for (const seat of staleSeats) {
            removeSeat(seat.id);
          }
          toast.error(
            "Some selected seats were just taken. We updated your selection. Please continue again.",
          );
        } else {
          const freshEventResponse = await getEventBySlug(slug);
          const latestTicketTypes = freshEventResponse.data.ticketTypes ?? [];
          for (const ticket of tickets) {
            const latestTicketType = latestTicketTypes.find(
              (ticketType) => ticketType.id === ticket.ticketTypeId,
            );
            if (!latestTicketType) {
              deleteTicket(ticket.ticketTypeId);
              continue;
            }
            const availableQuantity =
              latestTicketType.quantity != null &&
              latestTicketType.soldCount != null
                ? Math.max(
                    0,
                    latestTicketType.quantity - latestTicketType.soldCount,
                  )
                : (latestTicketType.quantity ?? 0);
            if (availableQuantity <= 0) {
              deleteTicket(ticket.ticketTypeId);
              continue;
            }
            const excess = ticket.quantity - availableQuantity;
            if (excess > 0) {
              for (let i = 0; i < excess; i += 1) {
                decrementTicket(ticket.ticketTypeId);
              }
            }
          }
          toast.error(
            "Ticket availability changed. We updated your selection. Please continue again.",
          );
        }
        return;
      }

      toast.error("Could not continue to the next step. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  if (!isStoreHydrated || authorized !== true) return null;

  const selectedSeatIds = selectedSeats.map((seat) =>
    toSeatSelectionId(seat.ticketTypeId, seat.seatIndex),
  );

  const eventTitle = event?.eventName ?? "";
  const eventDateStr = event
    ? `${fmtIsoDate(event.eventDate)} • ${event.eventDate.slice(11, 16)}`
    : "";
  const eventLocation = event?.venue
    ? `${event.venue.venueName}, ${event.venue.city}`
    : "";
  const eventImageUrl =
    event?.seatMap?.previewImageUrl ??
    event?.featuredImageUrl ??
    event?.eventImageUrls?.[0];

  return (
    <div className="flex flex-1 flex-col">
      <EventBanner
        eventTitle={eventTitle}
        eventDate={eventDateStr}
        eventLocation={eventLocation}
      />
      <div className="flex flex-1 flex-col md:flex-row">
        <div className="border-b border-border md:w-[55%] md:border-b-0 md:border-r">
          <SeatMap
            fallbackImageUrl={eventImageUrl}
            isSeatedEvent={isSeated}
            onZoneClick={handleZoneClick}
            canvas={canvas}
            availability={availability}
            selectedSeats={selectedSeatIds}
            onSeatToggle={handleSeatToggle}
            maxSeats={maxTicketsPerOrder}
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
            mode={isSeated ? "seat" : "zone"}
            maxTicketsPerOrder={maxTicketsPerOrder}
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
            seatAvailability={availability}
            isLoading={isCreating}
          />
        </div>
      </div>
    </div>
  );
}

function findNextAvailableSeatForTicketType(
  ticketTypeId: string,
  availability: SectionAvailability[],
  selectedSeatIds: string[],
  selectedSeatIndices: number[],
  ticketTypes: TicketType[],
): SelectedSeat | null {
  const selected = new Set(selectedSeatIds);
  const selectedIndices = new Set(selectedSeatIndices);
  const seat = availability
    .find((group) => group.ticketTypeId === ticketTypeId)
    ?.seats.find(
      (candidate) =>
        candidate.status === "available" &&
        !selected.has(toSeatSelectionId(ticketTypeId, candidate.seatIndex)) &&
        !selectedIndices.has(candidate.seatIndex),
    );

  if (!seat) return null;

  const ticketType = ticketTypes.find((tt) => tt.id === ticketTypeId);
  return {
    id: toSeatSelectionId(ticketTypeId, seat.seatIndex),
    label: `${ticketType?.name ?? "Seat"} - ${seat.seatLabel}`,
    ticketTypeId,
    seatIndex: seat.seatIndex,
  };
}
