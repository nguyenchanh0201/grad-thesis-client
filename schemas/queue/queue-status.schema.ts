import { z } from "zod";

import { BaseResponseSchema } from "@/schemas/api";

export const BackendQueueStatusSchema = z.enum([
  "NOT_OPEN",
  "QUEUED",
  "ALLOWED",
  "LOST_SESSION",
]);
export type BackendQueueStatus = z.infer<typeof BackendQueueStatusSchema>;

export const QueueEventDataSchema = z.object({
  eventId: z.string(),
  title: z.string(),
  bannerImageUrl: z.string().nullable().optional(),
  eventSlug: z.string().nullable().optional(),
});
export type QueueEventData = z.infer<typeof QueueEventDataSchema>;

export const WaitRoomResponseSchema = z.object({
  status: BackendQueueStatusSchema,
  sessionToken: z.string().nullable().optional(),
  position: z.number().int().positive().nullable().optional(),
  estimatedWait: z.number().int().nonnegative().nullable().optional(),
});
export type WaitRoomResponse = z.infer<typeof WaitRoomResponseSchema>;

export const WaitRoomResultSchema = BaseResponseSchema(WaitRoomResponseSchema);
export type WaitRoomResult = z.infer<typeof WaitRoomResultSchema>;

export const HeartbeatResponseSchema = z.object({
  success: z.boolean(),
  newToken: z.string().nullable().optional(),
});
export type HeartbeatResponse = z.infer<typeof HeartbeatResponseSchema>;

export const HeartbeatResultSchema = BaseResponseSchema(
  HeartbeatResponseSchema,
);
export type HeartbeatResult = z.infer<typeof HeartbeatResultSchema>;

export type FrontendQueueStatus =
  | "not_open"
  | "waiting"
  | "ready"
  | "redirecting"
  | "expired";
