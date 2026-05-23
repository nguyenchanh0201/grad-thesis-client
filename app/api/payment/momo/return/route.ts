import { NextRequest, NextResponse } from "next/server";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const beUrl = `${API_BASE}/payment/momo/momo-return${request.nextUrl.search}`;

  const res = await fetch(beUrl, { redirect: "manual" });
  const location = res.headers.get("location");

  if (location) {
    return NextResponse.redirect(location, { status: 302 });
  }

  return NextResponse.redirect(new URL("/events", request.url));
}
