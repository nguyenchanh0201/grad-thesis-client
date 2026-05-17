import { z } from "zod";

export const BackendQueueStatusSchema = z.enum([
  "NOT_OPEN",
  "QUEUEING",
  "ADMITTED",
  "LOST_SESSION",
]);
export type BackendQueueStatus = z.infer<typeof BackendQueueStatusSchema>;

export const WaitRoomResponseSchema = z.object({
  status: BackendQueueStatusSchema,
  token: z.string().nullable().optional(),
  sessionExpiresAt: z.iso.datetime().optional(),
  position: z
    .object({
      position: z.number().int().positive(),
      size: z.number().int().nonnegative(),
    })
    .nullable()
    .optional(),
});
export type WaitRoomResponse = z.infer<typeof WaitRoomResponseSchema>;

export const HeartbeatResponseSchema = z.object({
  success: z.boolean(),
  activeCount: z.number().int().nonnegative(),
  sessionExpiresAt: z.iso.datetime().optional(),
});
export type HeartbeatResponse = z.infer<typeof HeartbeatResponseSchema>;

export type FrontendQueueStatus =
  | "not_open"
  | "waiting"
  | "ready"
  | "redirecting"
  | "expired";
