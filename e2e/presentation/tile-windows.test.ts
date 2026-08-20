import type { BrowserContext, Page } from "@playwright/test";
import { describe, expect, it, vi } from "vitest";

import { tileParticipantWindows } from "./tile-windows";

describe("tileParticipantWindows", () => {
  it("positions the two Chromium targets side by side", async () => {
    const send = vi.fn(async (command: string) =>
      command === "Browser.getWindowForTarget" ? { windowId: 1 } : {},
    );
    const context = {
      newCDPSession: vi.fn().mockResolvedValue({
        send,
        detach: vi.fn().mockResolvedValue(undefined),
      }),
    } as unknown as BrowserContext;
    const warnings = await tileParticipantWindows(
      [
        { id: "A", context, page: {} as Page },
        { id: "B", context, page: {} as Page },
      ],
      { width: 900, height: 800 },
    );
    expect(warnings).toEqual([]);
    expect(send).toHaveBeenCalledWith(
      "Browser.setWindowBounds",
      expect.objectContaining({
        bounds: expect.objectContaining({ left: 900 }),
      }),
    );
  });

  it("returns a presentation warning without failing correctness", async () => {
    const context = {
      newCDPSession: vi.fn().mockRejectedValue(new Error("CDP unavailable")),
    } as unknown as BrowserContext;
    const warnings = await tileParticipantWindows(
      [
        { id: "A", context, page: {} as Page },
        { id: "B", context, page: {} as Page },
      ],
      { width: 900, height: 800 },
    );
    expect(warnings).toHaveLength(2);
  });
});
