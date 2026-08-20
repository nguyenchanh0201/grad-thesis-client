import type {
  ContentionExecutionProfile,
  ParticipantId,
} from "../config/contention-profile";
import {
  resolveContentionAttempts,
  type ClassifiedAttempt,
  type ContentionClassification,
  type GateSnapshot,
  type ParticipantRun,
  type SafeFailure,
  type WinnerContinuation,
} from "./contention-types";

export type GaContentionOutcome = {
  classification: ContentionClassification;
  winnerParticipantId: ParticipantId | null;
  loserParticipantId: ParticipantId | null;
  winningReservationId: string | null;
  ticketTypeId: string | null;
  ticketTypeName: string;
  requestedQuantity: number;
  verificationScope: "TWO_PARTICIPANTS" | "DURABLE_AUDIT";
  invariantStatus: "PASS" | "FAIL" | "INCONCLUSIVE";
};

export type GaContentionRun = {
  runId: string;
  profileName: string;
  runLabel: string;
  startedAt: string;
  completedAt: string | null;
  state:
    | "NOT_STARTED"
    | "PREFLIGHT_PASSED"
    | "PREPARING_PARTICIPANTS"
    | "BOTH_READY"
    | "GATE_ARMED"
    | "REQUESTS_RELEASED"
    | "CONTENTION_RESOLVED"
    | "CONTINUING_WINNER"
    | "COMPLETED"
    | "FAILED"
    | "INCONCLUSIVE"
    | "INVARIANT_VIOLATION";
  target: {
    eventSlug: string;
    eventTitle: string;
    ticketTypeName: string;
    configuredTicketTypeId: string | null;
    requestedQuantity: number;
  };
  participants: [ParticipantRun, ParticipantRun];
  gate: GateSnapshot;
  outcome: GaContentionOutcome | null;
  continuation: WinnerContinuation;
  failure: SafeFailure | null;
};

export function createGaContentionRun(
  runId: string,
  profile: ContentionExecutionProfile,
  now = new Date(),
): GaContentionRun {
  const participant = (id: ParticipantId, label: string): ParticipantRun => ({
    participantId: id,
    label,
    startedAt: now.toISOString(),
    readyAt: null,
    interceptedAt: null,
    releasedAt: null,
    settledAt: null,
    actualOutcome: "NOT_STARTED",
    reservationId: null,
    reservationHttpStatus: null,
    visibleResult: null,
    steps: [],
    failure: null,
    baselineReservationIds: [],
  });

  return {
    runId,
    profileName: profile.profileName,
    runLabel: profile.runLabel,
    startedAt: now.toISOString(),
    completedAt: null,
    state: "NOT_STARTED",
    target: {
      eventSlug: profile.eventSlug,
      eventTitle: profile.eventTitle,
      ticketTypeName: profile.ticketTypeName ?? "",
      configuredTicketTypeId: profile.ticketTypeId ?? null,
      requestedQuantity: profile.ticketQuantity,
    },
    participants: [
      participant("A", profile.participants[0].label),
      participant("B", profile.participants[1].label),
    ],
    gate: {
      state: "DISARMED",
      armedAt: null,
      releaseSkewMs: null,
      maxReleaseSkewMs: profile.maxReleaseSkewMs,
      observations: [],
      failure: null,
    },
    outcome: null,
    continuation: {
      requestedMode: profile.completionMode,
      expectedOutcome:
        profile.completionMode === "reservation-only"
          ? "PAYMENT_READY"
          : "PAID",
      actualOutcome: "NOT_STARTED",
      status: "NOT_REQUESTED",
      reservationId: null,
      failure: null,
    },
    failure: null,
  };
}

export function resolveGaContentionAttempts(
  first: ClassifiedAttempt,
  second: ClassifiedAttempt,
  profile: ContentionExecutionProfile,
): GaContentionOutcome {
  const result = resolveContentionAttempts(first, second);
  return {
    classification: result.classification,
    winnerParticipantId: result.winnerParticipantId,
    loserParticipantId: result.loserParticipantId,
    winningReservationId: result.winningReservationId,
    ticketTypeId: null,
    ticketTypeName: profile.ticketTypeName ?? "",
    requestedQuantity: profile.ticketQuantity,
    verificationScope: "TWO_PARTICIPANTS",
    invariantStatus: result.invariantStatus,
  };
}

export function markGaVerified(
  outcome: GaContentionOutcome,
  ticketTypeId: string,
) {
  return {
    ...outcome,
    ticketTypeId,
    invariantStatus: "PASS" as const,
  };
}
