import type { WaitRoomResponse } from "@/schemas/queue";

const MOCK_EVENT_ID = "mock-event-001";

export const mockQueueNotOpen = (): WaitRoomResponse => ({
  status: "NOT_OPEN",
  sessionToken: null,
  position: null,
  estimatedWait: null,
});

export const mockQueueWaiting = (position: number = 42): WaitRoomResponse => ({
  status: "QUEUED",
  sessionToken: null,
  position,
  estimatedWait: position * 15,
});

export const mockQueueAllowed = (): WaitRoomResponse => ({
  status: "ALLOWED",
  sessionToken: "mock-session-token",
  position: null,
  estimatedWait: null,
});

export const mockQueueExpired = (): WaitRoomResponse => ({
  status: "LOST_SESSION",
  sessionToken: null,
  position: null,
  estimatedWait: null,
});

export { MOCK_EVENT_ID };
