import type { BrowserContext, Page, Video } from "@playwright/test";

import type {
  ContentionExecutionProfile,
  ParticipantId,
} from "../config/contention-profile";
import { ReservationAttemptGate } from "../coordination/reservation-attempt-gate";
import { ConfirmationPage } from "../pages/confirmation.page";
import { EventDetailPage } from "../pages/event-detail.page";
import { LoginPage } from "../pages/login.page";
import { PaymentPage } from "../pages/payment.page";
import { QueuePage } from "../pages/queue.page";
import { RecipientInfoPage } from "../pages/recipient-info.page";
import {
  TicketSelectionPage,
  type ReservationAttemptResult,
} from "../pages/ticket-selection.page";
import type { ExecutionProfile } from "../config/profile";
import {
  classifyHttpAttempt,
  markVerified,
  resolveContentionAttempts,
  type ContentionRun,
  type ParticipantRun,
  type SafeFailure,
} from "../reporting/contention-types";
import { BookingResponseObserver } from "./booking-responses";

export type ContentionPages = {
  login: LoginPage;
  event: EventDetailPage;
  queue: QueuePage;
  tickets: TicketSelectionPage;
  recipient: RecipientInfoPage;
  payment: PaymentPage;
  confirmation: ConfirmationPage;
};

export type ContentionParticipantSession = {
  id: ParticipantId;
  label: string;
  context: BrowserContext;
  page: Page;
  video: Video | null;
  profile: ExecutionProfile;
  pages: ContentionPages;
  observer: BookingResponseObserver;
};

export class SeatContentionFlow {
  constructor(
    private readonly profile: ContentionExecutionProfile,
    private readonly run: ContentionRun,
    private readonly sessions: readonly [
      ContentionParticipantSession,
      ContentionParticipantSession,
    ],
  ) {}

  async execute() {
    this.run.state = "PREPARING_PARTICIPANTS";
    try {
      const preparation = await Promise.allSettled(
        this.sessions.map((session) => this.prepare(session)),
      );
      const preparationFailure = preparation.find(
        (result): result is PromiseRejectedResult =>
          result.status === "rejected",
      );
      if (preparationFailure) throw preparationFailure.reason;
      this.run.state = "BOTH_READY";

      const gate = new ReservationAttemptGate({
        apiUrl: this.profile.apiUrl,
        eventSlug: this.profile.eventSlug,
        timeoutMs: this.profile.gateTimeoutMs,
        maxReleaseSkewMs: this.profile.maxReleaseSkewMs,
      });
      await gate.arm(this.pageRecord());
      this.run.state = "GATE_ARMED";
      this.run.gate = gate.snapshot();

      const attemptPromises = this.sessions.map((session) =>
        session.pages.tickets.attemptReservation(
          session.profile,
          this.profile.resultTimeoutMs,
        ),
      ) as [
        Promise<ReservationAttemptResult>,
        Promise<ReservationAttemptResult>,
      ];

      try {
        this.run.gate = await gate.waitAndRelease();
        this.run.state = "REQUESTS_RELEASED";
        for (const observation of this.run.gate.observations) {
          const participant = this.participant(observation.participantId);
          participant.interceptedAt = observation.interceptedAt;
          participant.releasedAt = observation.releasedAt;
          participant.actualOutcome = "ATTEMPT_RELEASED";
        }
      } catch (error) {
        await Promise.allSettled(attemptPromises);
        this.run.gate = gate.snapshot();
        throw error;
      } finally {
        await gate.detach(this.pageRecord());
      }

      const attempts = await Promise.all(attemptPromises);
      for (let index = 0; index < attempts.length; index += 1) {
        const session = this.sessions[index];
        const participant = this.participant(session.id);
        const attempt = attempts[index];
        const classified = classifyHttpAttempt(
          session.id,
          attempt.httpStatus,
          attempt.reservationId,
        );
        gate.recordResponse(session.id, {
          status: attempt.httpStatus,
          reservationId: attempt.reservationId,
          result: classified.result,
        });
        participant.reservationHttpStatus = attempt.httpStatus;
        participant.reservationId = attempt.reservationId;
        participant.visibleResult = attempt.visibleResult;
        participant.settledAt = new Date().toISOString();
        participant.actualOutcome =
          classified.result === "CREATED"
            ? "WON"
            : classified.result === "CONFLICT"
              ? "LOST"
              : "FAILED";
      }
      this.run.gate = gate.snapshot();

      const classified = attempts.map((attempt, index) =>
        classifyHttpAttempt(
          this.sessions[index].id,
          attempt.httpStatus,
          attempt.reservationId,
        ),
      );
      this.run.outcome = resolveContentionAttempts(
        classified[0],
        classified[1],
      );

      if (this.run.outcome.classification !== "ONE_WINNER_ONE_LOSER") {
        this.failNonPassingOutcome();
      }

      await this.verifyOneOwner();
      this.run.state = "CONTENTION_RESOLVED";
      await this.continueWinner();
      this.run.state = "COMPLETED";
      this.run.completedAt = new Date().toISOString();
      return this.run;
    } catch (error) {
      this.run.completedAt ??= new Date().toISOString();
      if (!this.run.failure) {
        this.run.failure = safeFailure(
          this.run.state === "GATE_ARMED"
            ? "SYNCHRONIZATION_FAILURE"
            : "BOTH_ATTEMPTS_FAILED",
          this.run.state.toLowerCase(),
          error,
        );
      }
      if (
        !(["INVARIANT_VIOLATION", "INCONCLUSIVE"] as string[]).includes(
          this.run.state,
        )
      ) {
        this.run.state = "FAILED";
      }
      throw error;
    }
  }

