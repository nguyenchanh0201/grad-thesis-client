import { mkdir, readdir, writeFile } from "node:fs/promises";
import { isAbsolute, join, relative } from "node:path";

import { z } from "zod";

import {
  profileSensitiveValues,
  type ExecutionProfile,
} from "../config/profile";
import { EvidenceWriteError, redactSensitiveText } from "./failure-classifier";
import type { JourneyRun } from "./types";

const RelativeArtifactPathSchema = z
  .string()
  .min(1)
  .refine(
    (value) =>
      !isAbsolute(value) &&
      !value.replace(/\\/g, "/").split("/").includes(".."),
    "artifact paths must be relative to the evidence directory",
  );

const StepSchema = z.object({
  name: z.string(),
  startedAt: z.iso.datetime(),
  completedAt: z.iso.datetime().nullable(),
  status: z.enum(["RUNNING", "PASSED", "FAILED", "SKIPPED"]),
  message: z.string().nullable(),
});

const FailureSchema = z
  .object({
    code: z.string(),
    step: z.string(),
    message: z.string(),
    httpStatus: z.number().int().nullable(),
  })
  .nullable();

export const BookingResultSchema = z.object({
  schemaVersion: z.literal(1),
  runId: z.string().min(1),
  profileName: z.string().min(1),
  runLabel: z.string().min(1),
  frontendOrigin: z.url(),
  apiOrigin: z.url(),
  eventSlug: z.string().min(1),
  eventTitle: z.string().min(1),
  inventoryMode: z.literal("seated"),
  seatLabel: z.string().min(1),
  completionMode: z.enum([
    "reservation-only",
    "mock-payment-success",
    "vnpay-sandbox-success",
  ]),
  expectedOutcome: z.enum(["PAYMENT_READY", "PAID"]),
  actualOutcome: z.string(),
  status: z.enum(["PASSED", "FAILED"]),
  reservationId: z.string().nullable(),
  startedAt: z.iso.datetime(),
  completedAt: z.iso.datetime(),
  durationMs: z.number().int().nonnegative(),
  steps: z.array(StepSchema),
  failure: FailureSchema,
  artifacts: z.object({
    video: RelativeArtifactPathSchema,
    failureScreenshot: RelativeArtifactPathSchema.nullable(),
    htmlReport: RelativeArtifactPathSchema,
  }),
});

export type BookingResult = z.infer<typeof BookingResultSchema>;
export type EvidenceArtifactPaths = BookingResult["artifacts"];

export function createBookingResult(
  run: JourneyRun,
  profile: ExecutionProfile,
  artifacts: EvidenceArtifactPaths,
): BookingResult {
  if (!run.completedAt) {
    throw new EvidenceWriteError("Cannot serialize a run before it completes.");
  }
  const passed =
    !run.failure &&
    run.reservationId !== null &&
    run.actualOutcome === run.expectedOutcome;
  const secrets = profileSensitiveValues(profile);

  return BookingResultSchema.parse({
    schemaVersion: 1,
    runId: run.runId,
    profileName: run.profileName,
    runLabel: run.runLabel,
    frontendOrigin: new URL(profile.frontendUrl).origin,
    apiOrigin: new URL(profile.apiUrl).origin,
    eventSlug: run.eventSlug,
    eventTitle: run.eventTitle,
    inventoryMode: profile.inventoryMode,
    seatLabel: run.seatLabel,
    completionMode: run.completionMode,
    expectedOutcome: run.expectedOutcome,
    actualOutcome: run.actualOutcome,
    status: passed ? "PASSED" : "FAILED",
    reservationId: run.reservationId,
    startedAt: run.startedAt,
    completedAt: run.completedAt,
    durationMs: Math.max(
      0,
      new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime(),
    ),
    steps: run.steps.map((step) => ({
      ...step,
      message: step.message ? redactSensitiveText(step.message, secrets) : null,
    })),
    failure: run.failure
      ? {
          ...run.failure,
          message: redactSensitiveText(run.failure.message, secrets),
        }
      : null,
    artifacts: normalizeArtifactPaths(artifacts),
  });
}

export async function writeEvidenceBundle(
  directory: string,
  run: JourneyRun,
  profile: ExecutionProfile,
  artifacts: EvidenceArtifactPaths,
) {
  try {
    await mkdir(directory, { recursive: true });
    const result = createBookingResult(run, profile, artifacts);
    const resultPath = join(directory, "booking-result.json");
    await writeFile(resultPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
    return resultPath;
  } catch (error) {
    if (error instanceof EvidenceWriteError) throw error;
    throw new EvidenceWriteError(
      error instanceof Error ? error.message : "Unknown evidence write failure",
    );
  }
}

export async function findArtifactFile(
  directory: string,
  predicate: (path: string) => boolean,
): Promise<string | null> {
  const entries = await readdir(directory, { withFileTypes: true }).catch(
    () => [],
  );
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      const nested = await findArtifactFile(path, predicate);
      if (nested) return nested;
    } else if (predicate(path)) {
      return path;
    }
  }
  return null;
}

export function toRelativeArtifactPath(directory: string, path: string) {
  return relative(directory, path).replace(/\\/g, "/");
}

export function redactSecrets(
  input: unknown,
  secrets: readonly string[] = [],
): unknown {
  if (typeof input === "string") return redactSensitiveText(input, secrets);
  if (Array.isArray(input)) {
    return input.map((value) => redactSecrets(value, secrets));
  }
  if (input && typeof input === "object") {
    return Object.fromEntries(
      Object.entries(input).map(([key, value]) => {
        if (/password|token|cookie|authorization|secret/i.test(key)) {
          return [key, "[REDACTED]"];
        }
        return [key, redactSecrets(value, secrets)];
      }),
    );
  }
  return input;
}

function normalizeArtifactPaths(artifacts: EvidenceArtifactPaths) {
  return {
    video: artifacts.video.replace(/\\/g, "/"),
    failureScreenshot: artifacts.failureScreenshot?.replace(/\\/g, "/") ?? null,
    htmlReport: artifacts.htmlReport.replace(/\\/g, "/"),
  };
}
