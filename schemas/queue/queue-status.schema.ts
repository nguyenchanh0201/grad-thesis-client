import { z } from "zod";

import { BaseResponseSchema } from "@/schemas/api";

export const BackendQueueStatusSchema = z.enum([
  "NOT_OPEN",
  "QUEUEING",
  "ADMITTED",
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

export const QueueStatusDataSchema = z.object({
  status: BackendQueueStatusSchema,
  position: z.number().int().positive().nullable().optional(),
  estimatedWaitSeconds: z.number().int().nonnegative().nullable().optional(),
  purchaseUrl: z.string().nullable().optional(),
  event: QueueEventDataSchema,
});
export type QueueStatusData = z.infer<typeof QueueStatusDataSchema>;

export const QueueStatusResponseSchema = BaseResponseSchema(
  QueueStatusDataSchema,
);
export type QueueStatusResponse = z.infer<typeof QueueStatusResponseSchema>;

export type FrontendQueueStatus =
  | "not_open"
  | "waiting"
  | "ready"
  | "redirecting"
  | "expired";
