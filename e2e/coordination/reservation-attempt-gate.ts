import { createHash } from "node:crypto";

import type { Page, Request, Route } from "@playwright/test";

import type { ParticipantId } from "../config/contention-profile";
import type {
  GateSnapshot,
  ReservationAttemptObservation,
} from "../reporting/contention-types";

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
};

type WaitingRequest = {
  id: ParticipantId;
  route: Route;
  idempotencyKey: string;
  observation: ReservationAttemptObservation;
  release: Deferred<"continue" | "abort">;
  forwarded: Deferred<void>;
};

export class ReservationAttemptGateError extends Error {
  constructor(
    readonly code:
      | "SYNCHRONIZATION_TIMEOUT"
      | "REQUEST_MISMATCH"
      | "DUPLICATE_REQUEST"
      | "RELEASE_SKEW_EXCEEDED",
    message: string,
  ) {
    super(message);
    this.name = "ReservationAttemptGateError";
  }
}

export class ReservationAttemptGate {
  private readonly waiting = new Map<ParticipantId, WaitingRequest>();
  private readonly ready = deferred<void>();
  private readonly failed = deferred<never>();
  private snapshotValue: GateSnapshot;
  private armed = false;

  constructor(
    private readonly target: {
      apiUrl: string;
      eventSlug: string;
      reservationKind?: "seated" | "ga";
      timeoutMs: number;
      maxReleaseSkewMs: number;
    },
  ) {
    this.snapshotValue = {
      state: "DISARMED",
      armedAt: null,
      releaseSkewMs: null,
      maxReleaseSkewMs: target.maxReleaseSkewMs,
      observations: [],
      failure: null,
    };
    // A rejection is always consumed by waitAndRelease's race.
    this.failed.promise.catch(() => undefined);
  }

  async arm(pages: Readonly<Record<ParticipantId, Page>>) {
    if (this.armed) {
      throw new ReservationAttemptGateError(
        "DUPLICATE_REQUEST",
        "The reservation gate was armed more than once.",
      );
    }
    this.armed = true;
    this.snapshotValue.state = "ARMED";
    this.snapshotValue.armedAt = new Date().toISOString();
    const pattern = `**/reservations/${this.target.reservationKind ?? "seated"}`;
    await Promise.all(
      (["A", "B"] as const).map((id) =>
        pages[id].route(pattern, async (route, request) => {
          await this.intercept(id, route, request);
        }),
      ),
    );
  }

  async waitAndRelease() {
    if (!this.armed) {
      throw new ReservationAttemptGateError(
        "REQUEST_MISMATCH",
        "The reservation gate must be armed before release.",
      );
    }
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        this.ready.promise,
        this.failed.promise,
        new Promise<never>((_, reject) => {
          timeoutHandle = setTimeout(
            () =>
              reject(
                new ReservationAttemptGateError(
                  "SYNCHRONIZATION_TIMEOUT",
                  "Both reservation requests did not reach the gate before timeout.",
                ),
              ),
            this.target.timeoutMs,
          );
        }),
      ]);
    } catch (error) {
      this.snapshotValue.state = "TIMED_OUT";
      this.snapshotValue.failure = {
        code: "SYNCHRONIZATION_FAILURE",
        stage: "gate",
        message:
          error instanceof Error ? error.message : "Reservation gate failed.",
        httpStatus: null,
      };
      await this.abort();
      throw error;
    } finally {
      if (timeoutHandle) clearTimeout(timeoutHandle);
    }

    const first = this.waiting.get("A")!;
    const second = this.waiting.get("B")!;
    if (
      first.observation.eventSlug !== second.observation.eventSlug ||
      first.observation.seatIndexFingerprint !==
        second.observation.seatIndexFingerprint ||
      first.idempotencyKey === second.idempotencyKey
    ) {
      await this.abort();
      throw new ReservationAttemptGateError(
        "REQUEST_MISMATCH",
        "Participants did not submit the same target with distinct attempt identities.",
      );
    }

    this.snapshotValue.state = "RELEASING";
    first.release.resolve("continue");
    second.release.resolve("continue");
    await Promise.all([first.forwarded.promise, second.forwarded.promise]);

    const releases = [
      first.observation.releasedAt,
      second.observation.releasedAt,
    ].map((value) => Date.parse(value!));
    const releaseSkewMs = Math.abs(releases[0] - releases[1]);
    this.snapshotValue.releaseSkewMs = releaseSkewMs;
    this.snapshotValue.state = "RELEASED";
    if (releaseSkewMs > this.target.maxReleaseSkewMs) {
      throw new ReservationAttemptGateError(
        "RELEASE_SKEW_EXCEEDED",
        `Reservation release skew ${releaseSkewMs}ms exceeded the configured maximum.`,
      );
    }
    return this.snapshot();
  }

  recordResponse(
    id: ParticipantId,
    response: {
      status: number;
      reservationId: string | null;
      result: ReservationAttemptObservation["result"];
    },
  ) {
    const value = this.waiting.get(id)?.observation;
    if (!value) return;
    value.responseAt = new Date().toISOString();
    value.httpStatus = response.status;
    value.reservationId = response.reservationId;
    value.result = response.result;
  }

  snapshot(): GateSnapshot {
    return {
      ...this.snapshotValue,
      observations: [...this.waiting.values()].map((item) => ({
        ...item.observation,
      })),
      failure: this.snapshotValue.failure
        ? { ...this.snapshotValue.failure }
        : null,
    };
  }

  async detach(pages: Readonly<Record<ParticipantId, Page>>) {
    const pattern = `**/reservations/${this.target.reservationKind ?? "seated"}`;
    await Promise.all(
      (["A", "B"] as const).map((id) =>
        pages[id].unroute(pattern).catch(() => undefined),
      ),
    );
  }

  private async intercept(id: ParticipantId, route: Route, request: Request) {
    if (this.waiting.has(id)) {
      await route.abort("blockedbyclient");
      this.fail(
        new ReservationAttemptGateError(
          "DUPLICATE_REQUEST",
          `Customer ${id} sent more than one reservation request.`,
        ),
      );
      return;
    }

    let metadata: ReturnType<typeof validateReservationRequestMetadata>;
    try {
      metadata = validateReservationRequestMetadata({
        requestUrl: request.url(),
        method: request.method(),
        headers: request.headers(),
        body: request.postDataJSON(),
        expectedApiUrl: this.target.apiUrl,
        expectedEventSlug: this.target.eventSlug,
        reservationKind: this.target.reservationKind ?? "seated",
      });
    } catch (error) {
      await route.abort("blockedbyclient");
      this.fail(error);
      return;
    }

    const release = deferred<"continue" | "abort">();
    const forwarded = deferred<void>();
    const observation: ReservationAttemptObservation = {
      participantId: id,
      eventSlug: metadata.eventSlug,
      seatIndexFingerprint: metadata.seatIndexFingerprint,
      interceptedAt: new Date().toISOString(),
      releasedAt: null,
      responseAt: null,
      httpStatus: null,
      result: null,
      reservationId: null,
    };
    this.waiting.set(id, {
      id,
      route,
      idempotencyKey: metadata.idempotencyKey,
      observation,
      release,
      forwarded,
    });
    this.snapshotValue.state =
      this.waiting.size === 2
        ? "READY"
        : id === "A"
          ? "A_WAITING"
          : "B_WAITING";
    if (this.waiting.size === 2) this.ready.resolve();

    const action = await release.promise;
    if (action === "abort") {
      await route.abort("timedout").catch(() => undefined);
      forwarded.resolve();
      return;
    }
    observation.releasedAt = new Date().toISOString();
    try {
      await route.continue();
    } finally {
      forwarded.resolve();
    }
  }

  private fail(error: unknown) {
    this.snapshotValue.state = "ABORTED";
    this.failed.reject(
      error instanceof Error
        ? error
        : new ReservationAttemptGateError(
            "REQUEST_MISMATCH",
            "Reservation request was invalid.",
          ),
    );
  }

  private async abort() {
    this.snapshotValue.state = "ABORTED";
    for (const item of this.waiting.values()) item.release.resolve("abort");
    await Promise.all(
      [...this.waiting.values()].map((item) => item.forwarded.promise),
    );
  }
}

