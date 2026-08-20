import { mkdir, writeFile } from "node:fs/promises";
import { isAbsolute, join } from "node:path";

import { z } from "zod";

import {
  contentionSensitiveValues,
  type ContentionExecutionProfile,
} from "../config/contention-profile";
import { redactSensitiveText } from "./failure-classifier";
import type { GaContentionRun } from "./ga-contention-types";

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

export const GaContentionResultSchema = z.object({
  schemaVersion: z.literal(1),
  runId: z.string().min(1),
  profileName: z.string().min(1),
  runLabel: z.string().min(1),
  frontendOrigin: z.url(),
  apiOrigin: z.url(),
  eventSlug: z.string().min(1),
  eventTitle: z.string().min(1),
  ticketTypeName: z.string().min(1),
  configuredTicketTypeId: z.string().nullable(),
  requestedQuantityPerCustomer: z.number().int().positive(),
  startedAt: z.iso.datetime(),
  completedAt: z.iso.datetime(),
  durationMs: z.number().int().nonnegative(),
  status: z.enum(["PASSED", "FAILED", "INCONCLUSIVE"]),
  contention: z.object({
    classification: z.string(),
    winnerParticipantId: z.enum(["A", "B"]).nullable(),
    loserParticipantId: z.enum(["A", "B"]).nullable(),
    winningReservationId: z.string().nullable(),
    ticketTypeId: z.string().nullable(),
    releaseSkewMs: z.number().int().nonnegative().nullable(),
    maxReleaseSkewMs: z.number().int().positive(),
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

export type GaContentionArtifacts = z.infer<
  typeof GaContentionResultSchema
>["artifacts"];

export function createGaContentionResult(
  run: GaContentionRun,
  profile: ContentionExecutionProfile,
  artifacts: GaContentionArtifacts,
) {
  if (!run.completedAt || !run.outcome) {
    throw Object.assign(
      new Error("Cannot finalize incomplete GA contention evidence."),
      {
        name: "EvidenceWriteError",
      },
    );
  }
  const secrets = contentionSensitiveValues(profile);
  const redactFailure = (failure: typeof run.failure) =>
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

  return GaContentionResultSchema.parse({
    schemaVersion: 1,
    runId: run.runId,
    profileName: run.profileName,
    runLabel: run.runLabel,
    frontendOrigin: new URL(profile.frontendUrl).origin,
    apiOrigin: new URL(profile.apiUrl).origin,
    eventSlug: run.target.eventSlug,
    eventTitle: run.target.eventTitle,
    ticketTypeName: run.target.ticketTypeName,
    configuredTicketTypeId: run.target.configuredTicketTypeId,
    requestedQuantityPerCustomer: run.target.requestedQuantity,
    startedAt: run.startedAt,
    completedAt: run.completedAt,
    durationMs: Math.max(
      0,
      Date.parse(run.completedAt) - Date.parse(run.startedAt),
    ),
    status,
    contention: {
      classification: run.outcome.classification,
      winnerParticipantId: run.outcome.winnerParticipantId,
      loserParticipantId: run.outcome.loserParticipantId,
      winningReservationId: run.outcome.winningReservationId,
      ticketTypeId: run.outcome.ticketTypeId,
      releaseSkewMs: run.gate.releaseSkewMs,
      maxReleaseSkewMs: run.gate.maxReleaseSkewMs,
      verificationScope: run.outcome.verificationScope,
      invariantStatus: run.outcome.invariantStatus,
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
    artifacts: Object.fromEntries(
      Object.entries(artifacts).map(([key, value]) => [
        key,
        typeof value === "string" ? value.replace(/\\/g, "/") : value,
      ]),
    ),
  });
}

export async function writeGaContentionEvidence(
  directory: string,
  run: GaContentionRun,
  profile: ContentionExecutionProfile,
  artifacts: GaContentionArtifacts,
) {
  await mkdir(directory, { recursive: true });
  const result = createGaContentionResult(run, profile, artifacts);
  const path = join(directory, "ga-contention-result.json");
  await writeFile(path, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  return path;
}
