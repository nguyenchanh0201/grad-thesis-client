import { mkdir, writeFile } from "node:fs/promises";
import { isAbsolute, join } from "node:path";

import { z } from "zod";

import {
  contentionSensitiveValues,
  type ContentionExecutionProfile,
} from "../config/contention-profile";
import { redactSensitiveText } from "./failure-classifier";
import type { ContentionRun, SafeFailure } from "./contention-types";

const relativeArtifact = z
  .string()
  .min(1)
  .refine(
    (value) =>
      !isAbsolute(value) &&
      !value.replace(/\\/g, "/").split("/").includes(".."),
    "artifact paths must be relative",
  );

const safeFailure = z
  .object({
    code: z.string(),
    stage: z.string(),
    message: z.string(),
    httpStatus: z.number().int().nullable(),
  })
  .nullable();

const participant = z.object({
  id: z.enum(["A", "B"]),
  label: z.string(),
  actualOutcome: z.string(),
  reservationHttpStatus: z.number().int().nullable(),
  reservationId: z.string().nullable(),
  readyAt: z.iso.datetime().nullable(),
  interceptedAt: z.iso.datetime().nullable(),
  releasedAt: z.iso.datetime().nullable(),
  settledAt: z.iso.datetime().nullable(),
  visibleResult: z.string().nullable(),
  steps: z.array(
    z.object({
      name: z.string(),
      startedAt: z.iso.datetime(),
      completedAt: z.iso.datetime().nullable(),
      status: z.string(),
      message: z.string().nullable(),
    }),
  ),
  failure: safeFailure,
});

export const ContentionResultSchema = z.object({
  schemaVersion: z.literal(1),
  runId: z.string().min(1),
  profileName: z.string().min(1),
  runLabel: z.string().min(1),
  frontendOrigin: z.url(),
  apiOrigin: z.url(),
  eventSlug: z.string().min(1),
  eventTitle: z.string().min(1),
  seatLabel: z.string().min(1),
  startedAt: z.iso.datetime(),
  completedAt: z.iso.datetime(),
  durationMs: z.number().int().nonnegative(),
  status: z.enum(["PASSED", "FAILED", "INCONCLUSIVE"]),
  contention: z.object({
    classification: z.string(),
    winnerParticipantId: z.enum(["A", "B"]).nullable(),
    loserParticipantId: z.enum(["A", "B"]).nullable(),
    winningReservationId: z.string().nullable(),
    releaseSkewMs: z.number().int().nonnegative().nullable(),
    maxReleaseSkewMs: z.number().int().positive(),
    targetSeatStatus: z.enum(["available", "locked", "sold", "unknown"]),
    verificationScope: z.enum(["TWO_PARTICIPANTS", "DURABLE_AUDIT"]),
    invariantStatus: z.enum(["PASS", "FAIL", "INCONCLUSIVE"]),
  }),
  participants: z.tuple([participant, participant]),
  continuation: z.object({
    requestedMode: z.string(),
    expectedOutcome: z.enum(["PAYMENT_READY", "PAID"]),
    actualOutcome: z.string(),
    status: z.string(),
    reservationId: z.string().nullable(),
    failure: safeFailure,
  }),
  failure: safeFailure,
  artifacts: z.object({
    customerAVideo: relativeArtifact,
    customerBVideo: relativeArtifact,
    customerAScreenshot: relativeArtifact.nullable(),
    customerBScreenshot: relativeArtifact.nullable(),
    htmlReport: relativeArtifact,
  }),
});

export type ContentionArtifacts = z.infer<
  typeof ContentionResultSchema
>["artifacts"];
export type ContentionResult = z.infer<typeof ContentionResultSchema>;

export function createContentionResult(
  run: ContentionRun,
  profile: ContentionExecutionProfile,
  artifacts: ContentionArtifacts,
): ContentionResult {
  if (!run.completedAt || !run.outcome) {
    throw Object.assign(
      new Error("Cannot finalize incomplete contention evidence."),
      {
        name: "EvidenceWriteError",
      },
    );
  }
  const secrets = contentionSensitiveValues(profile);
  const redactFailure = (failure: SafeFailure | null) =>
    failure
      ? { ...failure, message: redactSensitiveText(failure.message, secrets) }
      : null;
  const status =
    !run.failure &&
    run.outcome.invariantStatus === "PASS" &&
    run.outcome.classification === "ONE_WINNER_ONE_LOSER" &&
    run.continuation.status === "PASSED"
      ? "PASSED"
      : run.outcome.invariantStatus === "INCONCLUSIVE"
        ? "INCONCLUSIVE"
        : "FAILED";

  return ContentionResultSchema.parse({
    schemaVersion: 1,
    runId: run.runId,
    profileName: run.profileName,
    runLabel: run.runLabel,
    frontendOrigin: new URL(profile.frontendUrl).origin,
    apiOrigin: new URL(profile.apiUrl).origin,
    eventSlug: run.target.eventSlug,
    eventTitle: run.target.eventTitle,
    seatLabel: run.target.seatLabel,
    startedAt: run.startedAt,
    completedAt: run.completedAt,
    durationMs: Math.max(
      0,
      Date.parse(run.completedAt) - Date.parse(run.startedAt),
    ),
    status,
    contention: {
      ...run.outcome,
      releaseSkewMs: run.gate.releaseSkewMs,
      maxReleaseSkewMs: run.gate.maxReleaseSkewMs,
    },
    participants: run.participants.map((item) => ({
      id: item.participantId,
      label: item.label,
      actualOutcome: item.actualOutcome,
      reservationHttpStatus: item.reservationHttpStatus,
      reservationId: item.reservationId,
      readyAt: item.readyAt,
      interceptedAt: item.interceptedAt,
      releasedAt: item.releasedAt,
      settledAt: item.settledAt,
      visibleResult: item.visibleResult,
      steps: item.steps.map((step) => ({
        ...step,
        message: step.message
          ? redactSensitiveText(step.message, secrets)
          : null,
      })),
      failure: redactFailure(item.failure),
    })),
    continuation: {
      ...run.continuation,
      failure: redactFailure(run.continuation.failure),
    },
    failure: redactFailure(run.failure),
    artifacts: normalizeArtifacts(artifacts),
  });
}

export async function writeContentionEvidence(
  directory: string,
  run: ContentionRun,
  profile: ContentionExecutionProfile,
  artifacts: ContentionArtifacts,
) {
  await mkdir(directory, { recursive: true });
  const result = createContentionResult(run, profile, artifacts);
  const path = join(directory, "contention-result.json");
  await writeFile(path, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  return path;
}

function normalizeArtifacts(
  artifacts: ContentionArtifacts,
): ContentionArtifacts {
  return {
    customerAVideo: artifacts.customerAVideo.replace(/\\/g, "/"),
    customerBVideo: artifacts.customerBVideo.replace(/\\/g, "/"),
    customerAScreenshot:
      artifacts.customerAScreenshot?.replace(/\\/g, "/") ?? null,
    customerBScreenshot:
      artifacts.customerBScreenshot?.replace(/\\/g, "/") ?? null,
    htmlReport: artifacts.htmlReport.replace(/\\/g, "/"),
  };
}
