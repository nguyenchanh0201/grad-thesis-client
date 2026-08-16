import { expect } from "@playwright/test";

import { test } from "../fixtures/customer-booking.fixture";
import type { FailureCode } from "../reporting/types";

test.skip(
  !process.env.E2E_PROFILE,
  "Select a named E2E profile through the customer-booking runner.",
);

const selectedScenario = process.env.E2E_FAILURE_SCENARIO;

const scenarios: ReadonlyArray<{
  name: string;
  scenario: string;
  code: FailureCode;
}> = [
  {
    name: "invalid credentials",
    scenario: "invalid-credentials",
    code: "AUTHENTICATION_FAILED",
  },
  {
    name: "active checkout is reported without cancellation",
    scenario: "active-checkout",
    code: "ACTIVE_CHECKOUT_PRECONDITION",
  },
  {
    name: "terminal or timed-out waitroom",
    scenario: "waitroom-failure",
    code: "WAITROOM_TERMINAL",
  },
  {
    name: "configured seat unavailable",
    scenario: "unavailable-seat",
    code: "INVENTORY_UNAVAILABLE",
  },
  {
    name: "mock payment method unavailable",
    scenario: "unavailable-mock",
    code: "PAYMENT_METHOD_UNAVAILABLE",
  },
];

test.describe("classified customer failures @booking-failure", () => {
  for (const scenario of scenarios) {
    test(`${scenario.name} @${scenario.scenario}`, async ({
      bookingFlow,
      journeyRun,
    }) => {
      test.skip(selectedScenario !== scenario.scenario);

      await expect(bookingFlow.execute()).rejects.toMatchObject({
        code: scenario.code,
      });
      expect(journeyRun.failure?.code).toBe(scenario.code);
      expect(journeyRun.actualOutcome).toBe("FAILED");
    });
  }
});
