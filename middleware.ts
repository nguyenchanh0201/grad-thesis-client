import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect /buy/[slug]/tickets — must have an admission cookie set by the queue page
  const match = pathname.match(/^\/buy\/([^/]+)\/tickets/);
  if (match && process.env.NEXT_PUBLIC_SKIP_BUY_SESSION !== "true") {
    const slug = match[1];
    const cookieName = `buy_session_${slug.replace(/[^a-z0-9-]/gi, "_")}`;
    const session = req.cookies.get(cookieName);
    if (!session) {
      return NextResponse.redirect(new URL(`/events/${slug}`, req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/buy/:slug/tickets/:path*"],
};
