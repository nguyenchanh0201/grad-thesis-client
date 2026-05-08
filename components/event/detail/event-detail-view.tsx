"use client";

import { useRouter } from "next/navigation";
import { EventDetailHeader } from "./event-detail-header";
import type { Event } from "@/schemas/event";
import type { EventDetail } from "@/schemas/event";

interface EventDetailViewProps {
  event: Event;
  detail: EventDetail;
}

export function EventDetailView({ event, detail }: EventDetailViewProps) {
  const router = useRouter();

  const handleBuy = () => {
    if (event.lobbyStartDate) {
      router.push(`/buy/${event.slug}/queue?eventId=${event.id}`);
    } else {
      router.push(`/buy/${event.slug}/tickets`);
    }
  };

  return <EventDetailHeader event={detail} onCTAClick={handleBuy} />;
}
