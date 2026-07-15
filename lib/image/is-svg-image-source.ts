export function isSvgImageSource(src?: string | null): boolean {
  if (!src) return false;

  if (src.startsWith("data:image/svg+xml")) {
    return true;
  }

  try {
    const url = new URL(src);
    return url.pathname.toLowerCase().endsWith(".svg");
  } catch {
    return src.toLowerCase().endsWith(".svg");
  }
}
