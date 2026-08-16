import { expect, type Page } from "@playwright/test";

import type { ExecutionProfile } from "../config/profile";
import { JourneyFailure } from "../reporting/failure-classifier";

export class LoginPage {
  constructor(private readonly page: Page) {}

  async login(profile: ExecutionProfile) {
    const redirect = `/events/${profile.eventSlug}`;
    await this.page.goto(
      `/auth/login?redirect=${encodeURIComponent(redirect)}`,
    );
    await expect(
      this.page.getByRole("heading", { name: "Log in", exact: true }),
    ).toBeVisible();

    await this.page
      .getByRole("textbox", { name: "Email address" })
      .fill(profile.email);
    await this.page
      .getByLabel("Password", { exact: true })
      .fill(profile.password);
    await this.page.getByRole("button", { name: "Login", exact: true }).click();

    // Next.js renders its route announcer with role="alert". Scope this
    // locator to the form so successful navigation is not mistaken for an
    // authentication error.
    const alert = this.page.locator("form").getByRole("alert").first();
    const destination = new RegExp(
      `/events/${escapeRegExp(profile.eventSlug)}(?:[/?#]|$)`,
    );
    await Promise.race([
      this.page.waitForURL(destination, {
        timeout: profile.navigationTimeoutMs,
      }),
      alert.waitFor({ state: "visible", timeout: profile.navigationTimeoutMs }),
    ]).catch(() => {});

    if (await alert.isVisible()) {
      throw new JourneyFailure(
        "AUTHENTICATION_FAILED",
        "login",
        "The sign-in form displayed an authentication error.",
      );
    }
    if (!destination.test(this.page.url())) {
      throw new JourneyFailure(
        "AUTHENTICATION_FAILED",
        "login",
        "The customer session was not established before the timeout.",
      );
    }
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
