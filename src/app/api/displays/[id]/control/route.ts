import { NextResponse } from "next/server";
import { db } from "@/db";
import { displays } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/** Fully Kiosk Browser — Remote Admin REST interface.
 *  Docs: Settings → Remote Administration (PLUS) → http://<device-ip>:2323/?cmd=…&password=…
 *  We proxy server-side so the browser never needs CORS or the device password.
 */

type Action = "reload" | "restart" | "screenOn" | "screenOff" | "wake" | "info" | "clearCache";

const ALLOWED: Action[] = ["reload", "restart", "screenOn", "screenOff", "wake", "info", "clearCache"];

const CMD: Record<Exclude<Action, "wake">, string> = {
  reload: "loadStartURL",
  restart: "restartApp",
  screenOn: "screenOn",
  screenOff: "screenOff",
  info: "deviceInfo",
  clearCache: "clearCache",
};

type FullySettings = {
  fullyUrl?: string;
  fullyPassword?: string;
};

/** Only allow LAN targets — this endpoint must never become an open proxy. */
function isLocalTarget(raw: string): boolean {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return false;
  const host = u.hostname.toLowerCase();
  if (host === "localhost" || host === "::1" || host.endsWith(".local")) return true;
  if (/^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return true;
  if (/^169\.254\./.test(host)) return true; // link-local
  if (/^[a-z0-9-]+$/i.test(host) && !host.includes(".")) return true; // bare hostname on LAN
  return false;
}

function fullyBase(settings: FullySettings | null): { base: string; password: string } | null {
  const url = settings?.fullyUrl?.trim();
  const password = settings?.fullyPassword?.trim();
  if (!url || !password) return null;
  if (!isLocalTarget(url)) return null;
  return { base: url.replace(/\/+$/, ""), password };
}

async function callFully(base: string, password: string, params: Record<string, string>) {
  const q = new URLSearchParams({ ...params, type: "json", password });
  const res = await fetch(`${base}/?${q.toString()}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(6000),
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* Fully returns 200 + plain text for some commands */
  }
  return { ok: res.ok, status: res.status, body: text.slice(0, 4000), json };
}

async function loadDisplay(id: string) {
  const rows = await db.select().from(displays).where(eq(displays.id, id)).limit(1);
  return rows[0] || null;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const action = body?.action as Action;
  if (!ALLOWED.includes(action)) {
    return NextResponse.json({ error: `Unknown action. Use one of: ${ALLOWED.join(", ")}` }, { status: 400 });
  }

  const display = await loadDisplay(id);
  if (!display) return NextResponse.json({ error: "Display not found" }, { status: 404 });

  const target = fullyBase(display.settings as FullySettings | null);
  if (!target) {
    return NextResponse.json(
      { error: "No Fully Kiosk player configured (set the Remote Admin URL + password, LAN address only)" },
      { status: 409 }
    );
  }

  try {
    if (action === "wake") {
      // wake = screen on, then reload the start URL so a stale scene is replaced
      await callFully(target.base, target.password, { cmd: "screenOn" });
      const reloaded = await callFully(target.base, target.password, { cmd: "loadStartURL" });
      return NextResponse.json({ ok: reloaded.ok, action, result: reloaded.json ?? reloaded.body });
    }
    const r = await callFully(target.base, target.password, { cmd: CMD[action] });
    return NextResponse.json({ ok: r.ok, action, result: r.json ?? r.body });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "request failed";
    return NextResponse.json(
      { error: `Could not reach the player at ${target.base} — is it on and on the same network? (${msg})` },
      { status: 502 }
    );
  }
}

/** GET returns a PNG screenshot straight from the player (handy as visual proof). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const display = await loadDisplay(id);
  if (!display) return NextResponse.json({ error: "Display not found" }, { status: 404 });

  const target = fullyBase(display.settings as FullySettings | null);
  if (!target) return NextResponse.json({ error: "No Fully Kiosk player configured" }, { status: 409 });

  try {
    const q = new URLSearchParams({ cmd: "getScreenshot", password: target.password });
    const res = await fetch(`${target.base}/?${q.toString()}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return NextResponse.json({ error: `Player returned ${res.status}` }, { status: 502 });
    const buf = await res.arrayBuffer();
    return new NextResponse(buf, {
      headers: {
        "Content-Type": res.headers.get("content-type") || "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "request failed";
    return NextResponse.json({ error: `Screenshot failed: ${msg}` }, { status: 502 });
  }
}
