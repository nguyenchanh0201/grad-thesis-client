import { expect, type Locator, type Page } from "@playwright/test";

import type { ExecutionProfile } from "../config/profile";
import { JourneyFailure } from "../reporting/failure-classifier";
import type { BookingResponseObserver } from "../flows/booking-responses";

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
    const continueButton = this.page
      .getByRole("button", { name: /VND - Continue$/i })
      .first();
    await expect(continueButton).toBeEnabled();
    await continueButton.click();

    const [reservationId] = await Promise.all([
      observer.waitForReservationId(profile.navigationTimeoutMs),
      this.page.waitForURL(
        new RegExp(`/buy/${escapeRegExp(profile.eventSlug)}/info`),
        { timeout: profile.navigationTimeoutMs },
      ),
    ]);
    if (!reservationId) {
      throw new JourneyFailure(
        "RESERVATION_FAILED",
        "reservation",
        "The reservation response did not contain an identifier.",
      );
    }
    return reservationId;
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
