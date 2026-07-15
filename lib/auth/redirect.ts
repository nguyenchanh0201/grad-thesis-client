const AUTH_ROUTE_PREFIX = "/auth";

export function resolvePostAuthRedirect(
  redirect: string | null | undefined,
  fallback = "/",
): string {
  if (!redirect) return fallback;
  if (!redirect.startsWith("/") || redirect.startsWith("//")) return fallback;
  if (redirect.startsWith(AUTH_ROUTE_PREFIX)) return fallback;
  return redirect;
}

export function withRedirectQuery(
  basePath: string,
  redirect: string | null | undefined,
): string {
  const safeRedirect = resolvePostAuthRedirect(redirect, "");
  if (!safeRedirect) return basePath;

  const separator = basePath.includes("?") ? "&" : "?";
  return `${basePath}${separator}redirect=${encodeURIComponent(safeRedirect)}`;
}
