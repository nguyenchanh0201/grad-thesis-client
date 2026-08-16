import { test as playwrightTest } from "@playwright/test";

import {
  profileSensitiveValues,
  type ExecutionProfile,
} from "../config/profile";
import type { CustomerBookingPages } from "../fixtures/customer-booking.fixture";
import {
  JourneyFailure,
  classifyFailure,
  redactSensitiveText,
} from "../reporting/failure-classifier";
import {
  beginJourneyStep,
  completeJourneyStep,
  transitionJourney,
  type JourneyRun,
  type JourneyStep,
} from "../reporting/types";
import type { BookingResponseObserver } from "./booking-responses";

export class CustomerBookingFlow {
  constructor(
    private readonly profile: ExecutionProfile,
    private readonly run: JourneyRun,
    private readonly pages: CustomerBookingPages,
    private readonly responses: BookingResponseObserver,
  ) {}

  async execute() {
    try {
      await this.step("login", async () => {
        await this.pages.login.login(this.profile);
        transitionJourney(this.run, "AUTHENTICATED");
      });
      await this.step("event", () =>
        this.pages.event.verifyAndStartPurchase(this.profile),
      );
      await this.step("waitroom", async () => {
        const result = await this.pages.queue.waitForAdmission(this.profile);
        if (result.queued) transitionJourney(this.run, "QUEUED");
        transitionJourney(this.run, "ADMITTED");
      });
      await this.step("seat", async () => {
        this.run.seatLabel = await this.pages.tickets.selectConfiguredSeat(
          this.profile,
        );
      });
      await this.step("reservation", async () => {
        const id = await this.pages.tickets.createReservation(
          this.profile,
          this.responses,
        );
        this.run.reservationId = id;
        transitionJourney(this.run, "RESERVED");
      });
      await this.step("recipient", () =>
        this.pages.recipient.completeRecipient(this.profile, this.responses),
      );
      await this.step("payment", async () => {
        const reservationId = this.requireReservationId();
        await this.pages.payment.verifyPaymentReady(
          this.profile,
          reservationId,
          this.responses,
        );
        transitionJourney(this.run, "PAYMENT_READY");
        if (this.profile.completionMode === "mock-payment-success") {
          await this.pages.payment.startMockPayment(this.profile);
        } else if (this.profile.completionMode === "vnpay-sandbox-success") {
          await this.pages.payment.completeVnpaySandboxPayment(this.profile);
        }
      });

      if (this.profile.completionMode !== "reservation-only") {
        await this.step("confirmation", async () => {
          if (this.profile.completionMode === "mock-payment-success") {
            await this.pages.confirmation.approveMockAndVerify(
              this.profile,
              this.requireReservationId(),
              this.run.seatLabel,
              this.responses,
            );
          } else {
            await this.pages.confirmation.verifyPaidAndTicket(
              this.profile,
              this.requireReservationId(),
              this.run.seatLabel,
              this.responses,
            );
          }
          transitionJourney(this.run, "PAID");
        });
      }

      this.run.completedAt = new Date().toISOString();
      return this.run;
    } catch (error) {
      if (this.profile.diagnosticTrace && error instanceof Error) {
        console.error(
          redactSensitiveText(
            `[E2E diagnostic] ${error.stack ?? error.message}`,
            profileSensitiveValues(this.profile),
          ),
        );
      }
      const failure = classifyFailure(
        error,
        this.run.currentStep,
        profileSensitiveValues(this.profile),
      );
      this.run.failure = failure;
      if (this.run.actualOutcome !== "FAILED") {
        transitionJourney(this.run, "FAILED");
      }
      this.run.completedAt = new Date().toISOString();
      if (error instanceof JourneyFailure) throw error;
      throw new JourneyFailure(
        failure.code,
        failure.step,
        failure.message,
        failure.httpStatus,
      );
    }
  }

  private async step<T>(name: JourneyStep, action: () => Promise<T>) {
    const result = beginJourneyStep(this.run, name);
    try {
      const value = await playwrightTest.step(name, action);
      this.responses.assertHealthy();
      completeJourneyStep(result, "PASSED");
      return value;
    } catch (error) {
      completeJourneyStep(result, "FAILED");
      throw error;
    }
  }

  private requireReservationId() {
    if (!this.run.reservationId) {
      throw new JourneyFailure(
        "RESERVATION_FAILED",
        "reservation",
        "No reservation identifier was captured.",
      );
    }
    return this.run.reservationId;
  }
}
