import { NextResponse, type NextRequest } from "next/server";
import { validateSession, SESSION_COOKIE } from "@/lib/session";

// The CMS password is optional. Until ADMIN_PASSWORD is set in .env the CMS stays open
// (the admin shows a warning banner); once it is set, /admin and every write API need
// the login cookie.
//
// What the shop screens need must always work without a login:
//   /display, GET /api/player, GET /api/uploads/*, GET /api/health,
//   POST /api/displays/:id/heartbeat, and the login routes themselves.
// Read-only admin data (GET) is open as before, EXCEPT device control, which can
// take screenshots of and send commands to the player boxes.
const HEARTBEAT = /^\/api\/displays\/[^/]+\/heartbeat$/;

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!process.env.ADMIN_PASSWORD) return NextResponse.next();

  if (pathname === "/login" || pathname.startsWith("/api/auth/")) return NextResponse.next();

  const isAdmin = pathname.startsWith("/admin");
  const isApi = pathname.startsWith("/api/");
  if (!isAdmin && !isApi) return NextResponse.next();

  if (isApi && req.method === "POST" && HEARTBEAT.test(pathname)) return NextResponse.next();
  if (isApi && req.method === "GET" && !pathname.endsWith("/control")) return NextResponse.next();

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
