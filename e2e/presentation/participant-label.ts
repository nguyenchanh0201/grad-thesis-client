import type { Page } from "@playwright/test";

const LABEL_ID = "playwright-contention-participant-label";

export async function installParticipantLabel(page: Page, label: string) {
  const safeLabel = sanitizeParticipantLabel(label);
  await page.addInitScript(
    ({ id, text }) => {
      const render = () => {
        document.getElementById(id)?.remove();
        const badge = document.createElement("div");
        badge.id = id;
        badge.textContent = text;
        badge.setAttribute("aria-label", `Contention participant ${text}`);
        Object.assign(badge.style, {
          position: "fixed",
          top: "12px",
          right: "12px",
          zIndex: "2147483647",
          padding: "8px 14px",
          borderRadius: "999px",
          background: text.endsWith("A") ? "#155e75" : "#7c2d12",
          color: "white",
          font: "700 14px/1.2 system-ui, sans-serif",
          boxShadow: "0 4px 14px rgba(0,0,0,.3)",
          pointerEvents: "none",
        });
        document.documentElement.appendChild(badge);
      };
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", render, { once: true });
      } else {
        render();
      }
    },
    { id: LABEL_ID, text: safeLabel },
  );
  await page
    .evaluate(
      ({ id, text }) => {
        document.getElementById(id)?.remove();
        const badge = document.createElement("div");
        badge.id = id;
        badge.textContent = text;
        badge.setAttribute("aria-label", `Contention participant ${text}`);
        Object.assign(badge.style, {
          position: "fixed",
          top: "12px",
          right: "12px",
          zIndex: "2147483647",
          padding: "8px 14px",
          borderRadius: "999px",
          background: text.endsWith("A") ? "#155e75" : "#7c2d12",
          color: "white",
          font: "700 14px/1.2 system-ui, sans-serif",
          boxShadow: "0 4px 14px rgba(0,0,0,.3)",
          pointerEvents: "none",
        });
        document.documentElement.appendChild(badge);
      },
      { id: LABEL_ID, text: safeLabel },
    )
    .catch(() => undefined);
}

export function sanitizeParticipantLabel(label: string) {
  const value = label.trim();
  if (
    !/^[\p{L}\p{N}][\p{L}\p{N} _-]{0,39}$/u.test(value) ||
    value.includes("@") ||
    /password|token|secret|otp/i.test(value)
  ) {
    throw new Error(
      "Participant label must be a short non-secret display value.",
    );
  }
  return value;
}
