import { PAGINATION } from "@/core/constants";
import { apiClient } from "@/lib/api/api-client";
import { parseOrThrow } from "@/lib/api/api-utils";
import {
  NotificationSchema,
  NotificationResult,
  NotificationResultSchema,
  NotificationsDataSchema,
  NotificationsResult,
  NotificationsResultSchema,
} from "@/schemas/notification";

const NotificationsApiContractSchema = NotificationsResultSchema.or(
  NotificationsDataSchema.transform((data) => ({ success: true, data })),
);

const NotificationApiContractSchema = NotificationResultSchema.or(
  NotificationSchema.transform((data) => ({ success: true, data })),
);

export const getNotifications = async ({
  userId,
  page = PAGINATION.DEFAULT_PAGE,
  limit = PAGINATION.DEFAULT_LIMIT,
}: {
  userId: string;
  page?: number;
  limit?: number;
}): Promise<NotificationsResult> => {
  const response = await apiClient.get("/notifications", {
    params: { userId, page, limit },
  });
  return parseOrThrow(NotificationsApiContractSchema, response);
};

export const markNotificationRead = async (
  id: string,
  userId: string,
): Promise<NotificationResult> => {
  const response = await apiClient.patch(`/notifications/${id}/read`, null, {
    params: { userId },
  });
  return parseOrThrow(NotificationApiContractSchema, response);
};

export const markAllNotificationsRead = async (
  userId: string,
): Promise<void> => {
  await apiClient.patch("/notifications/read-all", null, {
    params: { userId },
  });
};
