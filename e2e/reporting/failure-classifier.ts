import { PreflightError } from "../config/preflight";
import { ProfileValidationError } from "../config/profile";
import type { FailureCode, FailureResult, JourneyStep } from "./types";

export class JourneyFailure extends Error {
  readonly code: FailureCode;
  readonly step: JourneyStep;
  readonly httpStatus: number | null;

  constructor(
    code: FailureCode,
    step: JourneyStep,
    message: string,
    httpStatus: number | null = null,
  ) {
    super(message);
    this.name = "JourneyFailure";
    this.code = code;
    this.step = step;
    this.httpStatus = httpStatus;
  }
}

export class EvidenceWriteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EvidenceWriteError";
  }
}

const DEFAULT_CODE_BY_STEP: Record<JourneyStep, FailureCode> = {
  preflight: "TARGET_UNAVAILABLE",
  login: "AUTHENTICATION_FAILED",
  event: "EVENT_PRECONDITION_FAILED",
  waitroom: "WAITROOM_TERMINAL",
  seat: "INVENTORY_UNAVAILABLE",
  reservation: "RESERVATION_FAILED",
  recipient: "RECIPIENT_FAILED",
  payment: "PAYMENT_FAILED",
  confirmation: "CONFIRMATION_FAILED",
  evidence: "EVIDENCE_FAILED",
};

const SAFE_MESSAGES: Record<FailureCode, string> = {
  INVALID_PROFILE: "The selected execution profile is invalid.",
  TARGET_UNAVAILABLE: "The configured frontend or API target is unavailable.",
  TARGET_MISMATCH:
    "The browser target does not match the configured environment.",
  AUTHENTICATION_FAILED:
    "The customer could not sign in with the configured account.",
  ACTIVE_CHECKOUT_PRECONDITION:
    "An unfinished checkout already exists for this customer.",
  EVENT_PRECONDITION_FAILED:
    "The configured event is not currently ready for customer booking.",
  WAITROOM_TERMINAL: "The waiting room reached a terminal state.",
  WAITROOM_TIMEOUT: "Waiting-room admission exceeded the configured limit.",
  INVENTORY_UNAVAILABLE: "The configured inventory is not available.",
  RESERVATION_FAILED:
    "The application did not create the expected reservation.",
  RECIPIENT_FAILED: "Recipient details could not be persisted.",
  PAYMENT_METHOD_UNAVAILABLE:
    "The requested non-production payment method is unavailable.",
  PAYMENT_FAILED: "The configured payment flow did not complete.",
  CONFIRMATION_FAILED:
    "The authoritative confirmation did not match the customer booking.",
  CRITICAL_5XX: "A critical application request returned a server error.",
  EVIDENCE_FAILED: "The run evidence could not be finalized.",
};

export function classifyFailure(
  error: unknown,
  currentStep: JourneyStep,
  secrets: readonly string[] = [],
): FailureResult {
  let code: FailureCode;
  let step = currentStep;
  let httpStatus = extractHttpStatus(error);

  if (error instanceof JourneyFailure) {
    code = error.code;
    step = error.step;
    httpStatus = error.httpStatus;
  } else if (error instanceof ProfileValidationError) {
    code = "INVALID_PROFILE";
    step = "preflight";
  } else if (error instanceof PreflightError) {
    code = error.code;
    step = "preflight";
    httpStatus = error.status;
  } else if (error instanceof EvidenceWriteError) {
    code = "EVIDENCE_FAILED";
    step = "evidence";
  } else if (httpStatus !== null && httpStatus >= 500) {
    code = "CRITICAL_5XX";
  } else {
    code = DEFAULT_CODE_BY_STEP[currentStep];
  }

  return {
    code,
    step,
    message: redactSensitiveText(SAFE_MESSAGES[code], secrets),
    httpStatus,
  };
}

export function redactSensitiveText(
  input: string,
  secrets: readonly string[] = [],
) {
  let result = input;
  for (const secret of secrets) {
    if (secret) result = result.split(secret).join("[REDACTED]");
  }
  return result
    .replace(/Bearer\s+[A-Za-z0-9._~+\/-]+/gi, "Bearer [REDACTED]")
    .replace(
      /(password|token|cookie|authorization)\s*[:=]\s*[^\s,;]+/gi,
      "$1=[REDACTED]",
    )
    .replace(/body\s*[:=]\s*\{[^}]*\}/gi, "body=[REDACTED]");
}

function extractHttpStatus(error: unknown) {
  if (!error || typeof error !== "object") return null;
  const candidate = error as { httpStatus?: unknown; status?: unknown };
  const value = candidate.httpStatus ?? candidate.status;
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}
