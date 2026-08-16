import { expect, type Locator, type Page } from "@playwright/test";

import type { ExecutionProfile } from "../config/profile";
import { JourneyFailure } from "../reporting/failure-classifier";

export class EventDetailPage {
  constructor(private readonly page: Page) {}

  async verifyAndStartPurchase(profile: ExecutionProfile) {
    await this.page.goto(`/events/${profile.eventSlug}`);
    await expect(
      this.page.getByRole("heading", { name: profile.eventTitle, exact: true }),
    ).toBeVisible();

    const purchaseButton = this.visiblePurchaseButton();
    await expect(purchaseButton).toBeEnabled();
    await purchaseButton.click();

    const activeCheckout = this.page.getByRole("dialog", {
      name: "Active checkout found",
    });
    const queueUrl = new RegExp(
      `/buy/${escapeRegExp(profile.eventSlug)}/queue`,
    );
    await Promise.race([
      this.page.waitForURL(queueUrl, { timeout: profile.navigationTimeoutMs }),
      activeCheckout.waitFor({
        state: "visible",
        timeout: profile.navigationTimeoutMs,
      }),
    ]).catch(() => {});

    if (await activeCheckout.isVisible()) {
      await activeCheckout
        .getByRole("button", { name: "Cancel checkout", exact: true })
        .click();
      await this.page.waitForURL(queueUrl, {
        timeout: profile.navigationTimeoutMs,
      });
    }
    if (!queueUrl.test(this.page.url())) {
      throw new JourneyFailure(
        "EVENT_PRECONDITION_FAILED",
        "event",
        "The event did not enter the customer purchase flow.",
      );
    }
  }

  private visiblePurchaseButton(): Locator {
    return this.page
      .getByRole("button", {
        name: /Buy Tickets|Login required to buy tickets/,
      })
      .filter({ visible: true })
      .first();
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
