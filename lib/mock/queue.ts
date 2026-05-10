import type { WaitRoomResponse } from "@/schemas/queue";

const MOCK_EVENT_ID = "mock-event-001";

export const mockQueueNotOpen = (): WaitRoomResponse => ({
  status: "NOT_OPEN",
  token: null,
  position: null,
});

export const mockQueueWaiting = (position: number = 42): WaitRoomResponse => ({
  status: "QUEUEING",
  token: null,
  position: { position, size: 200 },
});

export const mockQueueAllowed = (): WaitRoomResponse => ({
  status: "ADMITTED",
  token: "mock-session-token",
  position: null,
});

export const mockQueueExpired = (): WaitRoomResponse => ({
  status: "LOST_SESSION",
  token: null,
  position: null,
});

export { MOCK_EVENT_ID };
