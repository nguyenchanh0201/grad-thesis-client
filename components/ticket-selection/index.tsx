"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { EventBanner } from "./event-banner";
import { ProgressSteps } from "./progress-steps";
import { TicketPanel } from "./ticket-panel";
import { TimeoutModal } from "./timeout-modal";
import { VenueMap } from "./venue-map";
import { useTicketTimer } from "./use-ticket-timer";
import { clearBuySession, hasBuySession } from "@/lib/buy-session";
import type { SelectedTicket, Zone } from "./types";

const MOCK_ZONES: Zone[] = [
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

const MOCK_EVENT = {
  title: "Ravolution Music Festival 2026",
  date: "Saturday, 13/06/2026 • 18:00",
  location: "Phu Tho Stadium, Ho Chi Minh City",
  // venueImageUrl: actual floor-plan from backend when available
  venueImageUrl: undefined as string | undefined,
  fallbackImageUrl:
    "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80",
};

const MAX_PER_ZONE = 8;

type Props = {
  slug: string;
};

export function TicketSelection({ slug }: Props) {
  const router = useRouter();
  const { formatted, timeRemaining, timedOut, reset } = useTicketTimer();
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [tickets, setTickets] = useState<SelectedTicket[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  const skipGuard = process.env.NEXT_PUBLIC_SKIP_BUY_SESSION === "true";

  // Synchronous check — runs on first render, no extra render cycle needed.
  // Middleware already blocks direct URL access via cookie; this catches
  // edge cases (e.g. cookie present but sessionStorage cleared = stale tab).
  const [authorized] = useState(() => skipGuard || hasBuySession(slug));

  useEffect(() => {
    if (!authorized) router.replace(`/events/${slug}`);
  }, [authorized, slug, router]);

  const isWarning = timeRemaining <= 60;

  const handleZoneClick = useCallback((zoneId: string) => {
    setSelectedZoneId(zoneId);
    const el = document.getElementById(`zone-row-${zoneId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);

  const handleIncrement = useCallback((zoneId: string) => {
    setTickets((prev) => {
      const existing = prev.find((t) => t.zoneId === zoneId);
      const zone = MOCK_ZONES.find((z) => z.id === zoneId);
      if (!zone) return prev;
      if (existing) {
        if (existing.quantity >= MAX_PER_ZONE) return prev;
        if (existing.quantity >= zone.available) return prev;
        return prev.map((t) =>
          t.zoneId === zoneId ? { ...t, quantity: t.quantity + 1 } : t,
        );
      }
      return [...prev, { zoneId, quantity: 1 }];
    });
  }, []);

  const handleDecrement = useCallback((zoneId: string) => {
    setTickets((prev) => {
      const existing = prev.find((t) => t.zoneId === zoneId);
      if (!existing || existing.quantity <= 0) return prev;
      if (existing.quantity === 1)
        return prev.filter((t) => t.zoneId !== zoneId);
      return prev.map((t) =>
        t.zoneId === zoneId ? { ...t, quantity: t.quantity - 1 } : t,
      );
    });
  }, []);

  const handleDeleteTicket = useCallback((zoneId: string) => {
    setTickets((prev) => prev.filter((t) => t.zoneId !== zoneId));
  }, []);

  const handleDeleteAll = useCallback(() => setTickets([]), []);

  const handleContinue = () => {
    // replace so the tickets page is not in history when proceeding to info
    router.replace(`/buy/${slug}/info`);
  };

  const handleTimeoutOk = () => {
    clearBuySession(slug);
    reset();
    setTickets([]);
    setSelectedZoneId(null);
    router.replace(`/events/${slug}`);
  };

  if (!authorized) return null;

  return (
    <div className="flex min-h-[calc(100vh-var(--header-height))] flex-col">
      <ProgressSteps
        currentStep={1}
        formatted={formatted}
        isWarning={isWarning}
        backHref="/events"
      />

      <EventBanner
        eventTitle={MOCK_EVENT.title}
        eventDate={MOCK_EVENT.date}
        eventLocation={MOCK_EVENT.location}
      />

      {/* Two-panel layout */}
      <div className="flex flex-1 flex-col md:flex-row">
        {/* Left: venue map */}
        <div className="border-b border-border md:w-[55%] md:border-b-0 md:border-r">
          <VenueMap
            zones={MOCK_ZONES}
            selectedZoneId={selectedZoneId}
            onZoneClick={handleZoneClick}
            venueImageUrl={MOCK_EVENT.venueImageUrl}
            fallbackImageUrl={MOCK_EVENT.fallbackImageUrl}
          />
        </div>

        {/* Right: ticket panel */}
        <div
          ref={panelRef}
          className="flex flex-col md:w-[45%] md:overflow-y-auto"
          style={{ maxHeight: "calc(100vh - var(--header-height) - 6rem)" }}
        >
          <TicketPanel
            zones={MOCK_ZONES}
            tickets={tickets}
            selectedZoneId={selectedZoneId}
            eventDate={MOCK_EVENT.date}
            onIncrement={handleIncrement}
            onDecrement={handleDecrement}
            onDeleteTicket={handleDeleteTicket}
            onDeleteAll={handleDeleteAll}
            onContinue={handleContinue}
            onChangeDate={() => {}}
            onResetZone={() => setSelectedZoneId(null)}
          />
        </div>
      </div>

      <TimeoutModal open={timedOut} onOk={handleTimeoutOk} />
    </div>
  );
}
