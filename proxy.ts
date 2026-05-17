import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const SESSION_COOKIE = "refresh_token";

const PROTECTED_PATHS = ["/my-tickets", "/account"];
const GUEST_ONLY_PATHS = ["/auth/login", "/auth/register"];

function matchesAny(pathname: string, paths: string[]) {
  return paths.some((p) => pathname.startsWith(p));
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const buyMatch = pathname.match(/^\/buy\/([^/]+)\/tickets/);
  if (buyMatch) {
    const slug = buyMatch[1];
    const cookieName = `buy_session_${slug.replace(/[^a-z0-9-]/gi, "_")}`;
    if (!req.cookies.get(cookieName)) {
      return NextResponse.redirect(new URL(`/events/${slug}`, req.url));
    }
  }

  const hasSession = req.cookies.has(SESSION_COOKIE);

  if (!hasSession && matchesAny(pathname, PROTECTED_PATHS)) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (hasSession && matchesAny(pathname, GUEST_ONLY_PATHS)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/buy/:slug/tickets/:path*",
    "/my-tickets/:path*",
    "/account/:path*",
    "/auth/login",
    "/auth/register",
  ],
};
