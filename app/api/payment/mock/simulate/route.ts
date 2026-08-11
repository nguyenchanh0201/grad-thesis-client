import { NextRequest, NextResponse } from "next/server";

const API_BASE =
  process.env.SERVER_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:5001/api/v1";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json();

  try {
    const res = await fetch(`${API_BASE}/payment/mock/ipn`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const details = await res.text().catch(() => "");
      return NextResponse.json(
        { error: "IPN failed", status: res.status, details },
        { status: 502 },
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: "Could not reach payment backend",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