export function validateReservationRequestMetadata(input: {
  requestUrl: string;
  method: string;
  headers: Record<string, string>;
  body: unknown;
  expectedApiUrl: string;
  expectedEventSlug: string;
  reservationKind?: "seated" | "ga";
}) {
  const requestUrl = new URL(input.requestUrl);
  const apiUrl = new URL(input.expectedApiUrl);
  if (
    input.method !== "POST" ||
    requestUrl.origin !== apiUrl.origin ||
    !requestUrl.pathname.endsWith(
      `/reservations/${input.reservationKind ?? "seated"}`,
    )
  ) {
    throw new ReservationAttemptGateError(
      "REQUEST_MISMATCH",
      "The intercepted request did not match the configured reservation target.",
    );
  }
  if (!input.body || typeof input.body !== "object") {
    throw new ReservationAttemptGateError(
      "REQUEST_MISMATCH",
      "Reservation request body was missing.",
    );
  }
  const body = input.body as Record<string, unknown>;
  if (body.eventSlug !== input.expectedEventSlug) {
    throw new ReservationAttemptGateError(
      "REQUEST_MISMATCH",
      "Reservation event slug did not match.",
    );
  }
  const target =
    (input.reservationKind ?? "seated") === "ga"
      ? normalizeGaItems(body.items)
      : normalizeSeatIndices(body.seatIndices);
  if (target.length !== 1) {
    throw new ReservationAttemptGateError(
      "REQUEST_MISMATCH",
      (input.reservationKind ?? "seated") === "ga"
        ? "GA contention requires exactly one valid ticket-type quantity."
        : "Contention requires exactly one valid seat index.",
    );
  }
  const idempotencyKey = input.headers["idempotency-key"];
  if (!idempotencyKey) {
    throw new ReservationAttemptGateError(
      "REQUEST_MISMATCH",
      "Reservation request did not include an idempotency identity.",
    );
  }
  return {
    eventSlug: String(body.eventSlug),
    seatIndexFingerprint: createHash("sha256")
      .update(JSON.stringify(target[0]))
      .digest("hex")
      .slice(0, 16),
    idempotencyKey,
  };
}

function normalizeSeatIndices(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map(Number)
    .filter((item) => Number.isInteger(item) && item >= 0)
    .sort((a, b) => a - b);
}

function normalizeGaItems(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const record = item as Record<string, unknown>;
      const ticketTypeId = String(record.ticketTypeId ?? "");
      const quantity = Number(record.quantity);
      return ticketTypeId && Number.isInteger(quantity) && quantity > 0
        ? [{ ticketTypeId, quantity }]
        : [];
    })
    .sort((a, b) => a.ticketTypeId.localeCompare(b.ticketTypeId));
}

function deferred<T = void>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}
