import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

import { test as base } from "@playwright/test";

import {
  loadContentionProfile,
  participantExecutionProfile,
  type ContentionExecutionProfile,
} from "../config/contention-profile";
import { BookingResponseObserver } from "../flows/booking-responses";
import {
  createContentionPages,
  SeatContentionFlow,
  type ContentionParticipantSession,
} from "../flows/seat-contention.flow";
import { installParticipantLabel } from "../presentation/participant-label";
import { tileParticipantWindows } from "../presentation/tile-windows";
import { writeContentionEvidence } from "../reporting/contention-evidence";
import {
  createContentionRun,
  type ContentionRun,
} from "../reporting/contention-types";
import { generateRunId } from "../scripts/run-customer-booking";
import {
  PARTICIPANT_VIDEO_NAMES,
  shouldPauseFinalViews,
} from "./seat-contention-lifecycle";

type SeatContentionFixtures = {
  contentionProfile: ContentionExecutionProfile;
  contentionRun: ContentionRun;
  participantSessions: readonly [
    ContentionParticipantSession,
    ContentionParticipantSession,
  ];
  contentionFlow: SeatContentionFlow;
  contentionEvidenceLifecycle: void;
};

export const test = base.extend<SeatContentionFixtures>({
  contentionProfile: async ({}, provide) => {
    const profileName = process.env.E2E_CONTENTION_PROFILE;
    if (!profileName) {
      throw new Error(
        "E2E_CONTENTION_PROFILE is required for contention runs.",
      );
    }
    await provide(await loadContentionProfile(profileName));
  },

  contentionRun: async ({ contentionProfile }, provide) => {
    await provide(
      createContentionRun(
        process.env.E2E_RUN_ID ?? generateRunId(),
        contentionProfile,
      ),
    );
  },

  participantSessions: async (
    { browser, contentionProfile, contentionRun },
    provide,
    testInfo,
  ) => {
    const videoRoot = testInfo.outputPath("participant-videos");
    await mkdir(videoRoot, { recursive: true });
    const sessions = await Promise.all(
      contentionProfile.participants.map(async (participant) => {
        const context = await browser.newContext({
          baseURL: contentionProfile.frontendUrl,
          viewport: {
            width: contentionProfile.windowWidth,
            height: contentionProfile.windowHeight,
          },
          recordVideo: {
            dir: resolve(videoRoot, participant.id.toLowerCase()),
            size: {
              width: contentionProfile.windowWidth,
              height: contentionProfile.windowHeight,
            },
          },
          storageState: undefined,
        });
        const page = await context.newPage();
        await installParticipantLabel(page, participant.label);
        const executionProfile = participantExecutionProfile(
          contentionProfile,
          participant,
        );
        const observer = new BookingResponseObserver(page, executionProfile);
        observer.attach();
        return {
          id: participant.id,
          label: participant.label,
          context,
          page,
          video: page.video(),
          profile: executionProfile,
          pages: createContentionPages(page),
          observer,
        } satisfies ContentionParticipantSession;
      }),
    );
    const tuple = sessions as [
      ContentionParticipantSession,
      ContentionParticipantSession,
    ];

    if (!contentionProfile.headless && contentionProfile.tileWindows) {
      const warnings = await tileParticipantWindows(
        [
          {
            id: "A",
            context: tuple[0].context,
            page: tuple[0].page,
          },
          {
            id: "B",
            context: tuple[1].context,
            page: tuple[1].page,
          },
        ],
        {
          width: contentionProfile.windowWidth,
          height: contentionProfile.windowHeight,
        },
      );
      for (const warning of warnings) {
        console.warn(
          `[E2E contention] Could not tile Customer ${warning.participant}: ${warning.message}`,
        );
      }
    }

    contentionRun.state = "PREFLIGHT_PASSED";
    await provide(tuple);
  },

  contentionFlow: async (
    { contentionProfile, contentionRun, participantSessions },
    provide,
  ) => {
    await provide(
      new SeatContentionFlow(
        contentionProfile,
        contentionRun,
        participantSessions,
      ),
    );
  },

  contentionEvidenceLifecycle: [
    async (
      { contentionProfile, contentionRun, participantSessions },
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

      contentionRun.completedAt ??= new Date().toISOString();
      if (!contentionRun.outcome) {
        contentionRun.outcome = {
          classification: "UNVERIFIED",
          winnerParticipantId: null,
          loserParticipantId: null,
          winningReservationId: null,
          targetSeatStatus: "unknown",
          verificationScope: "TWO_PARTICIPANTS",
          invariantStatus: "INCONCLUSIVE",
        };
      }
      if (
        testInfo.status !== testInfo.expectedStatus &&
        !contentionRun.failure
      ) {
        contentionRun.failure = {
          code: "EVIDENCE_FAILURE",
          stage: "test",
          message: testInfo.errors.at(-1)?.message ?? "Contention test failed.",
          httpStatus: null,
        };
      }

      const directory = resolve(
        process.cwd(),
        "test-results",
        "seat-contention",
        contentionRun.runId,
      );
      await mkdir(directory, { recursive: true });

      const openPageCount = participantSessions.filter(
        (session) => !session.page.isClosed(),
      ).length;
      if (
        shouldPauseFinalViews({
          keepOpen: process.env.E2E_KEEP_BROWSER_OPEN === "true",
          reviewPauseMs: contentionProfile.reviewPauseMs,
          openPageCount,
        })
      ) {
        console.log(
          `[E2E contention] Keeping both final states visible for ${contentionProfile.reviewPauseMs / 1000} seconds.`,
        );
        await new Promise((resolvePause) =>
          setTimeout(resolvePause, contentionProfile.reviewPauseMs),
        );
      }

      const screenshotNames = await Promise.all(
        participantSessions.map(async (session) => {
          if (session.page.isClosed()) return null;
          const name = `customer-${session.id.toLowerCase()}-final.png`;
          return session.page
            .screenshot({ path: resolve(directory, name), fullPage: true })
            .then(() => name)
            .catch(() => null);
        }),
      );
      for (const session of participantSessions) session.observer.detach();
      await Promise.all(
        participantSessions.map((session) =>
          session.context.close().catch(() => undefined),
        ),
      );

      const videoNames = [
        PARTICIPANT_VIDEO_NAMES.A,
        PARTICIPANT_VIDEO_NAMES.B,
      ] as const;
      await Promise.all(
        participantSessions.map(async (session, index) => {
          if (!session.video) {
            throw Object.assign(
              new Error(`Customer ${session.id} video was not initialized.`),
              { name: "EvidenceWriteError" },
            );
          }
          await session.video.saveAs(resolve(directory, videoNames[index]));
        }),
      );

      const resultPath = await writeContentionEvidence(
        directory,
        contentionRun,
        contentionProfile,
        {
          customerAVideo: videoNames[0],
          customerBVideo: videoNames[1],
          customerAScreenshot: screenshotNames[0],
          customerBScreenshot: screenshotNames[1],
          htmlReport: "playwright-report/index.html",
        },
      );
      await testInfo.attach("contention-result", {
        path: resultPath,
        contentType: "application/json",
      });
    },
    { auto: true },
  ],
});