  async holdFinalViewsOpen() {
    if (process.env.E2E_KEEP_BROWSER_OPEN !== "true") return;
    console.log(
      "\n[E2E contention] Flow passed. Close both customer windows to finalize videos and evidence.\n",
    );
    await Promise.all(
      this.sessions.map((session) =>
        session.page.isClosed()
          ? Promise.resolve()
          : session.page
              .waitForEvent("close", { timeout: 0 })
              .then(() => undefined),
      ),
    );
  }

  private async prepare(session: ContentionParticipantSession) {
    const participant = this.participant(session.id);
    await this.step(participant, "login", async () => {
      await session.pages.login.login(session.profile);
      participant.actualOutcome = "AUTHENTICATED";
    });
    await this.step(participant, "event", async () => {
      await session.pages.event.verifyAndStartPurchase(session.profile);
      participant.baselineReservationIds = await this.myReservationIds(session);
    });
    await this.step(participant, "waitroom", async () => {
      const admission = await session.pages.queue.waitForAdmission(
        session.profile,
      );
      if (admission.queued) participant.actualOutcome = "QUEUED";
      participant.actualOutcome = "ADMITTED";
    });
    await this.step(participant, "seat", async () => {
      const selected = await session.pages.tickets.selectConfiguredSeat(
        session.profile,
      );
      if (selected !== this.profile.seatLabel) {
        throw new Error(
          "The participant selected a different seat than the contention target.",
        );
      }
      participant.actualOutcome = "SEAT_SELECTED";
      participant.readyAt = new Date().toISOString();
      participant.actualOutcome = "READY";
    });
  }

