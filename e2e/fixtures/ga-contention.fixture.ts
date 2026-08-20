import { resolve } from "node:path";

import { test as base } from "@playwright/test";

import {
  loadContentionProfile,
  type ContentionExecutionProfile,
} from "../config/contention-profile";
import { GaContentionFlow } from "../flows/ga-contention.flow";
import type { ContentionParticipantSession } from "../flows/seat-contention.flow";
import { writeGaContentionEvidence } from "../reporting/ga-contention-evidence";
import {
  createGaContentionRun,
  type GaContentionRun,
} from "../reporting/ga-contention-types";
import { generateRunId } from "../scripts/run-customer-booking";
import {
  createContentionParticipantSessions,
  finalizeContentionArtifacts,
} from "./contention-fixture-support";

type GaContentionFixtures = {
  contentionProfile: ContentionExecutionProfile;
  gaContentionRun: GaContentionRun;
  participantSessions: readonly [
    ContentionParticipantSession,
    ContentionParticipantSession,
  ];
  gaContentionFlow: GaContentionFlow;
  gaContentionEvidenceLifecycle: void;
};

export const test = base.extend<GaContentionFixtures>({
  contentionProfile: async ({}, provide) => {
    const profileName = process.env.E2E_CONTENTION_PROFILE;
    if (!profileName) {
      throw new Error(
        "E2E_CONTENTION_PROFILE is required for GA contention runs.",
      );
    }
    const profile = await loadContentionProfile(profileName);
    if (profile.inventoryMode !== "ga") {
      throw new Error("GA contention requires E2E_INVENTORY_MODE=ga.");
    }
    await provide(profile);
  },

  gaContentionRun: async ({ contentionProfile }, provide) => {
    await provide(
      createGaContentionRun(
        process.env.E2E_RUN_ID ?? generateRunId(),
        contentionProfile,
      ),
    );
  },

  participantSessions: async (
    { browser, contentionProfile, gaContentionRun },
    provide,
    testInfo,
  ) => {
    const sessions = await createContentionParticipantSessions({
      browser,
      profile: contentionProfile,
      testInfo,
    });
    gaContentionRun.state = "PREFLIGHT_PASSED";
    await provide(sessions);
  },

  gaContentionFlow: async (
    { contentionProfile, gaContentionRun, participantSessions },
    provide,
  ) => {
    await provide(
      new GaContentionFlow(
        contentionProfile,
        gaContentionRun,
        participantSessions,
      ),
    );
  },

  gaContentionEvidenceLifecycle: [
    async (
      { contentionProfile, gaContentionRun, participantSessions },
      provide,
      testInfo,
    ) => {
      await provide();
      if (testInfo.status === "skipped") {
        await Promise.all(
          participantSessions.map((session) => session.context.close()),
        );
        return;
      }

      gaContentionRun.completedAt ??= new Date().toISOString();
      if (!gaContentionRun.outcome) {
        gaContentionRun.outcome = {
          classification: "UNVERIFIED",
          winnerParticipantId: null,
          loserParticipantId: null,
          winningReservationId: null,
          ticketTypeId: null,
          ticketTypeName: gaContentionRun.target.ticketTypeName,
          requestedQuantity: gaContentionRun.target.requestedQuantity,
          verificationScope: "TWO_PARTICIPANTS",
          invariantStatus: "INCONCLUSIVE",
        };
      }
      if (
        testInfo.status !== testInfo.expectedStatus &&
        !gaContentionRun.failure
      ) {
        gaContentionRun.failure = {
          code: "EVIDENCE_FAILURE",
          stage: "test",
          message:
            testInfo.errors.at(-1)?.message ?? "GA contention test failed.",
          httpStatus: null,
        };
      }

      const directory = resolve(
        process.cwd(),
        "test-results",
        "ga-contention",
        gaContentionRun.runId,
      );
      const artifacts = await finalizeContentionArtifacts({
        profile: contentionProfile,
        sessions: participantSessions,
        directory,
      });
      const resultPath = await writeGaContentionEvidence(
        directory,
        gaContentionRun,
        contentionProfile,
        artifacts,
      );
      await testInfo.attach("ga-contention-result", {
        path: resultPath,
        contentType: "application/json",
      });
    },
    { auto: true },
  ],
});
