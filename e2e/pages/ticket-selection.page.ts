import { expect, type Locator, type Page } from "@playwright/test";

import type { ExecutionProfile } from "../config/profile";
import { JourneyFailure } from "../reporting/failure-classifier";
import type { BookingResponseObserver } from "../flows/booking-responses";

export type ReservationAttemptResult = {
  httpStatus: number;
  reservationId: string | null;
  result: "CREATED" | "CONFLICT" | "FAILED";
  visibleResult: "NAVIGATED_TO_INFO" | "SEAT_CONFLICT" | "FAILURE";
};

export class TicketSelectionPage {
  constructor(private readonly page: Page) {}

  async selectConfiguredSeat(profile: ExecutionProfile) {
    await expect(this.page).toHaveURL(
      new RegExp(`/buy/${escapeRegExp(profile.eventSlug)}/tickets`),
    );
    let selectedSeat: Locator | null = null;
    if (profile.seatSelectionMode === "first-available") {
      selectedSeat = await this.findFirstAvailableSeat(
        profile.navigationTimeoutMs,
      );
    } else {
      const preferredSeat = this.page.getByRole("gridcell", {
        name: `Seat ${profile.seatLabel}`,
        exact: true,
      });

      if (!(await preferredSeat.isVisible().catch(() => false))) {
        await this.openSectionContaining(
          preferredSeat,
          profile.navigationTimeoutMs,
        );
      }
      const preferredIsVisible = await preferredSeat
        .isVisible()
        .catch(() => false);
      const preferredIsAvailable =
        preferredIsVisible &&
        (await preferredSeat.getAttribute("aria-disabled")) !== "true";

      selectedSeat = preferredSeat;
      if (
        !preferredIsAvailable &&
        profile.seatSelectionMode === "preferred-or-first-available"
      ) {
        selectedSeat = await this.findFirstAvailableSeat(
          profile.navigationTimeoutMs,
        );
      }
    }

    if (!selectedSeat || !(await selectedSeat.isVisible().catch(() => false))) {
      throw new JourneyFailure(
        "INVENTORY_UNAVAILABLE",
        "seat",
        profile.seatSelectionMode !== "exact"
          ? "No available seat exists in the rendered seat map."
          : "The configured seat does not exist in an available seat section.",
      );
    }
    if ((await selectedSeat.getAttribute("aria-disabled")) === "true") {
      throw new JourneyFailure(
        "INVENTORY_UNAVAILABLE",
        "seat",
        profile.seatSelectionMode !== "exact"
          ? "No available seat exists in the rendered seat map."
          : "The configured seat is not available.",
      );
    }

    const selectedLabel = await this.readSeatLabel(selectedSeat);
    await selectedSeat.click();
    await expect(selectedSeat).toHaveAttribute("aria-selected", "true");
    const summary = this.page
      .getByRole("button", { name: /1 seat selected/i })
      .first();
    await expect(summary).toBeVisible();
    if ((await summary.getAttribute("aria-expanded")) !== "true") {
      await summary.click();
    }
    await expect(
      this.page.getByText(selectedLabel, { exact: false }),
    ).toBeVisible();
    return selectedLabel;
  }

  async createReservation(
    profile: ExecutionProfile,
    observer: BookingResponseObserver,
  ) {
    const attempt = await this.attemptReservation(profile);
    const reservationId =
      attempt.reservationId ??
      (attempt.result === "CREATED"
        ? await observer.waitForReservationId(profile.navigationTimeoutMs)
        : null);
    if (!reservationId) {
      throw new JourneyFailure(
        "RESERVATION_FAILED",
        "reservation",
        attempt.result === "CONFLICT"
          ? "The configured seat became unavailable during reservation."
          : `The reservation attempt returned HTTP ${attempt.httpStatus} without an identifier.`,
        attempt.httpStatus,
      );
    }
    return reservationId;
  }

  async triggerReservationAttempt() {
    const continueButton = this.page
      .getByRole("button", { name: /VND - Continue$/i })
      .first();
    await expect(continueButton).toBeEnabled();
    await continueButton.click();
  }

  async attemptReservation(
    profile: ExecutionProfile,
    resultTimeoutMs = profile.navigationTimeoutMs,
  ): Promise<ReservationAttemptResult> {
    const responsePromise = this.page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        new URL(response.url()).pathname.endsWith("/reservations/seated"),
      { timeout: resultTimeoutMs },
    );
    await this.triggerReservationAttempt();
    const response = await responsePromise;
    const httpStatus = response.status();

