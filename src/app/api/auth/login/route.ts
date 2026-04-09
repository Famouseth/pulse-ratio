import { NextResponse } from "next/server";

const PASSWORD = "5555369";
const COOKIE_NAME = "btcvseth_auth";
// 30 days
const MAX_AGE = 60 * 60 * 24 * 30;

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { password } = body as { password?: string };

  if (password !== PASSWORD) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE,
    path: "/"
  });
  return response;
}
