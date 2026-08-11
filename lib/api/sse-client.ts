"use client";

import { API_CONFIG } from "@/core/constants";

type SseHandlers<T> = {
  signal: AbortSignal;
  onOpen?: () => void;
  onMessage: (event: string, data: T) => void;
  onError?: (error: unknown) => void;
  onClose?: () => void;
};

function buildHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: "text/event-stream",
    "st-auth-mode": "cookie",
    rid: "session",
  };

  if (typeof document !== "undefined") {
    const match = document.cookie.match(/(^|;)\s*sAntiCsrf\s*=\s*([^;]+)/);
    if (match) {
      headers["anti-csrf"] = decodeURIComponent(match[2]);
    }
  }

  return headers;
}

function parseSseFrame(frame: string): { event: string; data: unknown } | null {
  let event = "message";
  const dataLines: string[] = [];

  for (const rawLine of frame.split("\n")) {
    const line = rawLine.trimEnd();
    if (line.startsWith("event:")) {
      event = line.slice("event:".length).trim();
      continue;
    }
    if (line.startsWith("data:")) {
      dataLines.push(line.slice("data:".length).trimStart());
    }
  }

  if (dataLines.length === 0) return null;
  const dataText = dataLines.join("\n");
  try {
    return { event, data: JSON.parse(dataText) };
  } catch {
    return { event, data: dataText };
  }
}

export async function connectSse<T>(
  path: string,
  { signal, onOpen, onMessage, onError, onClose }: SseHandlers<T>,
) {
  const url = `${API_CONFIG.BASE_URL.replace(/\/$/, "")}${
    path.startsWith("/") ? path : `/${path}`
  }`;

  try {
    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
      headers: buildHeaders(),
      signal,
    });

    if (!response.ok || !response.body) {
      throw new Error(`SSE request failed with ${response.status}`);
    }

    onOpen?.();
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (!signal.aborted) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let boundary = buffer.indexOf("\n\n");
      while (boundary !== -1) {
        const frame = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        const parsed = parseSseFrame(frame);
        if (parsed) {
          onMessage(parsed.event, parsed.data as T);
        }
        boundary = buffer.indexOf("\n\n");
      }
    }
  } catch (error) {
    if (!signal.aborted) {
      onError?.(error);
    }
  } finally {
    if (!signal.aborted) {
      onClose?.();
    }
  }
}
