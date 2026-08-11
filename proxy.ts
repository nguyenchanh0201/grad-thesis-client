import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

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

  return NextResponse.next();
}

export const config = {
  matcher: ["/buy/:slug/tickets/:path*"],
};
