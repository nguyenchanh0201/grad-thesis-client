"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/notification.service";
import { PAGINATION } from "@/core/constants";

const NOTIFICATION_POLL_MS = 60_000;

export const notificationKeys = {
  all: ["notifications"] as const,
  list: (userId: string, page: number) =>
    [...notificationKeys.all, userId, page] as const,
};

export function useNotifications(
  userId: string | undefined,
  page = PAGINATION.DEFAULT_PAGE,
  limit: number = PAGINATION.DEFAULT_LIMIT,
) {
  return useQuery({
    queryKey: [...notificationKeys.list(userId ?? "", page), limit],
    queryFn: () => getNotifications({ userId: userId!, page, limit }),
    enabled: !!userId,
    refetchInterval: NOTIFICATION_POLL_MS,
    staleTime: NOTIFICATION_POLL_MS,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) =>
      markNotificationRead(id, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => markAllNotificationsRead(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}
