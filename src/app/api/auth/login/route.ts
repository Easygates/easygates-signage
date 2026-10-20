import { NextResponse } from "next/server";
import { createSession, SESSION_COOKIE, SESSION_TTL_MS } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { password?: string };
  let token: string;
  try {
    token = await createSession();
  } catch {
    return NextResponse.json(
      { error: "CMS access is not configured on this server (set ADMIN_PASSWORD)." },
      { status: 500 },
    );
  }
  if (!body.password || body.password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
    secure: process.env.SESSION_COOKIE_SECURE === "true",
  });
  return res;
}
