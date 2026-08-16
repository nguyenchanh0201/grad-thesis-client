import { expect, type Page } from "@playwright/test";

import { test } from "../fixtures/customer-booking.fixture";

test.skip(
  !process.env.E2E_PROFILE,
  "Select a named E2E profile through the customer-booking runner.",
);

test.describe("automated customer booking @booking", () => {
  test("reservation-only reaches the exact payment-ready reservation @reservation-only", async ({
    profile,
    bookingFlow,
    journeyRun,
    page,
  }) => {
    disableTimeoutWhileBrowserIsHeldOpen();
    test.skip(profile.completionMode !== "reservation-only");

    await bookingFlow.execute();

    expect(journeyRun.actualOutcome).toBe("PAYMENT_READY");
    expect(journeyRun.expectedOutcome).toBe("PAYMENT_READY");
    expect(journeyRun.reservationId).toMatch(/^\d+$/);
    expect(journeyRun.failure).toBeNull();
    await holdSuccessfulBrowserOpen(page);
  });

  test("mock checkout pays the same captured reservation @mock-payment", async ({
    profile,
    bookingFlow,
    journeyRun,
    page,
  }) => {
    disableTimeoutWhileBrowserIsHeldOpen();
    test.skip(profile.completionMode !== "mock-payment-success");

    await bookingFlow.execute();

    expect(journeyRun.actualOutcome).toBe("PAID");
    expect(journeyRun.expectedOutcome).toBe("PAID");
    expect(journeyRun.reservationId).toMatch(/^\d+$/);
    expect(journeyRun.failure).toBeNull();
    await holdSuccessfulBrowserOpen(page);
  });

  test("VNPay sandbox pays the same captured reservation @vnpay-sandbox", async ({
    profile,
    bookingFlow,
    journeyRun,
    page,
  }) => {
    disableTimeoutWhileBrowserIsHeldOpen();
    test.skip(profile.completionMode !== "vnpay-sandbox-success");

    await bookingFlow.execute();

    expect(journeyRun.actualOutcome).toBe("PAID");
    expect(journeyRun.expectedOutcome).toBe("PAID");
    expect(journeyRun.reservationId).toMatch(/^\d+$/);
    expect(journeyRun.failure).toBeNull();
    await holdSuccessfulBrowserOpen(page);
  });
});

function disableTimeoutWhileBrowserIsHeldOpen() {
  if (process.env.E2E_KEEP_BROWSER_OPEN === "true") test.setTimeout(0);
}

async function holdSuccessfulBrowserOpen(page: Page) {
  if (process.env.E2E_KEEP_BROWSER_OPEN !== "true" || page.isClosed()) return;
  console.log(
    "\n[E2E demo] Flow passed. Browser will remain open. Close the browser window to finalize video and evidence.\n",
  );
  await page.waitForEvent("close", { timeout: 0 });
}
