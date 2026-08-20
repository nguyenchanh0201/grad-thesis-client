import type { BrowserContext, Page } from "@playwright/test";

export type WindowTileWarning = { participant: "A" | "B"; message: string };

export async function tileParticipantWindows(
  participants: readonly [
    { id: "A"; context: BrowserContext; page: Page },
    { id: "B"; context: BrowserContext; page: Page },
  ],
  dimensions: { width: number; height: number },
): Promise<WindowTileWarning[]> {
  const warnings: WindowTileWarning[] = [];
  await Promise.all(
    participants.map(async ({ id, context, page }, index) => {
      try {
        const session = await context.newCDPSession(page);
        const target = await session.send("Browser.getWindowForTarget");
        await session.send("Browser.setWindowBounds", {
          windowId: target.windowId,
          bounds: {
            left: index * dimensions.width,
            top: 0,
            width: dimensions.width,
            height: dimensions.height,
            windowState: "normal",
          },
        });
        await session.detach();
      } catch (error) {
        warnings.push({
          participant: id,
          message:
            error instanceof Error
              ? error.message
              : "Chromium window tiling was unavailable.",
        });
      }
    }),
  );
  return warnings;
}
