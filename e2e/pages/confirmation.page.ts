import { expect, type Page } from "@playwright/test";

import type { ExecutionProfile } from "../config/profile";
import { JourneyFailure } from "../reporting/failure-classifier";
import type { BookingResponseObserver } from "../flows/booking-responses";

export class ConfirmationPage {
  constructor(private readonly page: Page) {}

  async approveMockAndVerify(
    profile: ExecutionProfile,
    reservationId: string,
    seatLabel: string,
    observer: BookingResponseObserver,
  ) {
    await this.approveMock(profile);
    await this.verifyPaidAndTicket(profile, reservationId, seatLabel, observer);
  }

  async approveMockAndVerifyGa(
    profile: ExecutionProfile,
    reservationId: string,
    ticketTypeName: string,
    quantity: number,
    observer: BookingResponseObserver,
  ) {
    await this.approveMock(profile);
    await this.verifyPaidAndGaTickets(
      profile,
      reservationId,
      ticketTypeName,
      quantity,
      observer,
    );
  }

  private async approveMock(profile: ExecutionProfile) {
    await expect(
      this.page.getByRole("button", { name: "Approve Payment" }),
    ).toBeVisible();
    await this.page.getByRole("button", { name: "Approve Payment" }).click();
    await this.page.waitForURL(
      new RegExp(`/buy/${escapeRegExp(profile.eventSlug)}/confirmation`),
      { timeout: profile.paymentTimeoutMs },
    );
  }

  async verifyPaidAndTicket(
    profile: ExecutionProfile,
    reservationId: string,
    seatLabel: string,
    observer: BookingResponseObserver,
  ) {
    await this.verifyPaidReservation(profile, reservationId, observer);
    await this.verifyPurchasedTicket(profile, reservationId, { seatLabel });
  }

  async verifyPaidAndGaTickets(
    profile: ExecutionProfile,
    reservationId: string,
    ticketTypeName: string,
    quantity: number,
    observer: BookingResponseObserver,
  ) {
    await this.verifyPaidReservation(profile, reservationId, observer);
    await this.verifyPurchasedTicket(profile, reservationId, {
      ticketTypeName,
      quantity,
    });
  }

  private async verifyPaidReservation(
    profile: ExecutionProfile,
    reservationId: string,
    observer: BookingResponseObserver,
  ) {
    await expect(
      this.page.getByText("Payment Confirmed", { exact: true }),
    ).toBeVisible({
      timeout: profile.paymentTimeoutMs,
    });
    await expect(
      this.page.getByText(`Booking ref #${reservationId}`, { exact: true }),
    ).toBeVisible();
    await observer.waitForReservationState(["PAID"], profile.paymentTimeoutMs);
    const snapshot = observer.snapshot();
    if (
      snapshot.reservationId !== reservationId ||
      snapshot.reservationStatus !== "PAID"
    ) {
      throw new JourneyFailure(
        "CONFIRMATION_FAILED",
        "confirmation",
        "The paid confirmation did not match the created reservation.",
      );
    }
  }

  private async verifyPurchasedTicket(
    profile: ExecutionProfile,
    reservationId: string,
    target:
      | { seatLabel: string; ticketTypeName?: never; quantity?: never }
      | { seatLabel?: never; ticketTypeName: string; quantity: number },
  ) {
    await this.page
      .getByRole("button", { name: "View tickets & vouchers" })
      .click();
    await this.page.waitForURL(
      new RegExp(`/ticket-and-voucher\\?r=${escapeRegExp(reservationId)}$`),
      { timeout: profile.navigationTimeoutMs },
    );

    await expect(
      this.page.getByText(`Reservation #${reservationId}`, { exact: true }),
    ).toBeVisible({ timeout: profile.navigationTimeoutMs });
    await expect(
      this.page.getByRole("dialog").getByText("Paid", { exact: true }),
    ).toBeVisible();
    const [row, column] = target.seatLabel?.split("-", 2) ?? [];
    if (row && column) {
      await expect(
        this.page
          .getByRole("dialog")
          .getByText(
            new RegExp(
              `(?:Row\\s+)?${escapeRegExp(row)}(?:,?\\s+Seat\\s+|-)${escapeRegExp(column)}`,
            ),
          ),
      ).toBeVisible();
    }
    if (target.ticketTypeName) {
      const dialog = this.page.getByRole("dialog");
      await expect(
        dialog.getByText(target.ticketTypeName, { exact: true }),
      ).toBeVisible();
      await expect(
        dialog.getByText(`Quantity ${target.quantity}`, { exact: true }),
      ).toBeVisible();
    }

    if (profile.ticketDialogReviewMs > 0) {
      console.log(
        `[E2E demo] Purchased-ticket dialog verified. Keeping it visible for ${profile.ticketDialogReviewMs / 1000} seconds.`,
      );
      await this.page.waitForTimeout(profile.ticketDialogReviewMs);
    }

    await this.page.keyboard.press("Escape");
    await expect(
      this.page.getByRole("tab", { name: "Upcoming" }),
    ).toBeVisible();
    await this.page.getByRole("tab", { name: "Upcoming" }).click();

    if (row && column) {
      const eventTicketGroups = this.page.getByRole("button", {
        name: `View ticket details for ${profile.eventTitle}`,
      });
      await expect(eventTicketGroups.first()).toBeVisible({
        timeout: profile.navigationTimeoutMs,
      });
      const groupCount = await eventTicketGroups.count();
      for (let index = 0; index < groupCount; index += 1) {
        const group = eventTicketGroups
          .nth(index)
          .locator("xpath=ancestor::article");
        await group.getByRole("button", { name: /\d+ tickets?/ }).click();
      }

      const seat = this.page.getByText(`Row ${row}, Seat ${column}`, {
        exact: true,
      });
      await expect(seat).toBeVisible({ timeout: profile.navigationTimeoutMs });
      const purchasedTicket = seat.locator("xpath=ancestor::article");
      await expect(
        purchasedTicket.getByText(profile.eventTitle, {
          exact: true,
        }),
      ).toBeVisible();
      await expect(purchasedTicket.getByText(/\d+ Valid/)).toBeVisible();
    }
    if (target.ticketTypeName) {
      const eventTicketGroups = this.page.getByRole("button", {
        name: `View ticket details for ${profile.eventTitle}`,
      });
      await expect(eventTicketGroups.first()).toBeVisible({
        timeout: profile.navigationTimeoutMs,
      });
      const group = eventTicketGroups
        .first()
        .locator("xpath=ancestor::article");
      await expect(
        group.getByText(
          new RegExp(
            `^${target.quantity}x ${escapeRegExp(target.ticketTypeName)}(?: - |$)`,
          ),
        ),
      ).toBeVisible();
      await group
        .getByRole("button", {
          name: `${target.quantity} tickets`,
          exact: true,
        })
        .click();
      await expect(
        group.getByText(target.ticketTypeName, { exact: true }),
      ).toHaveCount(target.quantity);
      await expect(
        group.getByText(`${target.quantity} Valid`, { exact: true }),
      ).toBeVisible();
    }

    if (profile.ticketReviewMs > 0) {
      console.log(
        `[E2E demo] Purchased ticket verified. Keeping its details visible for ${profile.ticketReviewMs / 1000} seconds.`,
      );
      await this.page.waitForTimeout(profile.ticketReviewMs);
    }
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
