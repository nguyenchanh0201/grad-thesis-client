import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/lib/api/api-client";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/notification.service";

vi.mock("@/lib/api/api-client", () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

const readNotification = {
  id: "4",
  userId: "1",
  type: "ORDER_CONFIRMED",
  title: "Order confirmed",
  body: "Your order has been confirmed.",
  isRead: true,
  payload: null,
  action: null,
  createdAt: "2026-05-24T05:30:36.614Z",
};

describe("notification service", () => {
  const patchMock = vi.mocked(apiClient.patch);

  beforeEach(() => {
    patchMock.mockReset();
  });

  it("marks a notification read without sending a JSON null body", async () => {
    patchMock.mockResolvedValue({ success: true, data: readNotification });

    const result = await markNotificationRead("4", "1");

    expect(patchMock).toHaveBeenCalledWith("/notifications/4/read", undefined, {
      params: { userId: "1" },
    });
    expect(patchMock.mock.calls[0][1]).toBeUndefined();
    expect(result.data.isRead).toBe(true);
  });

  it("marks all notifications read without sending a JSON null body", async () => {
    patchMock.mockResolvedValue({ success: true, data: undefined });

    await markAllNotificationsRead("1");

    expect(patchMock).toHaveBeenCalledWith(
      "/notifications/read-all",
      undefined,
      {
        params: { userId: "1" },
      },
    );
    expect(patchMock.mock.calls[0][1]).toBeUndefined();
  });
});