  private async verifyOneOwner() {
    const outcome = this.run.outcome!;
    const winner = this.session(outcome.winnerParticipantId!);
    const loser = this.session(outcome.loserParticipantId!);
    const reservationId = outcome.winningReservationId!;
    const detail = await this.getJson(
      winner,
      `${this.profile.apiUrl}/reservations/${encodeURIComponent(reservationId)}`,
    );
    const reservation = unwrapData(detail);
    if (String(reservation.id ?? "") !== reservationId) {
      throw new Error(
        "Winner reservation detail did not match the create response.",
      );
    }
    if (
      reservation.eventSlug &&
      String(reservation.eventSlug) !== this.profile.eventSlug
    ) {
      throw new Error("Winner reservation belongs to a different event.");
    }
    const items = Array.isArray(reservation.items) ? reservation.items : [];
    if (
      !items.some(
        (item) =>
          item &&
          typeof item === "object" &&
          String((item as Record<string, unknown>).seatLabel ?? "") ===
            this.profile.seatLabel,
      )
    ) {
      throw new Error(
        "Winner reservation does not contain the contested seat.",
      );
    }

    const loserReservations = await this.myReservations(loser);
    const loserBaseline = new Set(
      this.participant(loser.id).baselineReservationIds,
    );
    const newLoserReservation = loserReservations.some((item) => {
      const id = String(item.id ?? "");
      return Boolean(id) && !loserBaseline.has(id);
    });
    if (newLoserReservation) {
      throw new Error(
        "The losing participant owns a new reservation created during contention.",
      );
    }

    const eventCode =
      typeof reservation.eventCode === "string" ? reservation.eventCode : null;
    const targetSeatStatus = eventCode
      ? await this.readSeatStatus(winner, eventCode)
      : "unknown";
    if (targetSeatStatus !== "locked" && targetSeatStatus !== "sold") {
      throw new Error(
        "The final public seat snapshot did not corroborate a lock or sale.",
      );
    }
    this.run.outcome = markVerified(outcome, targetSeatStatus);
  }

  private async continueWinner() {
    const outcome = this.run.outcome!;
    const winner = this.session(outcome.winnerParticipantId!);
    const participant = this.participant(winner.id);
    const reservationId = outcome.winningReservationId!;
    this.run.state = "CONTINUING_WINNER";
    this.run.continuation = {
      ...this.run.continuation,
      status: "RUNNING",
      reservationId,
    };
    try {
      await winner.pages.recipient.completeRecipient(
        winner.profile,
        winner.observer,
      );
      await winner.pages.payment.verifyPaymentReady(
        winner.profile,
        reservationId,
        winner.observer,
      );
      participant.actualOutcome = "PAYMENT_READY";
      this.run.continuation.actualOutcome = "PAYMENT_READY";

      if (this.profile.completionMode === "mock-payment-success") {
        await winner.pages.payment.startMockPayment(winner.profile);
        await winner.pages.confirmation.approveMockAndVerify(
          winner.profile,
          reservationId,
          this.profile.seatLabel,
          winner.observer,
        );
      } else if (this.profile.completionMode === "vnpay-sandbox-success") {
        await winner.pages.payment.completeVnpaySandboxPayment(winner.profile);
        await winner.pages.confirmation.verifyPaidAndTicket(
          winner.profile,
          reservationId,
          this.profile.seatLabel,
          winner.observer,
        );
      }

      if (this.profile.completionMode !== "reservation-only") {
        participant.actualOutcome = "PAID";
        this.run.continuation.actualOutcome = "PAID";
      }
      this.run.continuation.status = "PASSED";
    } catch (error) {
      this.run.continuation.actualOutcome = "FAILED";
      this.run.continuation.status = "FAILED";
      this.run.continuation.failure = safeFailure(
        "WINNER_CONTINUATION_FAILURE",
        "winner-continuation",
        error,
      );
      this.run.failure = this.run.continuation.failure;
      throw error;
    }
  }

  private failNonPassingOutcome(): never {
    const classification = this.run.outcome!.classification;
    if (classification === "BOTH_CREATED") {
      this.run.state = "INVARIANT_VIOLATION";
      this.run.failure = safeFailure(
        "INVARIANT_VIOLATION",
        "contention",
        new Error(
          "Both customers received a reservation for the contested seat.",
        ),
      );
    } else {
      this.run.state = "INCONCLUSIVE";
      this.run.failure = safeFailure(
        "BOTH_ATTEMPTS_FAILED",
        "contention",
        new Error(
          `Contention did not produce one winner and one loser: ${classification}.`,
        ),
      );
    }
    throw new Error(this.run.failure.message);
  }

  private async myReservationIds(session: ContentionParticipantSession) {
    return (await this.myReservations(session))
      .map((item) => String(item.id ?? ""))
      .filter(Boolean);
  }