    if (httpStatus >= 200 && httpStatus < 300) {
      const payload = (await response.json().catch(() => null)) as Record<
        string,
        unknown
      > | null;
      const rawId = payload?.reservationId;
      const reservationId =
        typeof rawId === "string" || typeof rawId === "number"
          ? String(rawId)
          : null;
      await this.page.waitForURL(
        new RegExp(`/buy/${escapeRegExp(profile.eventSlug)}/info`),
        { timeout: profile.navigationTimeoutMs },
      );
      return {
        httpStatus,
        reservationId,
        result: "CREATED",
        visibleResult: "NAVIGATED_TO_INFO",
      };
    }

    if (httpStatus === 409) {
      const conflict = this.page.getByText(
        "Some selected seats were just taken. We updated your selection. Please continue again.",
        { exact: true },
      );
      await expect(conflict).toBeVisible({ timeout: resultTimeoutMs });
      await conflict.hover().catch(() => undefined);
      await expect(this.page).toHaveURL(
        new RegExp(`/buy/${escapeRegExp(profile.eventSlug)}/tickets`),
      );
      const seat = this.page.getByRole("gridcell", {
        name: `Seat ${profile.seatLabel}`,
        exact: true,
      });
      if (await seat.isVisible().catch(() => false)) {
        await expect(seat).not.toHaveAttribute("aria-selected", "true");
      }
      return {
        httpStatus,
        reservationId: null,
        result: "CONFLICT",
        visibleResult: "SEAT_CONFLICT",
      };
    }

    return {
      httpStatus,
      reservationId: null,
      result: "FAILED",
      visibleResult: "FAILURE",
    };
  }

  private async openSectionContaining(
    seat: Locator,
    navigationTimeoutMs: number,
  ) {
    const overview = this.page.getByLabel("Seat map overview");
    const sections = overview.getByRole("button");
    await overview.waitFor({
      state: "visible",
      timeout: navigationTimeoutMs,
    });
    await sections.first().waitFor({
      state: "visible",
      timeout: navigationTimeoutMs,
    });
    const count = await sections.count();
    for (let index = 0; index < count; index += 1) {
      const section = sections.nth(index);
      if (!(await section.isEnabled().catch(() => false))) continue;
      await section.click();
      const sectionGrid = this.page.getByRole("grid");
      const rendered = await sectionGrid
        .waitFor({
          state: "visible",
          timeout: Math.min(navigationTimeoutMs, 10_000),
        })
        .then(() => true)
        .catch(() => false);
      if (rendered && (await seat.isVisible().catch(() => false))) {
        return;
      }
      const back = this.page.getByRole("button", { name: "Back to overview" });
      if (await back.isVisible().catch(() => false)) await back.click();
    }
  }

  private async findFirstAvailableSeat(
    navigationTimeoutMs: number,
  ): Promise<Locator | null> {
    const currentSectionSeat = await this.firstVisibleAvailableSeat();
    if (currentSectionSeat) return currentSectionSeat;

    const back = this.page.getByRole("button", { name: "Back to overview" });
    if (await back.isVisible().catch(() => false)) await back.click();

    const overview = this.page.getByLabel("Seat map overview");
    const sections = overview.getByRole("button");
    await overview.waitFor({ state: "visible", timeout: navigationTimeoutMs });
    await sections.first().waitFor({
      state: "visible",
      timeout: navigationTimeoutMs,
    });

    const count = await sections.count();
    for (let index = 0; index < count; index += 1) {
      const section = sections.nth(index);
      if (!(await section.isEnabled().catch(() => false))) continue;
      await section.click();
      const rendered = await this.page
        .getByRole("grid")
        .waitFor({
          state: "visible",
          timeout: Math.min(navigationTimeoutMs, 10_000),
        })
        .then(() => true)
        .catch(() => false);
      if (rendered) {
        const availableSeat = await this.firstVisibleAvailableSeat();
        if (availableSeat) return availableSeat;
      }
      if (await back.isVisible().catch(() => false)) await back.click();
    }
    return null;
  }

  private async firstVisibleAvailableSeat(): Promise<Locator | null> {
    const seats = this.page.locator('[role="gridcell"][aria-disabled="false"]');
    const count = await seats.count();
    for (let index = 0; index < count; index += 1) {
      const seat = seats.nth(index);
      if (await seat.isVisible().catch(() => false)) return seat;
    }
    return null;
  }

  private async readSeatLabel(seat: Locator): Promise<string> {
    const accessibleLabel = (await seat.getAttribute("aria-label"))?.trim();
    const label = accessibleLabel?.replace(/^Seat\s+/i, "").trim();
    if (label) return label;

    throw new JourneyFailure(
      "INVENTORY_UNAVAILABLE",
      "seat",
      "The selected available seat did not expose a stable accessible label.",
    );
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
