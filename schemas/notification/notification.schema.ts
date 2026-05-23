import { z } from "zod";
import {
  BigIntIdSchema,
  BaseResponseSchema,
} from "../api";

export const NotificationTypeSchema = z.enum([
  "ORDER_CONFIRMED",
  "EVENT_CANCELLED",
  "EVENT_UPDATED",
  "EVENT_REMINDER",
]);
export type NotificationType = z.infer<typeof NotificationTypeSchema>;

export const NotificationSchema = z.object({
  id: BigIntIdSchema,
  userId: BigIntIdSchema,
  type: NotificationTypeSchema,
  title: z.string(),
  body: z.string().optional(),
  message: z.string().optional(),
  isRead: z.boolean(),
  payload: z.record(z.string(), z.unknown()).optional().nullable(),
  data: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.iso.datetime(),
});
export type Notification = z.infer<typeof NotificationSchema>;

export const NotificationsDataSchema = z.object({
  items: z.array(NotificationSchema),
  total: z.number(),
  unreadCount: z.number(),
});
export type NotificationsData = z.infer<typeof NotificationsDataSchema>;

export const NotificationsResultSchema = BaseResponseSchema(
  NotificationsDataSchema,
);
export type NotificationsResult = z.infer<typeof NotificationsResultSchema>;

export const NotificationResultSchema = BaseResponseSchema(NotificationSchema);
export type NotificationResult = z.infer<typeof NotificationResultSchema>;
