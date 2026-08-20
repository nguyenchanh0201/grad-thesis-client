import { describe, expect, it } from "vitest";

import {
  PARTICIPANT_VIDEO_NAMES,
  participantsStillOpen,
  shouldPauseFinalViews,
} from "./seat-contention-lifecycle";

describe("seat contention fixture lifecycle", () => {
  it("requires one stable video name per participant", () => {
    expect(PARTICIPANT_VIDEO_NAMES).toEqual({
      A: "customer-a.webm",
      B: "customer-b.webm",
    });
  });

  it("uses a bounded review pause only when keep-open is disabled", () => {
    expect(
      shouldPauseFinalViews({
        keepOpen: false,
        reviewPauseMs: 10_000,
        openPageCount: 2,
      }),
    ).toBe(true);
    expect(
      shouldPauseFinalViews({
        keepOpen: true,
        reviewPauseMs: 10_000,
        openPageCount: 2,
      }),
    ).toBe(false);
  });

  it("keeps waiting until both presenter windows are closed", () => {
    expect(
      participantsStillOpen([
        { id: "A", closed: true },
        { id: "B", closed: false },
      ]),
    ).toEqual(["B"]);
    expect(
      participantsStillOpen([
        { id: "A", closed: true },
        { id: "B", closed: true },
      ]),
    ).toEqual([]);
  });
});
