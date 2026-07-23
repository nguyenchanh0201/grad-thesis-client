import { describe, expect, it } from "vitest";

import { EventDetailResultSchema } from "./event-response.schema";

describe("EventDetailResultSchema", () => {
  it("accepts cached buy-page event responses without live availability", () => {
    const result = EventDetailResultSchema.safeParse({
      success: true,
      data: {
        eventCode: "EVT-HARMONY-2026",
        slug: "harmony-night-live",
        title: "Harmony Night Live",
        images: [
          "https://images.unsplash.com/photo-1492684223066-81342ee5ff30",
          "https://images.unsplash.com/photo-1514525253161-7a46d19cd819",
        ],
        dates: [
          {
            label: "Wed, 29 Jul 2026",
            startTime: "2026-07-29T14:13:52.092Z",
            endTime: null,
          },
        ],
        venue: {
          name: "Aurora Hall",
          address: "1 Nguyen Hue",
          city: "Ho Chi Minh City",
        },
        ticketTypes: [
          {
            id: "1",
            zoneId: "1",
            label: "VIP Floor",
            price: 2500000,
            quantity: 12,
            colorKey: "a",
          },
          {
            id: "2",
            zoneId: "2",
            label: "Balcony",
            price: 1200000,
            quantity: 16,
            colorKey: "b",
          },
        ],
        mapType: "seated",
        seatMapImage:
          "https://images.unsplash.com/photo-1505236858219-8359eb29e329",
      },
      message: "Success",
      timestamp: "2026-07-19T14:25:44.596Z",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.data.eventName).toBe("Harmony Night Live");
    expect(result.data.data.ticketTypes?.[0]).toMatchObject({
      id: "1",
      name: "VIP Floor",
      quantity: 12,
      soldCount: undefined,
    });
  });
});
