import type { CompletionMode } from "../config/profile";
import type { ContentionParticipantSession } from "./seat-contention.flow";
import type {
  ParticipantRun,
  SafeFailure,
  WinnerContinuation,
} from "../reporting/contention-types";

export async function prepareParticipantForContention(input: {
  session: ContentionParticipantSession;
  participant: ParticipantRun;
  readBaselineReservationIds: () => Promise<string[]>;
}) {
  const { session, participant } = input;
  await runContentionStep(participant, "login", async () => {
    await session.pages.login.login(session.profile);
    participant.actualOutcome = "AUTHENTICATED";
  });
  await runContentionStep(participant, "event", async () => {
    await session.pages.event.verifyAndStartPurchase(session.profile);
    participant.baselineReservationIds =
      await input.readBaselineReservationIds();
  });
  await runContentionStep(participant, "waitroom", async () => {
    const admission = await session.pages.queue.waitForAdmission(
      session.profile,
    );
    if (admission.queued) participant.actualOutcome = "QUEUED";
    participant.actualOutcome = "ADMITTED";
  });
}

export async function continueContentionWinner(input: {
  completionMode: CompletionMode;
  session: ContentionParticipantSession;
  participant: ParticipantRun;
  reservationId: string;
  continuation: WinnerContinuation;
  verifyPaid: (gateway: "mock" | "vnpay") => Promise<void>;
}) {
  const { session, participant, reservationId, continuation } = input;
  continuation.status = "RUNNING";
  continuation.reservationId = reservationId;

  await session.pages.recipient.completeRecipient(
    session.profile,
    session.observer,
  );
  await session.pages.payment.verifyPaymentReady(
    session.profile,
    reservationId,
    session.observer,
  );
  participant.actualOutcome = "PAYMENT_READY";
  continuation.actualOutcome = "PAYMENT_READY";

  if (input.completionMode === "mock-payment-success") {
    await session.pages.payment.startMockPayment(session.profile);
    await input.verifyPaid("mock");
  } else if (input.completionMode === "vnpay-sandbox-success") {
    await session.pages.payment.completeVnpaySandboxPayment(session.profile);
    await input.verifyPaid("vnpay");
  }

  if (input.completionMode !== "reservation-only") {
    participant.actualOutcome = "PAID";
    continuation.actualOutcome = "PAID";
  }
  continuation.status = "PASSED";
}

export async function readCustomerReservations(
  session: ContentionParticipantSession,
  apiUrl: string,
  timeoutMs: number,
) {
  const payload = await readCustomerJson(
    session,
    `${apiUrl}/reservations/my?page=1&limit=100`,
    timeoutMs,
  );
  return Array.isArray(payload.data)
    ? payload.data.filter(
        (item): item is Record<string, unknown> =>
          Boolean(item) && typeof item === "object",
      )
    : [];
}

export async function readCustomerJson(
  session: ContentionParticipantSession,
  url: string,
  timeoutMs: number,
): Promise<Record<string, unknown>> {
  const response = await session.page.request.get(url, {
    headers: { Accept: "application/json" },
    timeout: timeoutMs,
  });
  if (!response.ok()) {
    throw new Error(
      `Authoritative customer read returned HTTP ${response.status()}.`,
    );
  }
  const value = await response.json();
  if (!value || typeof value !== "object") {
    throw new Error("Authoritative customer read returned an invalid payload.");
  }
  return value as Record<string, unknown>;
}

export async function runContentionStep(
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
    participant.failure = contentionFailure(
      name === "login"
        ? "AUTHENTICATION_FAILURE"
        : name === "waitroom"
          ? "ADMISSION_FAILURE"
          : name === "seat" || name === "ga-quantity"
            ? "TARGET_UNAVAILABLE"
            : "BOTH_ATTEMPTS_FAILED",
      name,
      error,
    );
    throw error;
  }
}

export async function holdContentionFinalViewsOpen(
  sessions: readonly [
    ContentionParticipantSession,
    ContentionParticipantSession,
  ],
  label: string,
) {
  if (process.env.E2E_KEEP_BROWSER_OPEN !== "true") return;
  console.log(
    `\n[E2E ${label}] Flow passed. Close both customer windows to finalize videos and evidence.\n`,
  );
  await Promise.all(
    sessions.map((session) =>
      session.page.isClosed()
        ? Promise.resolve()
        : session.page
            .waitForEvent("close", { timeout: 0 })
            .then(() => undefined),
    ),
  );
}

export function contentionFailure(
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
