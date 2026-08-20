import type { CompletionMode, ExecutionProfile } from "../config/profile";
import type {
  ContentionExecutionProfile,
  ParticipantId,
} from "../config/contention-profile";

export const PARTICIPANT_OUTCOMES = [
  "NOT_STARTED",
  "AUTHENTICATED",
  "QUEUED",
  "ADMITTED",
  "SEAT_SELECTED",
  "READY",
  "ATTEMPT_INTERCEPTED",
  "ATTEMPT_RELEASED",
  "WON",
  "LOST",
  "FAILED",
  "PAYMENT_READY",
  "PAID",
] as const;

export type ParticipantOutcome = (typeof PARTICIPANT_OUTCOMES)[number];
export type AttemptResult =
  | "CREATED"
  | "CONFLICT"
  | "SETUP_FAILURE"
  | "AUTH_OR_ADMISSION_FAILURE"
  | "BUSY"
  | "SERVER_FAILURE"
  | "TIMEOUT";

export type ContentionFailureCode =
  | "CONFIGURATION_FAILURE"
  | "AUTHENTICATION_FAILURE"
  | "ADMISSION_FAILURE"
  | "TARGET_UNAVAILABLE"
  | "SYNCHRONIZATION_FAILURE"
  | "BOTH_ATTEMPTS_FAILED"
  | "INVARIANT_VIOLATION"
  | "WINNER_CONTINUATION_FAILURE"
  | "EVIDENCE_FAILURE";

export type SafeFailure = {
  code: ContentionFailureCode;
  stage: string;
  message: string;
  httpStatus: number | null;
};

export type ReservationAttemptObservation = {
  participantId: ParticipantId;
  eventSlug: string;
  seatIndexFingerprint: string;
  interceptedAt: string;
  releasedAt: string | null;
  responseAt: string | null;
  httpStatus: number | null;
  result: AttemptResult | null;
  reservationId: string | null;
};

export type ParticipantStep = {
  name: string;
  startedAt: string;
  completedAt: string | null;
  status: "RUNNING" | "PASSED" | "FAILED";
  message: string | null;
};

export type ParticipantRun = {
  participantId: ParticipantId;
  label: string;
  startedAt: string;
  readyAt: string | null;
  interceptedAt: string | null;
  releasedAt: string | null;
  settledAt: string | null;
  actualOutcome: ParticipantOutcome;
  reservationId: string | null;
  reservationHttpStatus: number | null;
  visibleResult: "NAVIGATED_TO_INFO" | "SEAT_CONFLICT" | "FAILURE" | null;
  steps: ParticipantStep[];
  failure: SafeFailure | null;
  baselineReservationIds: string[];
};

export type ContentionClassification =
  | "ONE_WINNER_ONE_LOSER"
  | "BOTH_CREATED"
  | "BOTH_CONFLICTED"
  | "PRECONDITION_FAILED"
  | "SYNCHRONIZATION_FAILED"
  | "BOTH_ATTEMPTS_FAILED"
  | "UNVERIFIED";

export type ContentionOutcome = {
  classification: ContentionClassification;
  winnerParticipantId: ParticipantId | null;
  loserParticipantId: ParticipantId | null;
  winningReservationId: string | null;
  targetSeatStatus: "available" | "locked" | "sold" | "unknown";
  verificationScope: "TWO_PARTICIPANTS" | "DURABLE_AUDIT";
  invariantStatus: "PASS" | "FAIL" | "INCONCLUSIVE";
};

export type WinnerContinuation = {
  requestedMode: CompletionMode;
  expectedOutcome: "PAYMENT_READY" | "PAID";
  actualOutcome: "NOT_STARTED" | "PAYMENT_READY" | "PAID" | "FAILED";
  status: "NOT_REQUESTED" | "RUNNING" | "PASSED" | "FAILED";
  reservationId: string | null;
  failure: SafeFailure | null;
};

export type GateSnapshot = {
  state:
    | "DISARMED"
    | "ARMED"
    | "A_WAITING"
    | "B_WAITING"
    | "READY"
    | "RELEASING"
    | "RELEASED"
    | "TIMED_OUT"
    | "ABORTED";
  armedAt: string | null;
  releaseSkewMs: number | null;
  maxReleaseSkewMs: number;
  observations: ReservationAttemptObservation[];
  failure: SafeFailure | null;
};

