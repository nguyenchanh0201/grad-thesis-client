import { expect, type Page } from "@playwright/test";

import type { ExecutionProfile } from "../config/profile";
import { JourneyFailure } from "../reporting/failure-classifier";
import type { BookingResponseObserver } from "../flows/booking-responses";

export class RecipientInfoPage {
  constructor(private readonly page: Page) {}

  async completeRecipient(
    profile: ExecutionProfile,
    observer: BookingResponseObserver,
  ) {
    await expect(
      this.page.getByRole("heading", {
        name: "Representative ticket recipient information",
      }),
    ).toBeVisible();

    await this.fillStableRecipient(profile);
    if (profile.recipientIdPassport) {
      await this.page
        .getByLabel("ID / Passport")
        .fill(profile.recipientIdPassport);
    }

    const continueButton = this.page.getByRole("button", {
      name: /^Continue/,
    });
    await expect(continueButton).toBeEnabled();

    const recipientResponse = this.page.waitForResponse(
      (response) =>
        response.request().method() === "PATCH" &&
        /\/reservations\/\d+\/recipient$/.test(
          new URL(response.url()).pathname,
        ),
      { timeout: profile.navigationTimeoutMs },
    );
    await continueButton.click();
    const response = await recipientResponse.catch(() => null);
    if (!response) {
      throw new JourneyFailure(
        "RECIPIENT_FAILED",
        "recipient",
        "The recipient form did not send an update request.",
      );
    }
    if (!response.ok()) {
      throw new JourneyFailure(
        "RECIPIENT_FAILED",
        "recipient",
        `The recipient update returned HTTP ${response.status()}.`,
        response.status(),
      );
    }
    await this.page.waitForURL(
      new RegExp(`/buy/${escapeRegExp(profile.eventSlug)}/payment`),
      { timeout: profile.navigationTimeoutMs },
    );

    await expect
      .poll(() => observer.snapshot().recipientUpdated, {
        timeout: profile.navigationTimeoutMs,
      })
      .toBe(true);
    await expect(
      this.page.getByText(profile.recipientFullName, { exact: true }),
    ).toBeVisible();
    await expect(
      this.page.getByText(profile.recipientEmail, { exact: true }),
    ).toBeVisible();
  }

  private async fillStableRecipient(profile: ExecutionProfile) {
    const fullName = this.page.getByLabel("Full Name");
    const email = this.page.getByLabel(/^Email/);
    const phone = this.page.getByLabel("Phone Number");

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await fullName.fill(profile.recipientFullName);
      await email.fill(profile.recipientEmail);
      await phone.fill(profile.recipientPhone);
      await this.selectCountryCode(profile.recipientCountryCode);
      await this.page.waitForTimeout(300);

      const valuesMatch =
        (await fullName.inputValue()) === profile.recipientFullName &&
        (await email.inputValue()) === profile.recipientEmail &&
        (await phone.inputValue()) === profile.recipientPhone &&
        (await this.countryCodeCombobox().textContent())?.includes(
          profile.recipientCountryCode,
        );
      if (valuesMatch) return;
    }

    throw new JourneyFailure(
      "RECIPIENT_FAILED",
      "recipient",
      "The recipient form did not retain the configured values.",
    );
  }

  private async selectCountryCode(countryCode: string) {
    const combobox = this.countryCodeCombobox();
    const currentText = await combobox.textContent();
    if (currentText?.includes(countryCode)) return;
    await combobox.click();
    const search = this.page.getByPlaceholder("Search...");
    await search.fill(countryCode);
    const option = this.page
      .getByRole("option")
      .filter({ hasText: countryCode })
      .first();
    if (!(await option.isVisible().catch(() => false))) {
      throw new JourneyFailure(
        "RECIPIENT_FAILED",
        "recipient",
        "The configured phone country code is unavailable.",
      );
    }
    await option.click();
  }

  private countryCodeCombobox() {
    return this.page
      .getByLabel("Phone Number")
      .locator("..")
      .getByRole("combobox");
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
