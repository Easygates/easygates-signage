import { NextResponse, type NextRequest } from "next/server";
import { validateSession, SESSION_COOKIE } from "@/lib/session";

// /admin and every *write* API require a session cookie proving knowledge of
// ADMIN_PASSWORD. GET APIs stay open: screens need /api/player, /api/uploads,
// assets, settings etc. without a login, and /display is always public.
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/login" || pathname.startsWith("/api/auth/")) return NextResponse.next();

  const isAdmin = pathname.startsWith("/admin");
  const isApi = pathname.startsWith("/api/");
  if (!isAdmin && !isApi) return NextResponse.next();

  if (isApi && req.method === "GET") return NextResponse.next();
  if (await validateSession(req.cookies.get(SESSION_COOKIE)?.value ?? null)) {
    return NextResponse.next();
  }

  if (isAdmin) {
    const url = new URL("/login", req.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

export const config = { matcher: ["/admin/:path*", "/api/:path*"] };
