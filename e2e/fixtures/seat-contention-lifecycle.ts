import type { ParticipantId } from "../config/contention-profile";

export const PARTICIPANT_VIDEO_NAMES = {
  A: "customer-a.webm",
  B: "customer-b.webm",
} as const;

export function shouldPauseFinalViews(input: {
  keepOpen: boolean;
  reviewPauseMs: number;
  openPageCount: number;
}) {
  return !input.keepOpen && input.reviewPauseMs > 0 && input.openPageCount > 0;
}

export function participantsStillOpen(
  pages: readonly { id: ParticipantId; closed: boolean }[],
) {
  return pages.filter((item) => !item.closed).map((item) => item.id);
}
