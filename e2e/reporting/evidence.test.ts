import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import type { ExecutionProfile } from "../config/profile";
import { createJourneyRun } from "./types";
import {
  BookingResultSchema,
  createBookingResult,
  redactSecrets,
  writeEvidenceBundle,
} from "./evidence";

const directories: string[] = [];

function profile(): ExecutionProfile {
  return {
    profileName: "local",
    runLabel: "rehearsal",
    frontendUrl: "http://localhost:3000",
    apiUrl: "http://localhost:5004/api/v1",
    apiReadyPath: "/health/ready",
    email: "observer@example.test",
    password: "hunter2",
    eventSlug: "observer-event",
    eventTitle: "Observer Event",
    inventoryMode: "seated",
    seatLabel: "A1",
    seatSelectionMode: "exact",
    recipientFullName: "Secret Recipient",
    recipientEmail: "recipient@example.test",
    recipientCountryCode: "+84",
    recipientPhone: "901234567",
    completionMode: "reservation-only",
    navigationTimeoutMs: 30_000,
    waitroomTimeoutMs: 120_000,
    paymentTimeoutMs: 60_000,
    headless: true,
    slowMoMs: 0,
    ticketDialogReviewMs: 0,
    ticketReviewMs: 0,
    diagnosticTrace: false,
  };
}

afterEach(async () => {
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe("evidence contract", () => {
  it("serializes only allowlisted fields with relative artifact paths", () => {
    const selectedProfile = profile();
    const run = createJourneyRun(
      "20260814T123456Z-a1b2c3",
      selectedProfile,
      new Date("2026-08-14T12:34:56.000Z"),
    );
    run.actualOutcome = "PAYMENT_READY";
    run.reservationId = "42";
    run.completedAt = "2026-08-14T12:36:10.000Z";

    const result = createBookingResult(run, selectedProfile, {
      video: "video.webm",
      failureScreenshot: null,
      htmlReport: "playwright-report/index.html",
    });

    expect(BookingResultSchema.parse(result)).toEqual(result);
    expect(result.durationMs).toBe(74_000);
    expect(result.artifacts.video).toBe("video.webm");
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain("hunter2");
    expect(serialized).not.toContain("Secret Recipient");
    expect(serialized).not.toContain("recipient@example.test");
  });

  it("recursively redacts secret-like keys and known values", () => {
    const redacted = redactSecrets(
      {
        password: "hunter2",
        nested: {
          authorization: "Bearer abc",
          message: "failed for hunter2 and session-token",
        },
      },
      ["hunter2", "session-token"],
    );

    expect(JSON.stringify(redacted)).not.toContain("hunter2");
    expect(JSON.stringify(redacted)).not.toContain("session-token");
    expect(JSON.stringify(redacted)).not.toContain("Bearer abc");
  });

  it("redacts VNPay sandbox card and OTP values from failure evidence", () => {
    const selectedProfile = profile();
    selectedProfile.completionMode = "vnpay-sandbox-success";
    selectedProfile.paymentMethod = "vnpay";
    selectedProfile.vnpaySandbox = {
      origin: "https://sandbox.vnpayment.vn",
      bankCode: "NCB",
      cardNumber: "9704198526191432198",
      cardholderName: "NGUYEN VAN A",
      cardIssueDate: "07/15",
      otp: "123456",
    };
    const run = createJourneyRun("vnpay-failure", selectedProfile);
    run.actualOutcome = "FAILED";
    run.completedAt = new Date().toISOString();
    run.failure = {
      code: "PAYMENT_FAILED",
      step: "payment",
      message: "Card 9704198526191432198 failed with OTP 123456",
      httpStatus: null,
    };

    const result = createBookingResult(run, selectedProfile, {
      video: "video.webm",
      failureScreenshot: "failure.png",
      htmlReport: "playwright-report/index.html",
    });
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain("9704198526191432198");
    expect(serialized).not.toContain("123456");
  });

  it("writes a schema-valid booking-result.json", async () => {
    const directory = await mkdtemp(join(tmpdir(), "booking-evidence-"));
    directories.push(directory);
    const selectedProfile = profile();
    const run = createJourneyRun("run-1", selectedProfile);
    run.actualOutcome = "FAILED";
    run.completedAt = new Date().toISOString();
    run.failure = {
      code: "AUTHENTICATION_FAILED",
      step: "login",
      message: "The customer could not sign in.",
      httpStatus: 401,
    };

    const path = await writeEvidenceBundle(directory, run, selectedProfile, {
      video: "video.webm",
      failureScreenshot: "failure.png",
      htmlReport: "playwright-report/index.html",
    });
    const written = JSON.parse(await readFile(path, "utf8"));
    expect(BookingResultSchema.parse(written).status).toBe("FAILED");
  });
});
