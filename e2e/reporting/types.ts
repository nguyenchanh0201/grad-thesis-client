import type { CompletionMode, ExecutionProfile } from "../config/profile";

export const JOURNEY_OUTCOMES = [
  "NOT_STARTED",
  "AUTHENTICATED",
  "QUEUED",
  "ADMITTED",
  "RESERVED",
  "PAYMENT_READY",
  "PAID",
  "FAILED",
] as const;

export type JourneyOutcome = (typeof JOURNEY_OUTCOMES)[number];
export type ExpectedOutcome = "PAYMENT_READY" | "PAID";
export type JourneyStep =
  | "preflight"
  | "login"
  | "event"
  | "waitroom"
  | "seat"
  | "reservation"
  | "recipient"
  | "payment"
  | "confirmation"
  | "evidence";

export type StepStatus = "RUNNING" | "PASSED" | "FAILED" | "SKIPPED";

export type JourneyStepResult = {
  name: JourneyStep;
  startedAt: string;
  completedAt: string | null;
  status: StepStatus;
  message: string | null;
};

export const FAILURE_CODES = [
  "INVALID_PROFILE",
  "TARGET_UNAVAILABLE",
  "TARGET_MISMATCH",
  "AUTHENTICATION_FAILED",
  "ACTIVE_CHECKOUT_PRECONDITION",
  "EVENT_PRECONDITION_FAILED",
  "WAITROOM_TERMINAL",
  "WAITROOM_TIMEOUT",
  "INVENTORY_UNAVAILABLE",
  "RESERVATION_FAILED",
  "RECIPIENT_FAILED",
  "PAYMENT_METHOD_UNAVAILABLE",
  "PAYMENT_FAILED",
  "CONFIRMATION_FAILED",
  "CRITICAL_5XX",
  "EVIDENCE_FAILED",
] as const;

export type FailureCode = (typeof FAILURE_CODES)[number];

export type FailureResult = {
  code: FailureCode;
  step: JourneyStep;
  message: string;
  httpStatus: number | null;
};

export type JourneyRun = {
  runId: string;
  profileName: string;
  runLabel: string;
  startedAt: string;
  completedAt: string | null;
  expectedOutcome: ExpectedOutcome;
  actualOutcome: JourneyOutcome;
  currentStep: JourneyStep;
  reservationId: string | null;
  eventSlug: string;
  eventTitle: string;
  seatLabel: string;
  completionMode: CompletionMode;
  steps: JourneyStepResult[];
  failure: FailureResult | null;
};

const LEGAL_TRANSITIONS: Record<JourneyOutcome, readonly JourneyOutcome[]> = {
  NOT_STARTED: ["AUTHENTICATED", "FAILED"],
  AUTHENTICATED: ["QUEUED", "ADMITTED", "FAILED"],
  QUEUED: ["ADMITTED", "FAILED"],
  ADMITTED: ["RESERVED", "FAILED"],
  RESERVED: ["PAYMENT_READY", "FAILED"],
  PAYMENT_READY: ["PAID", "FAILED"],
  PAID: [],
  FAILED: [],
};

export function expectedOutcomeFor(mode: CompletionMode): ExpectedOutcome {
  return mode === "reservation-only" ? "PAYMENT_READY" : "PAID";
}

export function createJourneyRun(
  runId: string,
  profile: ExecutionProfile,
  now = new Date(),
): JourneyRun {
  return {
    runId,
    profileName: profile.profileName,
    runLabel: profile.runLabel,
    startedAt: now.toISOString(),
    completedAt: null,
    expectedOutcome: expectedOutcomeFor(profile.completionMode),
    actualOutcome: "NOT_STARTED",
    currentStep: "preflight",
    reservationId: null,
    eventSlug: profile.eventSlug,
    eventTitle: profile.eventTitle,
    seatLabel: profile.seatLabel,
    completionMode: profile.completionMode,
    steps: [],
    failure: null,
  };
}

export function transitionJourney(run: JourneyRun, next: JourneyOutcome): void {
  if (run.actualOutcome === next) return;
  if (!LEGAL_TRANSITIONS[run.actualOutcome].includes(next)) {
    throw new Error(
      `Illegal journey transition: ${run.actualOutcome} -> ${next}`,
    );
  }
  run.actualOutcome = next;
}

export function beginJourneyStep(
  run: JourneyRun,
  name: JourneyStep,
  now = new Date(),
) {
  run.currentStep = name;
  const step: JourneyStepResult = {
    name,
    startedAt: now.toISOString(),
    completedAt: null,
    status: "RUNNING",
    message: null,
  };
  run.steps.push(step);
  return step;
}

export function completeJourneyStep(
  step: JourneyStepResult,
  status: Exclude<StepStatus, "RUNNING">,
  message: string | null = null,
  now = new Date(),
) {
  step.status = status;
  step.message = message;
  step.completedAt = now.toISOString();
}
