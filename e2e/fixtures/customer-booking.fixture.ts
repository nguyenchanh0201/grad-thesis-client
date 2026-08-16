import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

import { test as base, type Page } from "@playwright/test";

import {
  loadExecutionProfile,
  profileSensitiveValues,
  type ExecutionProfile,
} from "../config/profile";
import { BookingResponseObserver } from "../flows/booking-responses";
import { CustomerBookingFlow } from "../flows/customer-booking.flow";
import { ConfirmationPage } from "../pages/confirmation.page";
import { EventDetailPage } from "../pages/event-detail.page";
import { LoginPage } from "../pages/login.page";
import { PaymentPage } from "../pages/payment.page";
import { QueuePage } from "../pages/queue.page";
import { RecipientInfoPage } from "../pages/recipient-info.page";
import { TicketSelectionPage } from "../pages/ticket-selection.page";
import { writeEvidenceBundle } from "../reporting/evidence";
import { classifyFailure } from "../reporting/failure-classifier";
import {
  createJourneyRun,
  transitionJourney,
  type JourneyRun,
} from "../reporting/types";
import { generateRunId } from "../scripts/run-customer-booking";

export type CustomerBookingPages = {
  login: LoginPage;
  event: EventDetailPage;
  queue: QueuePage;
  tickets: TicketSelectionPage;
  recipient: RecipientInfoPage;
  payment: PaymentPage;
  confirmation: ConfirmationPage;
};

type CustomerBookingFixtures = {
  profile: ExecutionProfile;
  journeyRun: JourneyRun;
  responses: BookingResponseObserver;
  pages: CustomerBookingPages;
  bookingFlow: CustomerBookingFlow;
  evidenceLifecycle: void;
};

export const test = base.extend<CustomerBookingFixtures>({
  profile: async ({}, provide) => {
    const profileName = process.env.E2E_PROFILE;
    if (!profileName)
      throw new Error("E2E_PROFILE is required for browser runs");
    await provide(await loadExecutionProfile(profileName));
  },

  journeyRun: async ({ profile }, provide) => {
    await provide(
      createJourneyRun(process.env.E2E_RUN_ID ?? generateRunId(), profile),
    );
  },

  responses: async ({ page, profile }, provide) => {
    const observer = new BookingResponseObserver(page, profile);
    observer.attach();
    await provide(observer);
    observer.detach();
  },

  pages: async ({ page }, provide) => {
    await provide(createPages(page));
  },

  bookingFlow: async ({ profile, journeyRun, pages, responses }, provide) => {
    await provide(
      new CustomerBookingFlow(profile, journeyRun, pages, responses),
    );
  },

  evidenceLifecycle: [
    async ({ page, profile, journeyRun, responses }, provide, testInfo) => {
      await provide();

      if (testInfo.status === "skipped") {
        if (!page.isClosed()) await page.close();
        return;
      }

      let teardownError: unknown = null;
      try {
        responses.assertHealthy();
      } catch (error) {
        teardownError = error;
      }

      if (
        (testInfo.status !== testInfo.expectedStatus || teardownError) &&
        !journeyRun.failure
      ) {
        const error = teardownError ?? testInfo.errors.at(-1);
        journeyRun.failure = classifyFailure(
          error,
          journeyRun.currentStep,
          profileSensitiveValues(profile),
        );
        if (journeyRun.actualOutcome !== "FAILED") {
          transitionJourney(journeyRun, "FAILED");
        }
      }
      journeyRun.completedAt ??= new Date().toISOString();

      const directory = resolve(
        process.cwd(),
        "test-results",
        "customer-booking",
        journeyRun.runId,
      );
      await mkdir(directory, { recursive: true });
      let failureScreenshot: string | null = null;
      if (journeyRun.failure && !page.isClosed()) {
        failureScreenshot = "failure.png";
        await page
          .screenshot({
            path: resolve(directory, failureScreenshot),
            fullPage: true,
          })
          .catch(() => {
            failureScreenshot = null;
          });
      }

      const video = page.video();
      if (!page.isClosed()) await page.close();
      if (!video) throw new Error("Playwright video was not initialized");
      await video.saveAs(resolve(directory, "video.webm"));
      const resultPath = await writeEvidenceBundle(
        directory,
        journeyRun,
        profile,
        {
          video: "video.webm",
          failureScreenshot,
          htmlReport: "playwright-report/index.html",
        },
      );
      await testInfo.attach("booking-result", {
        path: resultPath,
        contentType: "application/json",
      });

      if (teardownError) throw teardownError;
    },
    { auto: true },
  ],
});

function createPages(page: Page): CustomerBookingPages {
  return {
    login: new LoginPage(page),
    event: new EventDetailPage(page),
    queue: new QueuePage(page),
    tickets: new TicketSelectionPage(page),
    recipient: new RecipientInfoPage(page),
    payment: new PaymentPage(page),
    confirmation: new ConfirmationPage(page),
  };
}
