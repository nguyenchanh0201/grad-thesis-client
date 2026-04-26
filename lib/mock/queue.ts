import type { QueueStatusData } from "@/schemas/queue";

const MOCK_EVENT = {
  eventId: "mock-event-001",
  title: "Ravolution Music Festival 2026",
  bannerImageUrl:
    "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=620&q=80",
  eventSlug: "ravolution-music-festival-2026",
};

export const mockQueueNotOpen = (): QueueStatusData => ({
  status: "NOT_OPEN",
  position: null,
  estimatedWaitSeconds: null,
  purchaseUrl: null,
  event: MOCK_EVENT,
});

export const mockQueueWaiting = (position: number = 42): QueueStatusData => ({
  status: "QUEUEING",
  position,
  estimatedWaitSeconds: position * 15,
  purchaseUrl: null,
  event: MOCK_EVENT,
});

export const mockQueueAdmitted = (): QueueStatusData => ({
  status: "ADMITTED",
  position: null,
  estimatedWaitSeconds: null,
  purchaseUrl: "/buy/ravolution-music-festival-2026/tickets",
  event: MOCK_EVENT,
});

export const mockQueueExpired = (): QueueStatusData => ({
  status: "LOST_SESSION",
  position: null,
  estimatedWaitSeconds: null,
  purchaseUrl: null,
  event: MOCK_EVENT,
});