export type ContentionRun = {
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
  target: { eventSlug: string; eventTitle: string; seatLabel: string };
  participants: [ParticipantRun, ParticipantRun];
  gate: GateSnapshot;
  outcome: ContentionOutcome | null;
  continuation: WinnerContinuation;
  failure: SafeFailure | null;
};

export type ClassifiedAttempt = {
  participantId: ParticipantId;
  result: AttemptResult;
  reservationId: string | null;
  httpStatus: number | null;
};

export function createContentionRun(
  runId: string,
  profile: ContentionExecutionProfile,
  now = new Date(),
): ContentionRun {
  const createParticipant = (
    id: ParticipantId,
    label: string,
  ): ParticipantRun => ({
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
      seatLabel: profile.seatLabel,
    },
    participants: [
      createParticipant("A", profile.participants[0].label),
      createParticipant("B", profile.participants[1].label),
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

export function classifyHttpAttempt(
  participantId: ParticipantId,
  httpStatus: number | null,
  reservationId: string | null,
): ClassifiedAttempt {
  let result: AttemptResult;
  if (
    httpStatus !== null &&
    httpStatus >= 200 &&
    httpStatus < 300 &&
    reservationId
  ) {
    result = "CREATED";
  } else if (httpStatus === 409 && !reservationId) {
    result = "CONFLICT";
  } else if (httpStatus === 400) {
    result = "SETUP_FAILURE";
  } else if (httpStatus === 401 || httpStatus === 403) {
    result = "AUTH_OR_ADMISSION_FAILURE";
  } else if (httpStatus === 503) {
    result = "BUSY";
  } else if (httpStatus !== null && httpStatus >= 500) {
    result = "SERVER_FAILURE";
  } else {
    result = "TIMEOUT";
  }
  return { participantId, result, reservationId, httpStatus };
}

export function resolveContentionAttempts(
  first: ClassifiedAttempt,
  second: ClassifiedAttempt,
): ContentionOutcome {
  const attempts = [first, second];
  const created = attempts.filter((item) => item.result === "CREATED");
  const conflicts = attempts.filter((item) => item.result === "CONFLICT");
  if (created.length === 2) {
    return outcome("BOTH_CREATED", null, null, null, "FAIL");
  }
  if (conflicts.length === 2) {
    return outcome("BOTH_CONFLICTED", null, null, null, "INCONCLUSIVE");
  }
  if (created.length === 1 && conflicts.length === 1) {
    const winner = created[0];
    const loser = conflicts[0];
    return outcome(
      "ONE_WINNER_ONE_LOSER",
      winner.participantId,
      loser.participantId,
      winner.reservationId,
      "INCONCLUSIVE",
    );
  }
  const precondition = attempts.some((item) =>
    ["SETUP_FAILURE", "AUTH_OR_ADMISSION_FAILURE"].includes(item.result),
  );
  return outcome(
    precondition ? "PRECONDITION_FAILED" : "BOTH_ATTEMPTS_FAILED",
    null,
    null,
    null,
    "INCONCLUSIVE",
  );
}

export function markVerified(
  value: ContentionOutcome,
  targetSeatStatus: ContentionOutcome["targetSeatStatus"],
): ContentionOutcome {
  if (value.classification !== "ONE_WINNER_ONE_LOSER") return value;
  return { ...value, targetSeatStatus, invariantStatus: "PASS" };
}

export function participantProfileFor(
  profiles: readonly [ExecutionProfile, ExecutionProfile],
  id: ParticipantId,
) {
  return profiles[id === "A" ? 0 : 1];
}

function outcome(
  classification: ContentionClassification,
  winnerParticipantId: ParticipantId | null,
  loserParticipantId: ParticipantId | null,
  winningReservationId: string | null,
  invariantStatus: ContentionOutcome["invariantStatus"],
): ContentionOutcome {
  return {
    classification,
    winnerParticipantId,
    loserParticipantId,
    winningReservationId,
    targetSeatStatus: "unknown",
    verificationScope: "TWO_PARTICIPANTS",
    invariantStatus,
  };
}
