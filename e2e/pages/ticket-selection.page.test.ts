import type { Page } from "@playwright/test";
import { describe, expect, it, vi } from "vitest";

import type { ExecutionProfile } from "../config/profile";
import { TicketSelectionPage } from "./ticket-selection.page";

vi.mock("@playwright/test", () => ({
  expect: vi.fn(() => ({
    toHaveURL: vi.fn().mockResolvedValue(undefined),
    toHaveAttribute: vi.fn().mockResolvedValue(undefined),
    toBeVisible: vi.fn().mockResolvedValue(undefined),
    toBeEnabled: vi.fn().mockResolvedValue(undefined),
    not: {
      toHaveAttribute: vi.fn().mockResolvedValue(undefined),
    },
  })),
}));

const profile = {
  eventSlug: "harmony-night-live",
  seatLabel: "A-3",
  seatSelectionMode: "exact",
  navigationTimeoutMs: 30_000,
} as ExecutionProfile;

describe("TicketSelectionPage", () => {
  it("keeps an already expanded selected-seat summary open", async () => {
    const seat = {
      isVisible: vi.fn().mockResolvedValue(true),
      getAttribute: vi.fn(async (name: string) => {
        if (name === "aria-disabled") return "false";
        if (name === "aria-label") return "Seat A-3";
        return "true";
      }),
      click: vi.fn().mockResolvedValue(undefined),
    };
    const summary = {
      first: vi.fn(),
      getAttribute: vi.fn().mockResolvedValue("true"),
      click: vi.fn().mockResolvedValue(undefined),
    };
    summary.first.mockReturnValue(summary);

    const page = {
      getByRole: vi.fn((role: string) => {
        if (role === "gridcell") return seat;
        if (role === "button") return summary;
        throw new Error(`Unexpected role: ${role}`);
      }),
      getByText: vi.fn().mockReturnValue({}),
    };

    const selected = await new TicketSelectionPage(
      page as unknown as Page,
    ).selectConfiguredSeat(profile);

    expect(selected).toBe("A-3");
    expect(seat.click).toHaveBeenCalledOnce();
    expect(summary.getAttribute).toHaveBeenCalledWith("aria-expanded");
    expect(summary.click).not.toHaveBeenCalled();
    expect(page.getByText).toHaveBeenCalledWith("A-3", { exact: false });
  });

  it("falls back to the first visible available seat when enabled", async () => {
    const preferredSeat = {
      isVisible: vi.fn().mockResolvedValue(true),
      getAttribute: vi.fn().mockResolvedValue("true"),
    };
    const availableSeat = {
      isVisible: vi.fn().mockResolvedValue(true),
      getAttribute: vi.fn(async (name: string) => {
        if (name === "aria-disabled") return "false";
        if (name === "aria-label") return "Seat A-5";
        return "true";
      }),
      click: vi.fn().mockResolvedValue(undefined),
    };
    const availableSeats = {
      count: vi.fn().mockResolvedValue(1),
      nth: vi.fn().mockReturnValue(availableSeat),
    };
    const summary = {
      first: vi.fn(),
      getAttribute: vi.fn().mockResolvedValue("true"),
      click: vi.fn().mockResolvedValue(undefined),
    };
    summary.first.mockReturnValue(summary);

    const page = {
      getByRole: vi.fn((role: string) => {
        if (role === "gridcell") return preferredSeat;
        if (role === "button") return summary;
        throw new Error(`Unexpected role: ${role}`);
      }),
      getByText: vi.fn().mockReturnValue({}),
      locator: vi.fn().mockReturnValue(availableSeats),
    };

    const selected = await new TicketSelectionPage(
      page as unknown as Page,
    ).selectConfiguredSeat({
      ...profile,
      seatSelectionMode: "preferred-or-first-available",
    });

    expect(selected).toBe("A-5");
    expect(availableSeat.click).toHaveBeenCalledOnce();
    expect(page.getByText).toHaveBeenCalledWith("A-5", { exact: false });
  });

  it("selects the first available seat without resolving a preferred seat", async () => {
    const availableSeat = {
      isVisible: vi.fn().mockResolvedValue(true),
      getAttribute: vi.fn(async (name: string) => {
        if (name === "aria-disabled") return "false";
        if (name === "aria-label") return "Seat B-2";
        return "true";
      }),
      click: vi.fn().mockResolvedValue(undefined),
    };
    const availableSeats = {
      count: vi.fn().mockResolvedValue(1),
      nth: vi.fn().mockReturnValue(availableSeat),
    };
    const summary = {
      first: vi.fn(),
      getAttribute: vi.fn().mockResolvedValue("true"),
      click: vi.fn().mockResolvedValue(undefined),
    };
    summary.first.mockReturnValue(summary);

    const page = {
      getByRole: vi.fn((role: string) => {
        if (role === "button") return summary;
        throw new Error(`Unexpected role: ${role}`);
      }),
      getByText: vi.fn().mockReturnValue({}),
      locator: vi.fn().mockReturnValue(availableSeats),
    };

    const selected = await new TicketSelectionPage(
      page as unknown as Page,
    ).selectConfiguredSeat({
      ...profile,
      seatLabel: "AUTO",
      seatSelectionMode: "first-available",
    });

    expect(selected).toBe("B-2");
    expect(availableSeat.click).toHaveBeenCalledOnce();
    expect(page.getByRole).not.toHaveBeenCalledWith(
      "gridcell",
      expect.anything(),
    );
  });

  it("captures the successful create response before winner navigation", async () => {
    const button = {
      first: vi.fn(),
      click: vi.fn().mockResolvedValue(undefined),
    };
    button.first.mockReturnValue(button);
    const page = {
      getByRole: vi.fn().mockReturnValue(button),
      waitForResponse: vi.fn().mockResolvedValue({
        status: () => 201,
        json: vi.fn().mockResolvedValue({ status: true, reservationId: "44" }),
      }),
      waitForURL: vi.fn().mockResolvedValue(undefined),
    };

    const result = await new TicketSelectionPage(
      page as unknown as Page,
    ).attemptReservation(profile);

    expect(result).toEqual({
      httpStatus: 201,
      reservationId: "44",
      result: "CREATED",
      visibleResult: "NAVIGATED_TO_INFO",
    });
    expect(button.click).toHaveBeenCalledOnce();
  });

  it("classifies a 409 as the expected loser without selecting a fallback", async () => {
    const button = {
      first: vi.fn(),
      click: vi.fn().mockResolvedValue(undefined),
    };
    button.first.mockReturnValue(button);
    const conflict = { hover: vi.fn().mockResolvedValue(undefined) };
    const seat = { isVisible: vi.fn().mockResolvedValue(true) };
    const page = {
      getByRole: vi.fn((role: string) => (role === "gridcell" ? seat : button)),
      getByText: vi.fn().mockReturnValue(conflict),
      waitForResponse: vi.fn().mockResolvedValue({ status: () => 409 }),
    };

    const result = await new TicketSelectionPage(
      page as unknown as Page,
    ).attemptReservation(profile);

    expect(result).toMatchObject({
      httpStatus: 409,
      reservationId: null,
      result: "CONFLICT",
      visibleResult: "SEAT_CONFLICT",
    });
    expect(conflict.hover).toHaveBeenCalledOnce();
    expect(page.getByRole).toHaveBeenCalledWith("gridcell", {
      name: "Seat A-3",
      exact: true,
    });
  });
});
