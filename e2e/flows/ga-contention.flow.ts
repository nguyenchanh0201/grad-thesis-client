import type { Page } from "@playwright/test";

import type {
  ContentionExecutionProfile,
  ParticipantId,
} from "../config/contention-profile";
import { ReservationAttemptGate } from "../coordination/reservation-attempt-gate";
import type { ContentionParticipantSession } from "./seat-contention.flow";
import type { ReservationAttemptResult } from "../pages/ticket-selection.page";
import { classifyHttpAttempt } from "../reporting/contention-types";
import {
  markGaVerified,
  resolveGaContentionAttempts,
  type GaContentionRun,
} from "../reporting/ga-contention-types";
import {
  contentionFailure,
  continueContentionWinner,
  holdContentionFinalViewsOpen,
  prepareParticipantForContention,
  readCustomerJson,
  readCustomerReservations,
  runContentionStep,
} from "./contention-shared";

export class GaContentionFlow {
  constructor(
    private readonly profile: ContentionExecutionProfile,
    private readonly run: GaContentionRun,
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
      const failed = preparation.find(
        (result): result is PromiseRejectedResult =>
          result.status === "rejected",
      );
      if (failed) throw failed.reason;
      this.run.state = "BOTH_READY";

      const gate = new ReservationAttemptGate({
        apiUrl: this.profile.apiUrl,
        eventSlug: this.profile.eventSlug,
        reservationKind: "ga",
        timeoutMs: this.profile.gateTimeoutMs,
        maxReleaseSkewMs: this.profile.maxReleaseSkewMs,
      });
      await gate.arm(this.pageRecord());
      this.run.state = "GATE_ARMED";
      this.run.gate = gate.snapshot();

      const attemptPromises = this.sessions.map((session) =>
        session.pages.tickets.attemptGaReservation(
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
      attempts.forEach((attempt, index) => {
        const session = this.sessions[index];
        const participant = this.participant(session.id);
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
      });
      this.run.gate = gate.snapshot();
      this.run.outcome = resolveGaContentionAttempts(
        classifyHttpAttempt(
          this.sessions[0].id,
          attempts[0].httpStatus,
          attempts[0].reservationId,
        ),
        classifyHttpAttempt(
          this.sessions[1].id,
          attempts[1].httpStatus,
          attempts[1].reservationId,
        ),
        this.profile,
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
        this.run.failure = contentionFailure(
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
    await holdContentionFinalViewsOpen(this.sessions, "GA contention");
  }

  private async prepare(session: ContentionParticipantSession) {
    const participant = this.participant(session.id);
    await prepareParticipantForContention({
      session,
      participant,
      readBaselineReservationIds: () => this.myReservationIds(session),
    });
    await runContentionStep(participant, "ga-quantity", async () => {
      await session.pages.tickets.selectConfiguredGaQuantity(this.profile);
      participant.readyAt = new Date().toISOString();
      participant.actualOutcome = "READY";
    });
  }

  private async verifyOneOwner() {
    const outcome = this.run.outcome!;
    const winner = this.session(outcome.winnerParticipantId!);
    const loser = this.session(outcome.loserParticipantId!);
    const reservationId = outcome.winningReservationId!;
    const detail = unwrapData(
      await readCustomerJson(
        winner,
        `${this.profile.apiUrl}/reservations/${encodeURIComponent(reservationId)}`,
        this.profile.resultTimeoutMs,
      ),
    );
    if (String(detail.id ?? "") !== reservationId) {
      throw new Error(
        "Winner reservation detail did not match the create response.",
      );
    }
    if (
      detail.eventSlug &&
      String(detail.eventSlug) !== this.profile.eventSlug
    ) {
      throw new Error("Winner reservation belongs to a different event.");
    }
    const items = Array.isArray(detail.items) ? detail.items : [];
    const target = items.find((item) => {
      if (!item || typeof item !== "object") return false;
      const value = item as Record<string, unknown>;
      const matchesName =
        String(value.ticketTypeName ?? "") === this.profile.ticketTypeName;
      const matchesId =
        !this.profile.ticketTypeId ||
        String(value.ticketTypeId ?? "") === this.profile.ticketTypeId;
      return matchesName && matchesId;
    }) as Record<string, unknown> | undefined;
    if (!target || Number(target.quantity) !== this.profile.ticketQuantity) {
      throw new Error(
        "Winner reservation does not contain the configured GA quantity.",
      );
    }

    const loserReservations = await this.myReservations(loser);
    const baseline = new Set(this.participant(loser.id).baselineReservationIds);
    if (
      loserReservations.some((item) => {
        const id = String(item.id ?? "");
        return Boolean(id) && !baseline.has(id);
      })
    ) {
      throw new Error(
        "The losing participant owns a new reservation created during GA contention.",
      );
    }
    this.run.outcome = markGaVerified(outcome, String(target.ticketTypeId));
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
      await continueContentionWinner({
        completionMode: this.profile.completionMode,
        session: winner,
        participant,
        reservationId,
        continuation: this.run.continuation,
        verifyPaid: async (gateway) => {
          if (gateway === "mock") {
            await winner.pages.confirmation.approveMockAndVerifyGa(
              winner.profile,
              reservationId,
              this.profile.ticketTypeName!,
              this.profile.ticketQuantity,
              winner.observer,
            );
          } else {
            await winner.pages.confirmation.verifyPaidAndGaTickets(
              winner.profile,
              reservationId,
              this.profile.ticketTypeName!,
              this.profile.ticketQuantity,
              winner.observer,
            );
          }
        },
      });
    } catch (error) {
      this.run.continuation.actualOutcome = "FAILED";
      this.run.continuation.status = "FAILED";
      this.run.continuation.failure = contentionFailure(
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
    const invariantViolation = classification === "BOTH_CREATED";
    this.run.state = invariantViolation
      ? "INVARIANT_VIOLATION"
      : "INCONCLUSIVE";
    this.run.failure = contentionFailure(
      invariantViolation ? "INVARIANT_VIOLATION" : "BOTH_ATTEMPTS_FAILED",
      "contention",
      new Error(
        invariantViolation
          ? "Both customers received the contested GA quantity."
          : `GA contention did not produce one winner and one loser: ${classification}.`,
      ),
    );
    throw new Error(this.run.failure.message);
  }

  private async myReservationIds(session: ContentionParticipantSession) {
    return (await this.myReservations(session))
      .map((item) => String(item.id ?? ""))
      .filter(Boolean);
  }

  private async myReservations(session: ContentionParticipantSession) {
    return readCustomerReservations(
      session,
      this.profile.apiUrl,
      this.profile.resultTimeoutMs,
    );
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

function unwrapData(payload: Record<string, unknown>) {
  return payload.data && typeof payload.data === "object"
    ? (payload.data as Record<string, unknown>)
    : payload;
}
