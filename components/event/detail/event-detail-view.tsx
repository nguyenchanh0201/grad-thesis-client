"use client";

import { useRouter } from "next/navigation";
import { EventDetailHeader } from "./event-detail-header";
import { setQueueIntent } from "@/lib/booking/queue-intent";
import { clearBuySession } from "@/lib/booking/buy-session";
import { useBookingStore } from "@/lib/store/booking";
import type { Event } from "@/schemas/event";
import type { EventDetail } from "@/schemas/event";

interface EventDetailViewProps {
  event: Event;
  detail: EventDetail;
}

export function EventDetailView({ event, detail }: EventDetailViewProps) {
  const router = useRouter();
  const storeReset = useBookingStore((s) => s.reset);

  const handleBuy = () => {
    clearBuySession(event.slug);
    storeReset();
    setQueueIntent(event.slug);
    router.push(`/buy/${event.slug}/queue?intent=1`);
  };

  return <EventDetailHeader event={detail} onCTAClick={handleBuy} />;
}
