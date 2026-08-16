import { expect, type Page } from "@playwright/test";

import type { ExecutionProfile } from "../config/profile";
import { JourneyFailure } from "../reporting/failure-classifier";

type QueueObservation =
  | "waiting"
  | "ready"
  | "admitted"
  | "active-checkout"
  | "terminal";

export class QueuePage {
  constructor(private readonly page: Page) {}

  async waitForAdmission(profile: ExecutionProfile) {
    let observedQueue = false;
    const observe = async (): Promise<QueueObservation> => {
      if (this.page.url().includes(`/buy/${profile.eventSlug}/tickets`)) {
        return "admitted";
      }
      const activeCheckout = this.page.getByRole("dialog", {
        name: "Active checkout found",
      });
      if (await activeCheckout.isVisible().catch(() => false)) {
        return "active-checkout";
      }
      const status = this.page.getByTestId("queue-status");
      const value = await status.getAttribute("data-status").catch(() => null);
      if (value === "waiting") {
        observedQueue = true;
        return "waiting";
      }
      if (value === "ready" || value === "redirecting") return "ready";
      if (value === "expired" || value === "not_open") return "terminal";
      return "waiting";
    };

    try {
      await expect
        .poll(observe, {
          timeout: profile.waitroomTimeoutMs,
          intervals: [250, 500, 1_000, 2_000],
          message: "wait for waiting-room admission or a terminal state",
        })
        .not.toBe("waiting");
    } catch {
      throw new JourneyFailure(
        "WAITROOM_TIMEOUT",
        "waitroom",
        "Waiting-room admission exceeded the configured timeout.",
      );
    }

    const state = await observe();
    if (state === "active-checkout") {
      throw new JourneyFailure(
        "ACTIVE_CHECKOUT_PRECONDITION",
        "waitroom",
        "An active checkout dialog blocked queue admission.",
      );
    }
    if (state === "terminal") {
      throw new JourneyFailure(
        "WAITROOM_TERMINAL",
        "waitroom",
        "The waiting room reported that admission is unavailable.",
      );
    }
    if (state === "ready") {
      await this.page
        .getByRole("button", {
          name: "Redirect to ticket purchase page now",
        })
        .click();
    }

    await this.page.waitForURL(
      new RegExp(`/buy/${escapeRegExp(profile.eventSlug)}/tickets`),
      { timeout: profile.navigationTimeoutMs },
    );
    return { queued: observedQueue };
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
