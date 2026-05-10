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
    router.push(`/buy/${event.slug}/queue?eventId=${event.id}`);
  };

  return <EventDetailHeader event={detail} onCTAClick={handleBuy} />;
}
