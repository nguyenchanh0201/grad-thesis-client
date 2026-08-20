import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

import type { Browser, TestInfo } from "@playwright/test";

import {
  participantExecutionProfile,
  type ContentionExecutionProfile,
} from "../config/contention-profile";
import { BookingResponseObserver } from "../flows/booking-responses";
import {
  createContentionPages,
  type ContentionParticipantSession,
} from "../flows/seat-contention.flow";
import { installParticipantLabel } from "../presentation/participant-label";
import { tileParticipantWindows } from "../presentation/tile-windows";
import {
  PARTICIPANT_VIDEO_NAMES,
  shouldPauseFinalViews,
} from "./seat-contention-lifecycle";

export async function createContentionParticipantSessions(input: {
  browser: Browser;
  profile: ContentionExecutionProfile;
  testInfo: TestInfo;
}) {
  const { browser, profile, testInfo } = input;
  const videoRoot = testInfo.outputPath("participant-videos");
  await mkdir(videoRoot, { recursive: true });
  const sessions = await Promise.all(
    profile.participants.map(async (participant) => {
      const context = await browser.newContext({
        baseURL: profile.frontendUrl,
        viewport: { width: profile.windowWidth, height: profile.windowHeight },
        recordVideo: {
          dir: resolve(videoRoot, participant.id.toLowerCase()),
          size: { width: profile.windowWidth, height: profile.windowHeight },
        },
        storageState: undefined,
      });
      const page = await context.newPage();
      await installParticipantLabel(page, participant.label);
      const executionProfile = participantExecutionProfile(
        profile,
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

  if (!profile.headless && profile.tileWindows) {
    const warnings = await tileParticipantWindows(
      [
        { id: "A", context: tuple[0].context, page: tuple[0].page },
        { id: "B", context: tuple[1].context, page: tuple[1].page },
      ],
      { width: profile.windowWidth, height: profile.windowHeight },
    );
    for (const warning of warnings) {
      console.warn(
        `[E2E contention] Could not tile Customer ${warning.participant}: ${warning.message}`,
      );
    }
  }
  return tuple;
}

export async function finalizeContentionArtifacts(input: {
  profile: ContentionExecutionProfile;
  sessions: readonly [
    ContentionParticipantSession,
    ContentionParticipantSession,
  ];
  directory: string;
}) {
  const { profile, sessions, directory } = input;
  await mkdir(directory, { recursive: true });
  const openPageCount = sessions.filter(
    (session) => !session.page.isClosed(),
  ).length;
  if (
    shouldPauseFinalViews({
      keepOpen: process.env.E2E_KEEP_BROWSER_OPEN === "true",
      reviewPauseMs: profile.reviewPauseMs,
      openPageCount,
    })
  ) {
    console.log(
      `[E2E contention] Keeping both final states visible for ${profile.reviewPauseMs / 1000} seconds.`,
    );
    await new Promise((resolvePause) =>
      setTimeout(resolvePause, profile.reviewPauseMs),
    );
  }

  const screenshots = await Promise.all(
    sessions.map(async (session) => {
      if (session.page.isClosed()) return null;
      const name = `customer-${session.id.toLowerCase()}-final.png`;
      return session.page
        .screenshot({ path: resolve(directory, name), fullPage: true })
        .then(() => name)
        .catch(() => null);
    }),
  );
  for (const session of sessions) session.observer.detach();
  await Promise.all(
    sessions.map((session) => session.context.close().catch(() => undefined)),
  );

  const videos = [
    PARTICIPANT_VIDEO_NAMES.A,
    PARTICIPANT_VIDEO_NAMES.B,
  ] as const;
  await Promise.all(
    sessions.map(async (session, index) => {
      if (!session.video) {
        throw Object.assign(
          new Error(`Customer ${session.id} video was not initialized.`),
          { name: "EvidenceWriteError" },
        );
      }
      await session.video.saveAs(resolve(directory, videos[index]));
    }),
  );
  return {
    customerAVideo: videos[0],
    customerBVideo: videos[1],
    customerAScreenshot: screenshots[0],
    customerBScreenshot: screenshots[1],
    htmlReport: "playwright-report/index.html",
  };
}