  private async myReservations(session: ContentionParticipantSession) {
    const payload = await this.getJson(
      session,
      `${this.profile.apiUrl}/reservations/my?page=1&limit=100`,
    );
    const data = (payload as Record<string, unknown>).data;
    return Array.isArray(data)
      ? data.filter(
          (item): item is Record<string, unknown> =>
            Boolean(item) && typeof item === "object",
        )
      : [];
  }

  private async readSeatStatus(
    session: ContentionParticipantSession,
    eventCode: string,
  ): Promise<"available" | "locked" | "sold" | "unknown"> {
    const payload = await this.getJson(
      session,
      `${this.profile.apiUrl}/events/code/${encodeURIComponent(eventCode)}/seats`,
    );
    const sections = (payload as Record<string, unknown>).data;
    if (!Array.isArray(sections)) return "unknown";
    for (const section of sections) {
      if (!section || typeof section !== "object") continue;
      const seats = (section as Record<string, unknown>).seats;
      if (!Array.isArray(seats)) continue;
      for (const seat of seats) {
        if (!seat || typeof seat !== "object") continue;
        const value = seat as Record<string, unknown>;
        if (String(value.seatLabel ?? "") !== this.profile.seatLabel) continue;
        const rawStatus = value.status;
        if (rawStatus === 0 || rawStatus === "available") return "available";
        if (rawStatus === 1 || rawStatus === "locked") return "locked";
        if (rawStatus === 2 || rawStatus === "sold") return "sold";
        return "unknown";
      }
    }
    return "unknown";
  }

  private async getJson(
    session: ContentionParticipantSession,
    url: string,
  ): Promise<Record<string, unknown>> {
    const response = await session.page.request.get(url, {
      headers: { Accept: "application/json" },
      timeout: this.profile.resultTimeoutMs,
    });
    if (!response.ok()) {
      throw new Error(
        `Authoritative customer read returned HTTP ${response.status()}.`,
      );
    }
    const value = await response.json();
    if (!value || typeof value !== "object") {
      throw new Error(
        "Authoritative customer read returned an invalid payload.",
      );
    }
    return value as Record<string, unknown>;
  }

  private async step(
    participant: ParticipantRun,
    name: string,
    action: () => Promise<void>,
  ) {
    const result = {
      name,
      startedAt: new Date().toISOString(),
      completedAt: null,
      status: "RUNNING" as const,
      message: null,
    };
    participant.steps.push(result);
    try {
      await action();
      Object.assign(result, {
        completedAt: new Date().toISOString(),
        status: "PASSED" as const,
      });
    } catch (error) {
      Object.assign(result, {
        completedAt: new Date().toISOString(),
        status: "FAILED" as const,
        message:
          error instanceof Error ? error.message : "Participant step failed.",
      });
      participant.actualOutcome = "FAILED";
      participant.failure = safeFailure(
        name === "login"
          ? "AUTHENTICATION_FAILURE"
          : name === "waitroom"
            ? "ADMISSION_FAILURE"
            : name === "seat"
              ? "TARGET_UNAVAILABLE"
              : "BOTH_ATTEMPTS_FAILED",
        name,
        error,
      );
      throw error;
    }
  }

  private participant(id: ParticipantId) {
    return this.run.participants[id === "A" ? 0 : 1];
  }

  private session(id: ParticipantId) {
    return this.sessions[id === "A" ? 0 : 1];
  }

  private pageRecord(): Record<ParticipantId, Page> {
    return { A: this.sessions[0].page, B: this.sessions[1].page };
  }
}

export function createContentionPages(page: Page): ContentionPages {
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

function unwrapData(payload: Record<string, unknown>) {
  return payload.data && typeof payload.data === "object"
    ? (payload.data as Record<string, unknown>)
    : payload;
}

function safeFailure(
  code: SafeFailure["code"],
  stage: string,
  error: unknown,
): SafeFailure {
  return {
    code,
    stage,
    message: error instanceof Error ? error.message : "Contention flow failed.",
    httpStatus:
      error && typeof error === "object" && "httpStatus" in error
        ? Number((error as { httpStatus?: unknown }).httpStatus) || null
        : null,
  };
}
